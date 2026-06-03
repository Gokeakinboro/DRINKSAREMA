const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/drinks_arena';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Admin user
  const adminHash = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@drinksarena.ng' },
    update: {},
    create: {
      email: 'admin@drinksarena.ng',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: adminHash,
      role: 'ADMIN',
      isVerified: true,
      ageVerified: true,
    },
  });
  console.log('Admin user:', admin.email);

  // Categories
  const categories = [
    { name: 'Beer & Ciders', slug: 'beer-ciders', sortOrder: 1 },
    { name: 'Wines', slug: 'wines', sortOrder: 2 },
    { name: 'Spirits', slug: 'spirits', sortOrder: 3 },
    { name: 'Champagne & Prosecco', slug: 'champagne-prosecco', sortOrder: 4 },
    { name: 'Aperitifs & Liqueurs', slug: 'aperitifs-liqueurs', sortOrder: 5 },
    { name: 'Ready-to-Drink', slug: 'ready-to-drink', sortOrder: 6 },
    { name: 'Non-Alcoholic', slug: 'non-alcoholic', sortOrder: 7 },
    { name: 'Snacks & Mixers', slug: 'snacks-mixers', sortOrder: 8 },
    { name: 'Gift Sets & Hampers', slug: 'gift-sets-hampers', sortOrder: 9 },
    { name: 'Party Supplies', slug: 'party-supplies', sortOrder: 10 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }
  console.log('Categories seeded');

  const beerCat = await prisma.category.findUnique({ where: { slug: 'beer-ciders' } });
  const winesCat = await prisma.category.findUnique({ where: { slug: 'wines' } });
  const spiritsCat = await prisma.category.findUnique({ where: { slug: 'spirits' } });
  const champagneCat = await prisma.category.findUnique({ where: { slug: 'champagne-prosecco' } });

  // Sample products
  const products = [
    { name: 'Heineken Lager Beer 60cl', slug: 'heineken-lager-60cl', brand: 'Heineken', categoryId: beerCat.id, sku: 'HNK-LAG-60', description: 'The world-famous Dutch lager with a clean, crisp taste.', abv: 5.0, volumeMl: 600, unitPrice: 800, casePrice: 18000, caseQty: 24, stockQuantity: 120, images: ['https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400'], countryOfOrigin: 'Netherlands', tags: ['bestseller'], isFeatured: true },
    { name: 'Guinness Foreign Extra Stout 60cl', slug: 'guinness-fes-60cl', brand: 'Guinness', categoryId: beerCat.id, sku: 'GNS-FES-60', description: 'Rich, full-bodied stout with roasted barley flavour.', abv: 7.5, volumeMl: 600, unitPrice: 900, casePrice: 20000, caseQty: 24, stockQuantity: 80, images: ['https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400'], countryOfOrigin: 'Nigeria', tags: ['bestseller'], isFeatured: true },
    { name: 'Trophy Lager 60cl', slug: 'trophy-lager-60cl', brand: 'Trophy', categoryId: beerCat.id, sku: 'TRP-LAG-60', description: 'Premium Nigerian lager beer with a refreshing taste.', abv: 5.1, volumeMl: 600, unitPrice: 700, casePrice: 15500, caseQty: 24, stockQuantity: 200, images: ['https://images.unsplash.com/photo-1518176258769-f227c798150e?w=400'], countryOfOrigin: 'Nigeria', tags: [] },
    { name: 'Johnnie Walker Black Label 75cl', slug: 'jw-black-label-75cl', brand: 'Johnnie Walker', categoryId: spiritsCat.id, sku: 'JW-BLK-75', description: 'A premium 12-year-old blended Scotch whisky with hints of dark fruit and spice.', abv: 40.0, volumeMl: 750, unitPrice: 28000, casePrice: 300000, caseQty: 12, stockQuantity: 35, images: ['https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400'], countryOfOrigin: 'Scotland', tags: ['bestseller', 'premium'], isFeatured: true },
    { name: 'Hennessy VS Cognac 70cl', slug: 'hennessy-vs-70cl', brand: 'Hennessy', categoryId: spiritsCat.id, sku: 'HNS-VS-70', description: 'The world\'s best-selling Cognac with a rich amber colour and intense bouquet.', abv: 40.0, volumeMl: 700, unitPrice: 32000, casePrice: 350000, caseQty: 12, stockQuantity: 28, images: ['https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400'], countryOfOrigin: 'France', tags: ['bestseller', 'premium'], isFeatured: true },
    { name: 'Ciroc Vodka 75cl', slug: 'ciroc-vodka-75cl', brand: 'Ciroc', categoryId: spiritsCat.id, sku: 'CRC-VDK-75', description: 'Premium ultra-premium vodka made from fine French grapes.', abv: 40.0, volumeMl: 750, unitPrice: 25000, stockQuantity: 22, images: ['https://images.unsplash.com/photo-1612528443702-f6741f70a049?w=400'], countryOfOrigin: 'France', tags: ['premium'] },
    { name: 'Moët & Chandon Brut Impérial 75cl', slug: 'moet-chandon-brut-75cl', brand: 'Moët & Chandon', categoryId: champagneCat.id, sku: 'MET-BRT-75', description: 'Iconic champagne with bright fruitiness, elegant maturity, and enticing vitality.', abv: 12.0, volumeMl: 750, unitPrice: 55000, casePrice: 600000, caseQty: 12, stockQuantity: 18, images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400'], countryOfOrigin: 'France', tags: ['premium', 'bestseller'], isFeatured: true },
    { name: 'Jacob\'s Creek Shiraz 75cl', slug: 'jacobs-creek-shiraz-75cl', brand: "Jacob's Creek", categoryId: winesCat.id, sku: 'JC-SHZ-75', description: 'A vibrant red wine with ripe berry flavours, plum and spice.', abv: 13.5, volumeMl: 750, unitPrice: 8500, casePrice: 90000, caseQty: 12, stockQuantity: 55, images: ['https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400'], countryOfOrigin: 'Australia', tags: [] },
    { name: 'Baileys Irish Cream 50cl', slug: 'baileys-irish-cream-50cl', brand: 'Baileys', categoryId: spiritsCat.id, sku: 'BAL-ICR-50', description: 'The original Irish cream liqueur made with fresh cream and Irish whiskey.', abv: 17.0, volumeMl: 500, unitPrice: 12000, stockQuantity: 42, images: ['https://images.unsplash.com/photo-1574870111867-089730e5a72b?w=400'], countryOfOrigin: 'Ireland', tags: ['bestseller'] },
    { name: 'Absolut Vodka Blue 70cl', slug: 'absolut-vodka-blue-70cl', brand: 'Absolut', categoryId: spiritsCat.id, sku: 'ABS-BLU-70', description: 'Pure, clean vodka made from winter wheat grown in Åhus, Sweden.', abv: 40.0, volumeMl: 700, unitPrice: 15000, casePrice: 165000, caseQty: 12, stockQuantity: 38, images: ['https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400'], countryOfOrigin: 'Sweden', tags: [] },
  ];

  for (const p of products) {
    await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }
  console.log('Products seeded');

  // Delivery zones
  const zones = [
    { name: 'Lagos Island', city: 'Lagos', baseDeliveryFee: 1000, freeThreshold: 25000, slaMins: 60 },
    { name: 'Lagos Mainland', city: 'Lagos', baseDeliveryFee: 1500, freeThreshold: 25000, slaMins: 60 },
    { name: 'Abuja Central', city: 'Abuja', baseDeliveryFee: 1200, freeThreshold: 25000, slaMins: 90 },
    { name: 'Port Harcourt GRA', city: 'Port Harcourt', baseDeliveryFee: 1300, freeThreshold: 25000, slaMins: 90 },
  ];

  for (const zone of zones) {
    const existing = await prisma.deliveryZone.findFirst({ where: { name: zone.name } });
    if (!existing) await prisma.deliveryZone.create({ data: zone });
  }
  console.log('Delivery zones seeded');

  // Sample promo code
  await prisma.promoCode.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { code: 'WELCOME10', type: 'PERCENTAGE', value: 10, minOrderValue: 5000, maxUses: 1000, isActive: true },
  });
  console.log('Promo codes seeded');

  console.log('\n✓ Seed complete!');
  console.log('Admin login: admin@drinksarena.ng / Admin1234!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
