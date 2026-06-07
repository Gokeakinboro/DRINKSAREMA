const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /products
router.get('/', async (req, res, next) => {
  try {
    const {
      category, brand, minPrice, maxPrice, minAbv, maxAbv,
      volumeMl, country, inStock, tags, sort = 'createdAt_desc',
      page = 1, limit = 24,
    } = req.query;
    // subcategory handled below after category lookup

    const where = { isActive: true };

    if (category) {
      const cat = await prisma.category.findFirst({
        where: { slug: category },
        include: { children: { where: { isActive: true } } },
      });
      if (cat) {
        const ids = [cat.id, ...cat.children.map((c) => c.id)];
        where.categoryId = { in: ids };
      }
    }

    if (req.query.subcategory) {
      where.category = { slug: req.query.subcategory };
      delete where.categoryId;
    }

    if (brand) where.brand = { contains: brand, mode: 'insensitive' };
    if (minPrice || maxPrice) where.unitPrice = {};
    if (minPrice) where.unitPrice.gte = parseFloat(minPrice);
    if (maxPrice) where.unitPrice.lte = parseFloat(maxPrice);
    if (minAbv || maxAbv) where.abv = {};
    if (minAbv) where.abv.gte = parseFloat(minAbv);
    if (maxAbv) where.abv.lte = parseFloat(maxAbv);
    if (volumeMl) where.volumeMl = parseInt(volumeMl);
    if (country) where.countryOfOrigin = { contains: country, mode: 'insensitive' };
    if (inStock === 'true') where.stockQuantity = { gt: 0 };
    if (tags) where.tags = { hasSome: tags.split(',') };

    const sortMap = {
      price_asc: { unitPrice: 'asc' },
      price_desc: { unitPrice: 'desc' },
      newest: { createdAt: 'desc' },
      createdAt_desc: { createdAt: 'desc' },
    };
    const orderBy = sortMap[sort] || { createdAt: 'desc' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, skip, take: parseInt(limit), include: { category: true } }),
      prisma.product.count({ where }),
    ]);

    res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

// GET /products/featured
router.get('/featured', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 12,
      include: { category: true },
    });
    res.json(products);
  } catch (err) { next(err); }
});

// GET /products/:id
router.get('/:id', async (req, res, next) => {
  try {
    // Only include the id filter when the param looks like a UUID — passing a non-UUID
    // string to a UUID column causes a Postgres type error and a 500 response.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const idConditions = UUID_RE.test(req.params.id)
      ? [{ id: req.params.id }, { slug: req.params.id }]
      : [{ slug: req.params.id }];
    const product = await prisma.product.findFirst({
      where: { OR: idConditions, isActive: true },
      include: {
        category: true,
        reviews: { include: { user: { select: { firstName: true, lastName: true } } }, take: 20 },
      },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const similar = await prisma.product.findMany({
      where: { categoryId: product.categoryId, isActive: true, id: { not: product.id } },
      take: 8,
      include: { category: true },
    });

    res.json({ ...product, similar });
  } catch (err) { next(err); }
});

// POST /products (admin)
router.post('/', authenticate, requireRole('ADMIN', 'CONTENT_MANAGER'), async (req, res, next) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json(product);
  } catch (err) { next(err); }
});

// PUT /products/:id (admin)
router.put('/:id', authenticate, requireRole('ADMIN', 'CONTENT_MANAGER'), async (req, res, next) => {
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    res.json(product);
  } catch (err) { next(err); }
});

// DELETE /products/:id (admin)
router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res, next) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Product deactivated' });
  } catch (err) { next(err); }
});

module.exports = router;
