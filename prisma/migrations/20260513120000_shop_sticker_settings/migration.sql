-- CreateTable
CREATE TABLE "ShopStickerSettings" (
    "shop" TEXT NOT NULL,
    "settings" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopStickerSettings_pkey" PRIMARY KEY ("shop")
);
