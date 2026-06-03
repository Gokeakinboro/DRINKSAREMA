const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /categories — full tree
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: { children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(categories);
  } catch (err) { next(err); }
});

// GET /categories/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const category = await prisma.category.findFirst({
      where: { slug: req.params.slug, isActive: true },
      include: { children: { where: { isActive: true } }, parent: true },
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) { next(err); }
});

// POST /categories (admin)
router.post('/', authenticate, requireRole('ADMIN', 'CONTENT_MANAGER'), async (req, res, next) => {
  try {
    const category = await prisma.category.create({ data: req.body });
    res.status(201).json(category);
  } catch (err) { next(err); }
});

// PUT /categories/:id (admin)
router.put('/:id', authenticate, requireRole('ADMIN', 'CONTENT_MANAGER'), async (req, res, next) => {
  try {
    const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    res.json(category);
  } catch (err) { next(err); }
});

module.exports = router;
