const router = require('express').Router();
const https = require('https');
const { prisma } = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

function paystackRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
        ...(data && { 'Content-Length': Buffer.byteLength(data) }),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => (raw += chunk));
      res.on('end', () => resolve(JSON.parse(raw)));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// POST /payments/initiate
router.post('/initiate', authenticate, async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await prisma.order.findFirst({ where: { id: orderId, userId: req.user.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'PENDING_PAYMENT') return res.status(400).json({ error: 'Order already paid' });

    const reference = `DA-${order.orderNumber}-${Date.now()}`;
    const payload = {
      email: req.user.email || `${req.user.phone}@drinksarena.ng`,
      amount: Math.round(Number(order.total) * 100),
      reference,
      callback_url: `${process.env.FRONTEND_URL}/checkout/verify?ref=${reference}`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber, userId: req.user.id },
    };

    const result = await paystackRequest('POST', '/transaction/initialize', payload);
    if (!result.status) return res.status(502).json({ error: 'Payment initiation failed', details: result.message });

    await prisma.payment.create({
      data: { orderId: order.id, reference, gateway: 'paystack', amount: order.total, status: 'pending' },
    });
    await prisma.order.update({ where: { id: order.id }, data: { paymentReference: reference } });

    res.json({ authorizationUrl: result.data.authorization_url, accessCode: result.data.access_code, reference });
  } catch (err) { next(err); }
});

// POST /payments/verify
router.post('/verify', authenticate, async (req, res, next) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ error: 'reference required' });

    const result = await paystackRequest('GET', `/transaction/verify/${encodeURIComponent(reference)}`);
    if (!result.status || result.data.status !== 'success') {
      return res.status(400).json({ error: 'Payment not successful', details: result.data?.gateway_response });
    }

    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (!payment) return res.status(404).json({ error: 'Payment record not found' });

    await prisma.payment.update({
      where: { reference },
      data: { status: 'success', metadata: result.data },
    });

    const order = await prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: 'PAYMENT_CONFIRMED',
        paymentMethod: result.data.channel,
        tracking: { create: { status: 'PAYMENT_CONFIRMED', note: 'Payment verified via Paystack' } },
      },
      include: { items: { include: { product: true } }, address: true },
    });

    // Award loyalty points using configurable rate from DB
    let pointsEarned = 0;
    const loyaltySetting = await prisma.loyaltySetting.findUnique({ where: { id: 'singleton' } }).catch(() => null);
    if (loyaltySetting?.isActive) {
      const earnRate = loyaltySetting.earnRateNaira || 100;
      pointsEarned = Math.floor(Number(order.total) / earnRate);
      if (pointsEarned > 0) {
        await prisma.user.update({ where: { id: req.user.id }, data: { loyaltyPoints: { increment: pointsEarned } } });
        await prisma.loyaltyHistory.create({
          data: { userId: req.user.id, points: pointsEarned, type: 'EARNED', description: `Order ${order.orderNumber}`, orderId: order.id },
        });
        await prisma.order.update({ where: { id: order.id }, data: { pointsEarned } });
      }
    }

    res.json({ order, pointsEarned });
  } catch (err) { next(err); }
});

// Paystack webhook
router.post('/webhook', async (req, res) => {
  const hash = require('crypto')
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');
  if (hash !== req.headers['x-paystack-signature']) return res.sendStatus(401);

  const event = req.body;
  if (event.event === 'charge.success') {
    const { reference } = event.data;
    const payment = await prisma.payment.findUnique({ where: { reference } }).catch(() => null);
    if (payment && payment.status !== 'success') {
      await prisma.payment.update({ where: { reference }, data: { status: 'success', metadata: event.data } });
      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: 'PAYMENT_CONFIRMED',
          tracking: { create: { status: 'PAYMENT_CONFIRMED', note: 'Webhook confirmation' } },
        },
      });
    }
  }
  res.sendStatus(200);
});

module.exports = router;
