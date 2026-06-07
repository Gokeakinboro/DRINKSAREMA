const router = require('express').Router();
const { prisma } = require('../lib/prisma');

// GET /settings/theme — public, no auth required
router.get('/theme', async (req, res, next) => {
  try {
    let theme = await prisma.siteTheme.findUnique({ where: { id: 'singleton' } });
    if (!theme) {
      theme = await prisma.siteTheme.create({ data: { id: 'singleton' } });
    }
    res.json(theme);
  } catch (err) { next(err); }
});

module.exports = router;
