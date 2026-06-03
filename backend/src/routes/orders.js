const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DA-${ts}-${rand}`;
}

const VAT_RATE = 0.075;

// GET /orders — customer's own orders
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.user.id },
        include: { items: { include: { product: true } }, address: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where: { userId: req.user.id } }),
    ]);
    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

// POST /orders — create order from cart
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { addressId, deliveryType = 'ASAP', scheduledAt, deliveryNotes, promoCode, redeemPoints = 0 } = req.body;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });
    if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty' });

    const address = addressId
      ? await prisma.address.findFirst({ where: { id: addressId, userId: req.user.id } })
      : await prisma.address.findFirst({ where: { userId: req.user.id, isDefault: true } });

    let subtotal = 0;
    const items = cartItems.map((ci) => {
      const price = ci.isCase && ci.product.casePrice ? Number(ci.product.casePrice) : Number(ci.product.unitPrice);
      const itemSubtotal = price * ci.quantity;
      subtotal += itemSubtotal;
      return {
        productId: ci.productId,
        quantity: ci.quantity,
        isCase: ci.isCase,
        unitPrice: price,
        subtotal: itemSubtotal,
      };
    });

    let discount = 0;
    if (promoCode) {
      const promo = await prisma.promoCode.findFirst({
        where: { code: promoCode.toUpperCase(), isActive: true },
      });
      if (promo) {
        if (promo.type === 'PERCENTAGE') discount = subtotal * (Number(promo.value) / 100);
        else if (promo.type === 'FIXED') discount = Number(promo.value);
        await prisma.promoCode.update({ where: { id: promo.id }, data: { usesCount: { increment: 1 } } });
      }
    }

    // Validate point redemption
    let pointsRedeemed = 0;
    let pointsDiscount = 0;
    if (redeemPoints > 0) {
      const loyaltySetting = await prisma.loyaltySetting.findUnique({ where: { id: 'singleton' } }).catch(() => null);
      const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { loyaltyPoints: true } });
      const minPoints = loyaltySetting?.minRedeemPoints || 100;
      const redeemRate = loyaltySetting?.redeemRate || 100; // points per ₦100 discount
      const maxPct = loyaltySetting?.maxRedeemPct || 20;
      const canRedeem = Math.min(redeemPoints, user?.loyaltyPoints || 0);
      const maxDiscountByPct = (subtotal - discount) * (maxPct / 100);
      const requestedDiscount = (canRedeem / redeemRate) * 100;
      if (canRedeem >= minPoints && loyaltySetting?.isActive) {
        pointsDiscount = Math.min(requestedDiscount, maxDiscountByPct);
        pointsRedeemed = Math.ceil(pointsDiscount / 100 * redeemRate);
        discount += pointsDiscount;
      }
    }

    const deliveryFee = subtotal >= 25000 ? 0 : 1500;
    const taxable = subtotal - discount;
    const vat = taxable * VAT_RATE;
    const total = Math.max(0, taxable + vat + deliveryFee);

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user.id,
        addressId: address?.id,
        deliveryType,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        deliveryNotes,
        promoCode,
        subtotal,
        discount,
        deliveryFee,
        vat,
        total,
        pointsRedeemed,
        items: { create: items },
        tracking: { create: { status: 'PENDING_PAYMENT' } },
      },
      include: { items: { include: { product: true } }, address: true },
    });

    // Deduct redeemed points immediately
    if (pointsRedeemed > 0) {
      await prisma.user.update({ where: { id: req.user.id }, data: { loyaltyPoints: { decrement: pointsRedeemed } } });
      await prisma.loyaltyHistory.create({
        data: { userId: req.user.id, points: -pointsRedeemed, type: 'REDEEMED', description: `Redeemed on order ${order.orderNumber}`, orderId: order.id },
      });
    }

    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });

    res.status(201).json({ ...order, pointsRedeemed });
  } catch (err) { next(err); }
});

// GET /orders/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        items: { include: { product: { include: { category: true } } } },
        address: true,
        payments: true,
        tracking: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) { next(err); }
});

// GET /orders/:id/track
router.get('/:id/track', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { tracking: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ status: order.status, tracking: order.tracking, riderId: order.riderId });
  } catch (err) { next(err); }
});

// POST /orders/:id/cancel
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!['PENDING_PAYMENT', 'PAYMENT_CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        tracking: { create: { status: 'CANCELLED', note: 'Cancelled by customer' } },
      },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;
