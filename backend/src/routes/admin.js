const router = require('express').Router();
const { prisma } = require('../lib/prisma');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('ADMIN'));

// GET /admin/dashboard
router.get('/dashboard', async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      todayRevenue,
      totalOrders,
      totalRevenue,
      totalUsers,
      pendingOrders,
      topProducts,
      recentOrders,
      lowStock,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({ where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } }, _sum: { total: true } }),
      prisma.order.count(),
      prisma.order.aggregate({ where: { status: { not: 'CANCELLED' } }, _sum: { total: true } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.order.count({ where: { status: 'PROCESSING' } }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, email: true } }, items: true },
      }),
      prisma.product.findMany({ where: { isActive: true, stockQuantity: { lt: 10 } }, take: 10 }),
    ]);

    const topProductIds = topProducts.map((p) => p.productId);
    const topProductDetails = await prisma.product.findMany({ where: { id: { in: topProductIds } } });
    const topProductsWithDetails = topProducts.map((tp) => ({
      ...tp,
      product: topProductDetails.find((p) => p.id === tp.productId),
    }));

    res.json({
      today: { orders: todayOrders, revenue: todayRevenue._sum.total || 0 },
      allTime: { orders: totalOrders, revenue: totalRevenue._sum.total || 0 },
      totalUsers,
      pendingOrders,
      topProducts: topProductsWithDetails,
      recentOrders,
      lowStock,
    });
  } catch (err) { next(err); }
});

// GET /admin/orders
router.get('/orders', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) where.OR = [{ orderNumber: { contains: search } }, { user: { email: { contains: search } } }];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          items: { include: { product: true } },
          address: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);
    res.json({ orders, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

// PUT /admin/orders/:id/status
router.put('/orders/:id/status', async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status,
        tracking: { create: { status, note } },
      },
    });
    res.json(order);
  } catch (err) { next(err); }
});

// GET /admin/users
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const where = { deletedAt: null };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, loyaltyPoints: true, createdAt: true, _count: { select: { orders: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

// PUT /admin/users/:id/role
router.put('/users/:id/role', async (req, res, next) => {
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role: req.body.role } });
    res.json({ id: user.id, role: user.role });
  } catch (err) { next(err); }
});

// GET /admin/products
router.get('/products', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const where = {};
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search } }];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, include: { category: true }, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
      prisma.product.count({ where }),
    ]);
    res.json({ products, total, pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

// PUT /admin/products/:id/stock
router.put('/products/:id/stock', async (req, res, next) => {
  try {
    const { quantity, reason } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { stockQuantity: quantity },
    });
    res.json(product);
  } catch (err) { next(err); }
});

// GET /admin/analytics?period=7d|30d|90d|12m
router.get('/analytics', async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    const now = new Date();
    let startDate, groupByFmt, labelFmt;

    if (period === '7d')  { startDate = new Date(now - 7 * 86400000);  groupByFmt = 'day'; }
    else if (period === '30d') { startDate = new Date(now - 30 * 86400000); groupByFmt = 'day'; }
    else if (period === '90d') { startDate = new Date(now - 90 * 86400000); groupByFmt = 'week'; }
    else { startDate = new Date(now.getFullYear(), 0, 1); groupByFmt = 'month'; } // 12m = this year

    const [allOrders, orderItems, newUsers, cancelledCount] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: startDate }, status: { not: 'CANCELLED' } },
        select: { total: true, createdAt: true, discount: true, deliveryFee: true, vat: true, subtotal: true },
      }),
      prisma.orderItem.findMany({
        where: { order: { createdAt: { gte: startDate }, status: { not: 'CANCELLED' } } },
        include: { product: { select: { name: true, brand: true, unitPrice: true, category: { select: { name: true } } } } },
      }),
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.order.count({ where: { createdAt: { gte: startDate }, status: 'CANCELLED' } }),
    ]);

    // Revenue by day/week/month
    const buckets = {};
    for (const o of allOrders) {
      let key;
      const d = new Date(o.createdAt);
      if (groupByFmt === 'day') key = d.toISOString().slice(0, 10);
      else if (groupByFmt === 'week') {
        const wk = Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000 + 1) / 7);
        key = `${d.getFullYear()}-W${String(wk).padStart(2, '0')}`;
      } else key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      if (!buckets[key]) buckets[key] = { revenue: 0, orders: 0 };
      buckets[key].revenue += Number(o.total);
      buckets[key].orders += 1;
    }
    const revenueChart = Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, v]) => ({ label, ...v }));

    // Revenue and volume by category
    const catMap = {};
    for (const item of orderItems) {
      const cat = item.product?.category?.name || 'Uncategorised';
      if (!catMap[cat]) catMap[cat] = { revenue: 0, units: 0 };
      catMap[cat].revenue += Number(item.subtotal);
      catMap[cat].units += item.quantity;
    }
    const byCategory = Object.entries(catMap)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue);

    // Top products by revenue
    const prodMap = {};
    for (const item of orderItems) {
      const id = item.productId;
      if (!prodMap[id]) prodMap[id] = { name: item.product?.name, brand: item.product?.brand, revenue: 0, units: 0 };
      prodMap[id].revenue += Number(item.subtotal);
      prodMap[id].units += item.quantity;
    }
    const topProducts = Object.values(prodMap)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10);

    const totalRevenue = allOrders.reduce((s, o) => s + Number(o.total), 0);
    const totalOrders = allOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      period,
      totalRevenue,
      totalOrders,
      avgOrderValue,
      newUsers,
      cancelledCount,
      revenueChart,
      byCategory,
      topProducts,
    });
  } catch (err) { next(err); }
});

// GET /admin/analytics/export?period=7d|30d|90d|12m&type=orders|products|categories
router.get('/analytics/export', async (req, res, next) => {
  try {
    const { period = '30d', type = 'orders' } = req.query;
    const now = new Date();
    let startDate;
    if (period === '7d') startDate = new Date(now - 7 * 86400000);
    else if (period === '30d') startDate = new Date(now - 30 * 86400000);
    else if (period === '90d') startDate = new Date(now - 90 * 86400000);
    else startDate = new Date(now.getFullYear(), 0, 1);

    let csv = '';

    if (type === 'orders') {
      const orders = await prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } }, address: true },
        orderBy: { createdAt: 'desc' },
      });
      csv = 'Order Number,Date,Customer,Email,Phone,Status,Subtotal,Discount,Delivery Fee,VAT,Total,Promo Code,Points Redeemed\n';
      for (const o of orders) {
        csv += [
          o.orderNumber,
          new Date(o.createdAt).toISOString().slice(0, 10),
          `${o.user?.firstName || ''} ${o.user?.lastName || ''}`.trim(),
          o.user?.email || '',
          o.user?.phone || '',
          o.status,
          o.subtotal, o.discount, o.deliveryFee, o.vat, o.total,
          o.promoCode || '',
          o.pointsRedeemed || 0,
        ].map((v) => `"${v}"`).join(',') + '\n';
      }
    } else if (type === 'products') {
      const items = await prisma.orderItem.findMany({
        where: { order: { createdAt: { gte: startDate }, status: { not: 'CANCELLED' } } },
        include: { product: { select: { name: true, brand: true, sku: true, category: { select: { name: true } } } } },
      });
      const map: Record<string, any> = {};
      for (const item of items) {
        const id = item.productId;
        if (!map[id]) map[id] = { name: item.product?.name, brand: item.product?.brand, sku: item.product?.sku, category: item.product?.category?.name, units: 0, revenue: 0 };
        map[id].units += item.quantity;
        map[id].revenue += Number(item.subtotal);
      }
      csv = 'Product Name,Brand,SKU,Category,Units Sold,Revenue (NGN)\n';
      for (const p of Object.values(map).sort((a: any, b: any) => b.revenue - a.revenue)) {
        csv += [`"${p.name}"`, `"${p.brand}"`, `"${p.sku}"`, `"${p.category}"`, p.units, p.revenue.toFixed(2)].join(',') + '\n';
      }
    } else if (type === 'categories') {
      const items = await prisma.orderItem.findMany({
        where: { order: { createdAt: { gte: startDate }, status: { not: 'CANCELLED' } } },
        include: { product: { select: { category: { select: { name: true } } } } },
      });
      const catMap: Record<string, any> = {};
      for (const item of items) {
        const cat = item.product?.category?.name || 'Uncategorised';
        if (!catMap[cat]) catMap[cat] = { units: 0, revenue: 0 };
        catMap[cat].units += item.quantity;
        catMap[cat].revenue += Number(item.subtotal);
      }
      csv = 'Category,Units Sold,Revenue (NGN)\n';
      for (const [name, v] of Object.entries(catMap).sort((a: any, b: any) => b[1].revenue - a[1].revenue)) {
        csv += [`"${name}"`, (v as any).units, (v as any).revenue.toFixed(2)].join(',') + '\n';
      }
    }

    const filename = `drinksarena-${type}-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) { next(err); }
});

// GET /admin/loyalty/settings
router.get('/loyalty/settings', async (req, res, next) => {
  try {
    let settings = await prisma.loyaltySetting.findUnique({ where: { id: 'singleton' } });
    if (!settings) {
      settings = await prisma.loyaltySetting.create({ data: { id: 'singleton' } });
    }
    res.json(settings);
  } catch (err) { next(err); }
});

// PUT /admin/loyalty/settings
router.put('/loyalty/settings', async (req, res, next) => {
  try {
    const { isActive, earnRateNaira, redeemRate, minRedeemPoints, maxRedeemPct } = req.body;
    const settings = await prisma.loyaltySetting.upsert({
      where: { id: 'singleton' },
      update: { isActive, earnRateNaira, redeemRate, minRedeemPoints, maxRedeemPct, updatedAt: new Date() },
      create: { id: 'singleton', isActive, earnRateNaira, redeemRate, minRedeemPoints, maxRedeemPct },
    });
    res.json(settings);
  } catch (err) { next(err); }
});

// POST /admin/loyalty/adjust — manually award or deduct points
router.post('/loyalty/adjust', async (req, res, next) => {
  try {
    const { userId, points, reason } = req.body;
    if (!userId || !points || !reason) return res.status(400).json({ error: 'userId, points and reason required' });
    const user = await prisma.user.update({
      where: { id: userId },
      data: { loyaltyPoints: { increment: points } },
      select: { id: true, firstName: true, lastName: true, email: true, loyaltyPoints: true },
    });
    await prisma.loyaltyHistory.create({
      data: { userId, points, type: points > 0 ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT', description: reason },
    });
    res.json({ user, pointsAdjusted: points });
  } catch (err) { next(err); }
});

// GET /admin/loyalty/customers — top customers by points
router.get('/loyalty/customers', async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const where = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    } : {};
    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { loyaltyPoints: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, loyaltyPoints: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ customers, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) { next(err); }
});

module.exports = router;
