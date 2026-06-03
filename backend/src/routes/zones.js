const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const zones = await prisma.deliveryZone.findMany({ where: { isActive: true } });
    res.json(zones);
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const zone = await prisma.deliveryZone.create({ data: req.body });
    res.status(201).json(zone);
  } catch (err) { next(err); }
});

router.put('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const zone = await prisma.deliveryZone.update({ where: { id: req.params.id }, data: req.body });
    res.json(zone);
  } catch (err) { next(err); }
});

module.exports = router;
