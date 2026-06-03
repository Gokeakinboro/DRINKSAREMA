require('dotenv').config();
const app = require('./app');
const { prisma } = require('./lib/prisma');

const PORT = process.env.PORT || 5000;

async function main() {
  await prisma.$connect();
  console.log('✓ Database connected');

  app.listen(PORT, () => {
    console.log(`✓ DrinksArena API running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
