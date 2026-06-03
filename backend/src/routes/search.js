const router = require('express').Router();
const { prisma } = require('../lib/prisma');

// GET /search?q=
router.get('/', async (req, res, next) => {
  try {
    const { q, page = 1, limit = 24 } = req.query;
    if (!q || q.trim().length < 2) return res.json({ products: [], total: 0, suggestions: [] });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      isActive: true,
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { tags: { hasSome: [q.toLowerCase()] } },
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, include: { category: true }, skip, take: parseInt(limit) }),
      prisma.product.count({ where }),
    ]);

    // autocomplete suggestions
    const suggestions = await prisma.product.findMany({
      where: { isActive: true, name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true, brand: true, slug: true },
      take: 8,
    });

    res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), suggestions });
  } catch (err) { next(err); }
});

module.exports = router;
