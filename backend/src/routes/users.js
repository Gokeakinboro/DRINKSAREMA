const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /users/me/profile
router.get('/me', async (req, res) => {
  const { passwordHash: _, ...safe } = req.user;
  res.json(safe);
});

// PUT /users/me
router.put('/me', async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { firstName, lastName, email: email?.toLowerCase(), phone },
    });
    const { passwordHash: _, ...safe } = user;
    res.json(safe);
  } catch (err) { next(err); }
});

// PUT /users/me/password
router.put('/me/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ error: 'Current password incorrect' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
});

// GET /users/me/addresses
router.get('/me/addresses', async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({ where: { userId: req.user.id } });
    res.json(addresses);
  } catch (err) { next(err); }
});

// POST /users/me/addresses
router.post('/me/addresses', async (req, res, next) => {
  try {
    const { label, street, city, state, latitude, longitude, instructions, isDefault } = req.body;
    if (isDefault) await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    const address = await prisma.address.create({
      data: { userId: req.user.id, label, street, city, state, latitude, longitude, instructions, isDefault: isDefault || false },
    });
    res.status(201).json(address);
  } catch (err) { next(err); }
});

// PUT /users/me/addresses/:id
router.put('/me/addresses/:id', async (req, res, next) => {
  try {
    const { isDefault, ...data } = req.body;
    if (isDefault) await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    const address = await prisma.address.update({
      where: { id: req.params.id },
      data: { ...data, isDefault: isDefault || false },
    });
    res.json(address);
  } catch (err) { next(err); }
});

// DELETE /users/me/addresses/:id
router.delete('/me/addresses/:id', async (req, res, next) => {
  try {
    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ message: 'Address deleted' });
  } catch (err) { next(err); }
});

// GET /users/me/loyalty
router.get('/me/loyalty', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { loyaltyPoints: true } });
    const history = await prisma.loyaltyHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json({ balance: user.loyaltyPoints, history });
  } catch (err) { next(err); }
});

// GET /users/me/wishlist
router.get('/me/wishlist', async (req, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { category: true } } },
    });
    res.json(items);
  } catch (err) { next(err); }
});

// POST /users/me/wishlist
router.post('/me/wishlist', async (req, res, next) => {
  try {
    const { productId } = req.body;
    const item = await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: {},
      create: { userId: req.user.id, productId },
      include: { product: true },
    });
    res.json(item);
  } catch (err) { next(err); }
});

// DELETE /users/me/wishlist/:productId
router.delete('/me/wishlist/:productId', async (req, res, next) => {
  try {
    await prisma.wishlistItem.deleteMany({ where: { userId: req.user.id, productId: req.params.productId } });
    res.json({ message: 'Removed from wishlist' });
  } catch (err) { next(err); }
});

// GET /users/me/notifications
router.get('/me/notifications', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json(notifications);
  } catch (err) { next(err); }
});

// DELETE /users/me (soft delete)
router.delete('/me', async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.user.id }, data: { deletedAt: new Date() } });
    res.json({ message: 'Account scheduled for deletion in 30 days' });
  } catch (err) { next(err); }
});

module.exports = router;
