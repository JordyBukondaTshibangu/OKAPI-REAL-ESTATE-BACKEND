-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monogram" TEXT NOT NULL,
    "accentClass" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT,
    "founded" INTEGER NOT NULL,
    "agentCount" INTEGER NOT NULL DEFAULT 0,
    "listingCount" INTEGER NOT NULL DEFAULT 0,
    "closedDeals" INTEGER NOT NULL DEFAULT 0,
    "specializations" TEXT[],
    "areasServed" TEXT[],
    "languages" TEXT[],
    "certifications" TEXT[],

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "languages" TEXT[],
    "yearsExperience" INTEGER NOT NULL,
    "experienceSince" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "ratingsCount" INTEGER NOT NULL,
    "responseMinutes" INTEGER NOT NULL,
    "brokerLicense" TEXT NOT NULL,
    "forSaleCount" INTEGER NOT NULL DEFAULT 0,
    "forRentCount" INTEGER NOT NULL DEFAULT 0,
    "closedDeals" INTEGER NOT NULL DEFAULT 0,
    "totalDealsValueUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bio" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "photoGradient" TEXT NOT NULL,
    "agencyAccent" TEXT NOT NULL,
    "agencyMonogram" TEXT NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AreaOfExpertise" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "ratings" INTEGER NOT NULL,
    "forSale" INTEGER NOT NULL,
    "forRent" INTEGER NOT NULL,
    "closedDeals" INTEGER NOT NULL,

    CONSTRAINT "AreaOfExpertise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackRecord" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "dealType" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "bedrooms" TEXT NOT NULL,

    CONSTRAINT "TrackRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "listingType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "period" TEXT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "areaSqm" DOUBLE PRECISION NOT NULL,
    "suburb" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "premium" BOOLEAN NOT NULL DEFAULT false,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "listedDaysAgo" INTEGER NOT NULL DEFAULT 0,
    "imageGradient" TEXT NOT NULL,
    "iconType" TEXT NOT NULL,
    "transaction" TEXT,
    "gallery" TEXT[],
    "amenities" TEXT[],
    "description" TEXT,
    "reference" TEXT,
    "zone" TEXT,
    "brokerLicense" TEXT,
    "agentLicense" TEXT,
    "permitNumber" TEXT,
    "availableFrom" TEXT,
    "averagePriceArea" DOUBLE PRECISION,
    "averageSizeArea" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaOfExpertise" ADD CONSTRAINT "AreaOfExpertise_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackRecord" ADD CONSTRAINT "TrackRecord_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
