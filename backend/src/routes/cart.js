const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { optionalAuth } = require('../middleware/auth');

router.use(optionalAuth);

function cartWhere(req) {
  if (req.user) return { userId: req.user.id };
  const sessionId = req.headers['x-session-id'];
  if (sessionId) return { sessionId };
  return null;
}

// GET /cart
router.get('/', async (req, res, next) => {
  try {
    const where = cartWhere(req);
    if (!where) return res.json({ items: [] });
    const items = await prisma.cartItem.findMany({
      where,
      include: { product: { include: { category: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ items });
  } catch (err) { next(err); }
});

// POST /cart
router.post('/', async (req, res, next) => {
  try {
    const { productId, quantity = 1, isCase = false } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isActive) return res.status(404).json({ error: 'Product not found' });

    const userId = req.user?.id;
    const sessionId = req.headers['x-session-id'];
    if (!userId && !sessionId) return res.status(400).json({ error: 'x-session-id header required for guest cart' });

    const uniqueWhere = userId
      ? { userId_productId_isCase: { userId, productId, isCase } }
      : { sessionId_productId_isCase: { sessionId, productId, isCase } };

    const item = await prisma.cartItem.upsert({
      where: uniqueWhere,
      update: { quantity },
      create: { userId, sessionId, productId, quantity, isCase },
      include: { product: { include: { category: true } } },
    });
    res.json(item);
  } catch (err) { next(err); }
});

// PUT /cart/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity >= 1 required' });
    const item = await prisma.cartItem.update({
      where: { id: req.params.id },
      data: { quantity },
      include: { product: true },
    });
    res.json(item);
  } catch (err) { next(err); }
});

// DELETE /cart/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Item removed' });
  } catch (err) { next(err); }
});

// DELETE /cart (clear all)
router.delete('/', async (req, res, next) => {
  try {
    const where = cartWhere(req);
    if (where) await prisma.cartItem.deleteMany({ where });
    res.json({ message: 'Cart cleared' });
  } catch (err) { next(err); }
});

// POST /cart/merge — called when guest logs in
router.post('/merge', async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (!req.user || !sessionId) return res.status(400).json({ error: 'Auth and sessionId required' });
    const guestItems = await prisma.cartItem.findMany({ where: { sessionId } });
    for (const item of guestItems) {
      const existing = await prisma.cartItem.findUnique({
        where: { userId_productId_isCase: { userId: req.user.id, productId: item.productId, isCase: item.isCase } },
      });
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity },
        });
        await prisma.cartItem.delete({ where: { id: item.id } });
      } else {
        await prisma.cartItem.update({ where: { id: item.id }, data: { userId: req.user.id, sessionId: null } });
      }
    }
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { category: true } } },
    });
    res.json({ items });
  } catch (err) { next(err); }
});

module.exports = router;
