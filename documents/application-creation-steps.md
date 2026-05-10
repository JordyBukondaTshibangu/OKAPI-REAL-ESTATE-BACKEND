Create this backend API based on this description 


Step 1 & 2 — Prisma Schema
prisma// prisma/schema.prisma

model Admin {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

model User {
  id           String   @id @default(uuid())
  firstName    String
  lastName     String
  email        String   @unique
  phoneNumber  String
  passwordHash String
  createdAt    DateTime @default(now())
}

model Agency {
  id              String   @id @default(uuid())
  name            String
  monogram        String
  accentClass     String
  tagline         String
  description     String
  address         String
  phone           String
  email           String
  website         String?
  founded         Int
  agentCount      Int      @default(0)
  listingCount    Int      @default(0)
  closedDeals     Int      @default(0)
  specializations String[] // Postgres array
  areasServed     String[]
  languages       String[]
  certifications  String[]

  agents     Agent[]
  properties Property[]
}

model Agent {
  id               String  @id @default(uuid())
  agencyId         String
  agency           Agency  @relation(fields: [agencyId], references: [id])

  name             String
  title            String  // "SUPERAGENT" | "AGENT EXCLUSIF" | "AGENT"
  specialization   String
  nationality      String
  languages        String[]
  yearsExperience  Int
  experienceSince  Int
  rating           Float
  ratingsCount     Int
  responseMinutes  Int
  brokerLicense    String
  forSaleCount     Int     @default(0)
  forRentCount     Int     @default(0)
  closedDeals      Int     @default(0)
  totalDealsValueUsd Float @default(0)
  bio              String
  photo            String
  photoGradient    String
  agencyAccent     String
  agencyMonogram   String

  properties       Property[]
  areasOfExpertise AreaOfExpertise[]
  trackRecord      TrackRecord[]
}

model AreaOfExpertise {
  id          String @id @default(uuid())
  agentId     String
  agent       Agent  @relation(fields: [agentId], references: [id])

  name        String
  description String
  rating      Float
  ratings     Int
  forSale     Int
  forRent     Int
  closedDeals Int
}

model TrackRecord {
  id           String @id @default(uuid())
  agentId      String
  agent        Agent  @relation(fields: [agentId], references: [id])

  location     String
  building     String
  dealType     String // "Vente" | "Location"
  date         String
  propertyType String
  bedrooms     String
}

model Property {
  id              String   @id @default(uuid())
  agentId         String
  agent           Agent    @relation(fields: [agentId], references: [id])
  agencyId        String
  agency          Agency   @relation(fields: [agencyId], references: [id])

  listingType     String   // "rent" | "sale" | "commercial"
  category        String   // "apartment" | "villa" | etc.
  price           Float
  currency        String
  period          String?  // "monthly" | "yearly"
  title           String
  subtitle        String
  bedrooms        Int
  bathrooms       Int
  areaSqm         Float
  suburb          String
  neighborhood    String
  city            String
  verified        Boolean  @default(false)
  premium         Boolean  @default(false)
  isNew           Boolean  @default(false)
  listedDaysAgo   Int      @default(0)
  imageGradient   String
  iconType        String
  transaction     String?  // "rent" | "sale" for commercial
  gallery         String[]
  amenities       String[]

  // PropertyDetail fields
  description     String?
  reference       String?
  zone            String?
  brokerLicense   String?
  agentLicense    String?
  permitNumber    String?
  availableFrom   String?
  averagePriceArea Float?
  averageSizeArea  Float?

  createdAt       DateTime @default(now())
}
Step 3 — NestJS Module Structure
src/
├── auth/
│   ├── admin/
│   │   ├── admin-auth.controller.ts   # POST /auth/admin/login
│   │   ├── admin-auth.service.ts
│   │   └── admin.guard.ts             # JwtAuthGuard + role check
│   └── user/
│       ├── user-auth.controller.ts    # POST /auth/register, /auth/login
│       └── user-auth.service.ts
├── agencies/
│   ├── agencies.controller.ts
│   ├── agencies.service.ts
│   └── agencies.module.ts
├── agents/
│   ├── agents.controller.ts
│   ├── agents.service.ts
│   └── agents.module.ts
├── properties/
│   ├── properties.controller.ts
│   ├── properties.service.ts
│   └── properties.module.ts
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── prisma/
│   └── prisma.service.ts
└── app.module.ts
Step 4 — Auth Strategy
Two JWT strategies:
  - UserJwtStrategy   → signs with { sub: user.id, role: "user" }
  - AdminJwtStrategy  → signs with { sub: admin.id, role: "admin" }

Guards:
  - JwtUserGuard      → protects user-only routes (e.g. PATCH /users/:id)
  - JwtAdminGuard     → protects admin routes (e.g. POST /agencies)
Step 5 — Route Map
PUBLIC (no auth)
  GET  /agencies
  GET  /agencies/:id
  GET  /agents
  GET  /agents/:id
  GET  /properties
  GET  /properties/:id

USER AUTH
  POST   /auth/register
  POST   /auth/login
  GET    /users/me           [JwtUserGuard]
  PATCH  /users/me           [JwtUserGuard]
  DELETE /users/me           [JwtUserGuard]

ADMIN AUTH
  POST   /auth/admin/login
  POST   /agencies           [JwtAdminGuard]
  PATCH  /agencies/:id       [JwtAdminGuard]
  DELETE /agencies/:id       [JwtAdminGuard]
  POST   /agents             [JwtAdminGuard]
  PATCH  /agents/:id         [JwtAdminGuard]
  DELETE /agents/:id         [JwtAdminGuard]
  POST   /properties         [JwtAdminGuard]
  PATCH  /properties/:id     [JwtAdminGuard]
  DELETE /properties/:id     [JwtAdminGuard]
Step 6 — Key packages to install
bashnpm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer
npm install -D @types/bcrypt @types/passport-jwt
Step 7 — Migration & Seed
bashnpx prisma migrate dev --name init
npx prisma db seed   # optional: seed admin account

Key Design Decisions Summary
DecisionRationaleSeparate Admin tableCleaner than a role flag on User; different auth flowAreaOfExpertise & TrackRecord as tablesQueryable/filterable vs opaque JSON blobsagencyId on PropertyAvoids joins when displaying property cards with agency infoString[] for arraysPrisma native Postgres arrays; simpler than junction tables for static listsOne Property modelMerges Property + PropertyDetail — detail fields are nullable