-- CreateTable
CREATE TABLE "SiteTheme" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "brandColour" TEXT NOT NULL DEFAULT '#1A4731',
    "accentColour" TEXT NOT NULL DEFAULT '#C9A227',
    "fontFamily" TEXT NOT NULL DEFAULT 'inter',
    "heroTitle" TEXT NOT NULL DEFAULT 'Nigeria''s Premier Online Drinks Store',
    "heroSubtitle" TEXT NOT NULL DEFAULT 'Fast delivery of beers, wines & spirits across Lagos',
    "showFeaturedSection" BOOLEAN NOT NULL DEFAULT true,
    "showCategoriesSection" BOOLEAN NOT NULL DEFAULT true,
    "showPromoBanner" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteTheme_pkey" PRIMARY KEY ("id")
);
