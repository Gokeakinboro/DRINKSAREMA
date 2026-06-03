const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

// POST /promotions/validate
router.post('/validate', async (req, res, next) => {
  try {
    const { code, orderValue } = req.body;
    if (!code) return res.status(400).json({ error: 'code required' });

    const promo = await prisma.promoCode.findFirst({
      where: { code: code.toUpperCase(), isActive: true },
    });
    if (!promo) return res.status(404).json({ error: 'Invalid promo code' });

    const now = new Date();
    if (promo.startDate && promo.startDate > now) return res.status(400).json({ error: 'Promo not yet active' });
    if (promo.endDate && promo.endDate < now) return res.status(400).json({ error: 'Promo has expired' });
    if (promo.maxUses && promo.usesCount >= promo.maxUses) return res.status(400).json({ error: 'Promo code limit reached' });
    if (promo.minOrderValue && orderValue < Number(promo.minOrderValue)) {
      return res.status(400).json({ error: `Minimum order value is ₦${promo.minOrderValue}` });
    }

    let discount = 0;
    if (promo.type === 'PERCENTAGE') discount = Number(orderValue) * (Number(promo.value) / 100);
    else if (promo.type === 'FIXED') discount = Number(promo.value);

    res.json({ valid: true, type: promo.type, value: Number(promo.value), discount });
  } catch (err) { next(err); }
});

// Admin: CRUD for promo codes
router.get('/', authenticate, requireRole('ADMIN', 'CONTENT_MANAGER'), async (req, res, next) => {
  try {
    const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(promos);
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const promo = await prisma.promoCode.create({ data: { ...req.body, code: req.body.code.toUpperCase() } });
    res.status(201).json(promo);
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const promo = await prisma.promoCode.update({ where: { id: req.params.id }, data: req.body });
    res.json(promo);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.promoCode.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Promo deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;
