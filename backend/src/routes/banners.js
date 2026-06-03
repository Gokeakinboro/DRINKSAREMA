const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const { position } = req.query;
    const now = new Date();
    const where = {
      isActive: true,
      OR: [{ startDate: null }, { startDate: { lte: now } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
    };
    if (position) where.position = position;
    const banners = await prisma.banner.findMany({ where, orderBy: { sortOrder: 'asc' } });
    res.json(banners);
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireRole('ADMIN', 'CONTENT_MANAGER'), async (req, res, next) => {
  try {
    const banner = await prisma.banner.create({ data: req.body });
    res.status(201).json(banner);
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, requireRole('ADMIN', 'CONTENT_MANAGER'), async (req, res, next) => {
  try {
    const banner = await prisma.banner.update({ where: { id: req.params.id }, data: req.body });
    res.json(banner);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.banner.delete({ where: { id: req.params.id } });
    res.json({ message: 'Banner deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
