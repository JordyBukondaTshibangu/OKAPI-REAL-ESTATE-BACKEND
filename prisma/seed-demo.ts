// prisma/seed-demo.ts
// Creates 5 agencies · 20 agents · 50 properties with real images uploaded to R2
// Usage: npm run seed-demo
// ──────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ─── 1. Load .env manually (dotenv not required) ────────────────────────────
const envFile = path.join(process.cwd(), ".env");
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, "utf-8")
    .split("\n")
    .forEach((line) => {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"#\n]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    });
}

// ─── 2. R2 / S3 client ──────────────────────────────────────────────────────
const R2_PUBLIC = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
const BUCKET    = process.env.R2_BUCKET_NAME ?? "";
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

const IMGS   = path.join(os.homedir(), "Downloads", "images");
const prisma = new PrismaClient();

// ─── 3. Upload helpers ──────────────────────────────────────────────────────
async function r2Put(localPath: string, key: string): Promise<string> {
  const ext = path.extname(localPath).toLowerCase();
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fs.readFileSync(localPath),
    ContentType: ext === ".png" ? "image/png" : "image/jpeg",
  }));
  return `${R2_PUBLIC}/${key}`;
}

function listDir(sub: string): string[] {
  const dir = path.join(IMGS, sub);
  if (!fs.existsSync(dir)) { console.warn(`  ⚠️  Dossier manquant: ${dir}`); return []; }
  return fs.readdirSync(dir)
    .filter(f => /\.(jpe?g|png)$/i.test(f) && !f.includes(".tmp"))
    .sort((a, b) => {
      const na = parseInt(a), nb = parseInt(b);
      return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb;
    })
    .map(f => path.join(dir, f));
}

async function uploadGallery(sub: string, key: string, max = 7): Promise<string[]> {
  const urls: string[] = [];
  for (const f of listDir(sub).slice(0, max)) {
    const fname = path.basename(f).toLowerCase().replace(/\.jpe?g$/i, ".jpg");
    try { urls.push(await r2Put(f, `${key}/${fname}`)); }
    catch (e) { console.error(`  ✗ Upload échoué: ${f}`, (e as Error).message); }
  }
  return urls;
}

async function uploadPhoto(sub: string, filename: string, key: string): Promise<string> {
  const localPath = path.join(IMGS, sub, filename);
  if (!fs.existsSync(localPath)) { console.warn(`  ⚠️  Photo manquante: ${localPath}`); return ""; }
  try { return await r2Put(localPath, key); }
  catch (e) { console.error(`  ✗ Upload échoué: ${localPath}`, (e as Error).message); return ""; }
}

// ─── 4. Agences ─────────────────────────────────────────────────────────────
const AGENCIES = [
  // 0
  {
    name: "Okapi Prestige Immobilier",
    monogram: "OP",
    accentClass: "bg-amber-600",
    tagline: "L'excellence au service de votre patrimoine",
    email: "contact@okapi-prestige.cd",
    phone: "+243 81 234 5678",
    whatsapp: "+243 81 234 5678",
    website: "https://okapi-prestige.cd",
    address: "Avenue du Commerce 14, Gombe, Kinshasa",
    description:
      "Okapi Prestige Immobilier est l'agence de référence à Kinshasa pour les biens haut de gamme. Spécialisée dans les villas et appartements de standing, notre équipe accompagne les clients dans toutes leurs transactions avec professionnalisme et discrétion.",
    founded: 2015,
    communes: ["Gombe", "Ngaliema", "Limete", "Lingwala"],
    propertyTypes: ["Villas", "Appartements", "Duplex"],
    rentalFocus: "BOTH",
    specializations: ["Immobilier résidentiel haut de gamme", "Investissement immobilier"],
    areasServed: ["Kinshasa Nord", "Centre-ville"],
    languages: ["Français", "Anglais", "Lingala"],
    rccmNumber: "CD/KIN/RCCM/2015-B-12345",
    freeListingCap: 999,
  },
  // 1
  {
    name: "Congo Prime Realty",
    monogram: "CP",
    accentClass: "bg-blue-700",
    tagline: "Votre investissement, notre priorité",
    email: "info@congo-prime.cd",
    phone: "+243 82 345 6789",
    whatsapp: "+243 82 345 6789",
    website: "https://congo-prime.cd",
    address: "Boulevard Sendwe 45, Limete, Kinshasa",
    description:
      "Congo Prime Realty est une agence dynamique spécialisée dans les appartements modernes et les espaces commerciaux. Notre réseau étendu nous permet de proposer des biens adaptés à chaque budget et chaque besoin.",
    founded: 2018,
    communes: ["Limete", "Matete", "Ndjili", "Kinshasa"],
    propertyTypes: ["Appartements", "Boutiques", "Bureaux"],
    rentalFocus: "LONG_TERM",
    specializations: ["Immobilier commercial", "Location longue durée"],
    areasServed: ["Est de Kinshasa", "Zone industrielle"],
    languages: ["Français", "Swahili", "Lingala"],
    rccmNumber: "CD/KIN/RCCM/2018-B-67890",
    freeListingCap: 999,
  },
  // 2
  {
    name: "Kinshasa Elite Properties",
    monogram: "KE",
    accentClass: "bg-emerald-700",
    tagline: "Des propriétés d'exception pour des clients exigeants",
    email: "info@kinshasa-elite.cd",
    phone: "+243 99 456 7890",
    whatsapp: "+243 99 456 7890",
    website: "https://kinshasa-elite.cd",
    address: "Avenue Kasa-Vubu 8, Ngaliema, Kinshasa",
    description:
      "Kinshasa Elite Properties est votre partenaire de confiance pour l'achat, la vente et la location de biens immobiliers. Notre approche personnalisée et notre expertise du marché local nous distinguent.",
    founded: 2016,
    communes: ["Ngaliema", "Mont-Ngafula", "Selembao", "Kintambo"],
    propertyTypes: ["Villas", "Studios", "Terrains"],
    rentalFocus: "BOTH",
    specializations: ["Vente immobilière", "Gestion locative"],
    areasServed: ["Ouest de Kinshasa", "Périphérie"],
    languages: ["Français", "Anglais"],
    rccmNumber: "CD/KIN/RCCM/2016-B-24680",
    freeListingCap: 999,
  },
  // 3
  {
    name: "Invest Congo Immobilier",
    monogram: "IC",
    accentClass: "bg-purple-700",
    tagline: "Investissez intelligemment en RDC",
    email: "contact@invest-congo.cd",
    phone: "+243 84 567 8901",
    whatsapp: "+243 84 567 8901",
    website: "https://invest-congo.cd",
    address: "Avenue Tombalbaye 22, Kintambo, Kinshasa",
    description:
      "Invest Congo Immobilier se spécialise dans l'immobilier d'entreprise et la gestion de patrimoine. Nous accompagnons nos clients dans leurs projets d'acquisition de bureaux, entrepôts et locaux commerciaux.",
    founded: 2019,
    communes: ["Kintambo", "Barumbu", "Kalamu", "Bandalungwa"],
    propertyTypes: ["Bureaux", "Entrepôts", "Locaux commerciaux"],
    rentalFocus: "BOTH",
    specializations: ["Immobilier d'entreprise", "Investissement"],
    areasServed: ["Centre-ville", "Zone commerciale"],
    languages: ["Français", "Anglais", "Portugais"],
    rccmNumber: "CD/KIN/RCCM/2019-B-13579",
    freeListingCap: 999,
  },
  // 4
  {
    name: "La Métropole Immobilière",
    monogram: "LM",
    accentClass: "bg-rose-700",
    tagline: "Au cœur de Kinshasa, à votre service",
    email: "contact@metropole-immo.cd",
    phone: "+243 85 678 9012",
    whatsapp: "+243 85 678 9012",
    website: "https://metropole-immo.cd",
    address: "Avenue Bokassa 5, Barumbu, Kinshasa",
    description:
      "La Métropole Immobilière est une agence familiale avec plus de 8 ans d'expérience sur le marché kinois. Nous couvrons tous les types de biens et toutes les communes, garantissant un service de proximité et une expertise locale inégalée.",
    founded: 2017,
    communes: ["Barumbu", "Lemba", "Makala", "Kasa-Vubu", "Lingwala"],
    propertyTypes: ["Appartements", "Studios", "Maisons"],
    rentalFocus: "SHORT_TERM",
    specializations: ["Location courte durée", "Syndic de copropriété"],
    areasServed: ["Toute Kinshasa"],
    languages: ["Français", "Lingala", "Kikongo"],
    rccmNumber: "CD/KIN/RCCM/2017-B-97531",
    freeListingCap: 999,
  },
];

// ─── 5. Agents ──────────────────────────────────────────────────────────────
const AGENTS = [
  // ── Agence 0 : Okapi Prestige Immobilier ─────────────────────────────────
  {
    name: "Jean-Baptiste Makaya",
    email: "jb.makaya@okapi-prestige.cd",
    phoneNumber: "+24381234001",
    whatsappNumber: "+24381234001",
    agentType: "AGENCY_OWNER",
    agencyIdx: 0,
    communes: ["Gombe", "Ngaliema"],
    propertyTypes: ["Villas", "Appartements"],
    rentalFocus: "BOTH",
    yearsExperienceLabel: "Plus de 10 ans",
    bio: "Jean-Baptiste Makaya est le fondateur d'Okapi Prestige Immobilier. Avec plus de 10 ans d'expérience dans le luxe à Kinshasa, il est reconnu pour sa connaissance du marché et son réseau de clients premium.",
    photoFile: "1.JPG",
    verificationTier: "VERIFIE",
    closedDeals: 87,
    rating: 4.9,
    ratingsCount: 43,
  },
  {
    name: "Carine Mwanza",
    email: "c.mwanza@okapi-prestige.cd",
    phoneNumber: "+24381234002",
    whatsappNumber: "+24381234002",
    agentType: "AGENT",
    agencyIdx: 0,
    communes: ["Gombe", "Lingwala"],
    propertyTypes: ["Appartements", "Duplex"],
    rentalFocus: "LONG_TERM",
    yearsExperienceLabel: "5 à 7 ans",
    bio: "Carine Mwanza est spécialisée dans la location et la vente d'appartements haut de gamme à Gombe et Lingwala. Son sens du service et sa rigueur en font un agent incontournable.",
    photoFile: "3.JPG",
    verificationTier: "VERIFIE",
    closedDeals: 52,
    rating: 4.7,
    ratingsCount: 29,
  },
  {
    name: "Pierre Kabila",
    email: "p.kabila@okapi-prestige.cd",
    phoneNumber: "+24381234003",
    agentType: "AGENT",
    agencyIdx: 0,
    communes: ["Ngaliema", "Limete"],
    propertyTypes: ["Villas", "Terrains"],
    rentalFocus: "BOTH",
    yearsExperienceLabel: "3 à 5 ans",
    bio: "Pierre Kabila gère principalement les villas et terrains à Ngaliema et Limete. Passionné d'architecture, il conseille ses clients avec expertise.",
    photoFile: "4.jpg",
    verificationTier: "VERIFIE",
    closedDeals: 34,
    rating: 4.5,
    ratingsCount: 18,
  },
  {
    name: "Solange Ntumba",
    email: "s.ntumba@okapi-prestige.cd",
    phoneNumber: "+24381234004",
    agentType: "COMMISSIONNAIRE",
    agencyIdx: 0,
    communes: ["Limete", "Kintambo"],
    propertyTypes: ["Appartements", "Studios"],
    rentalFocus: "LONG_TERM",
    yearsExperienceLabel: "1 à 3 ans",
    bio: "Solange Ntumba est une commerciale dynamique spécialisée dans la mise en relation des propriétaires et locataires. Son énergie et sa persévérance font sa force.",
    photoFile: "5.JPG",
    verificationTier: "NON_VERIFIE",
    closedDeals: 21,
    rating: 4.3,
    ratingsCount: 12,
  },
  // ── Agence 1 : Congo Prime Realty ─────────────────────────────────────────
  {
    name: "David Lumumba",
    email: "d.lumumba@congo-prime.cd",
    phoneNumber: "+24382234001",
    whatsappNumber: "+24382234001",
    agentType: "AGENCY_OWNER",
    agencyIdx: 1,
    communes: ["Limete", "Matete"],
    propertyTypes: ["Appartements", "Bureaux", "Boutiques"],
    rentalFocus: "BOTH",
    yearsExperienceLabel: "Plus de 8 ans",
    bio: "David Lumumba dirige Congo Prime Realty avec une vision commerciale forte. Spécialiste de l'immobilier d'entreprise, il accompagne aussi bien les PME que les particuliers dans leurs projets.",
    photoFile: "6.JPG",
    verificationTier: "VERIFIE",
    closedDeals: 73,
    rating: 4.8,
    ratingsCount: 37,
  },
  {
    name: "Marie-Claire Botuli",
    email: "mc.botuli@congo-prime.cd",
    phoneNumber: "+24382234002",
    whatsappNumber: "+24382234002",
    agentType: "AGENT",
    agencyIdx: 1,
    communes: ["Ndjili", "Kinshasa"],
    propertyTypes: ["Appartements", "Studios"],
    rentalFocus: "LONG_TERM",
    yearsExperienceLabel: "4 à 6 ans",
    bio: "Marie-Claire Botuli est reconnue pour sa disponibilité et son professionnalisme. Elle accompagne ses clients à chaque étape avec une attention particulière aux budgets maîtrisés.",
    photoFile: "7.jpg",
    verificationTier: "VERIFIE",
    closedDeals: 45,
    rating: 4.6,
    ratingsCount: 24,
  },
  {
    name: "Jacques Nzinga",
    email: "j.nzinga@congo-prime.cd",
    phoneNumber: "+24382234003",
    agentType: "COMMISSIONNAIRE",
    agencyIdx: 1,
    communes: ["Matete", "Lemba"],
    propertyTypes: ["Boutiques", "Locaux commerciaux"],
    rentalFocus: "BOTH",
    yearsExperienceLabel: "2 à 4 ans",
    bio: "Jacques Nzinga s'est spécialisé dans les locaux commerciaux et les boutiques. Sa connaissance des zones commerciales de Kinshasa est un atout précieux.",
    photoFile: "9.jpg",
    verificationTier: "NON_VERIFIE",
    closedDeals: 28,
    rating: 4.2,
    ratingsCount: 15,
  },
  // ── Agence 2 : Kinshasa Elite Properties ──────────────────────────────────
  {
    name: "Robert Mukendi",
    email: "r.mukendi@kinshasa-elite.cd",
    phoneNumber: "+24399234001",
    whatsappNumber: "+24399234001",
    agentType: "AGENCY_OWNER",
    agencyIdx: 2,
    communes: ["Ngaliema", "Mont-Ngafula"],
    propertyTypes: ["Villas", "Terrains"],
    rentalFocus: "BOTH",
    yearsExperienceLabel: "Plus de 12 ans",
    bio: "Robert Mukendi est l'un des agents les plus expérimentés de Kinshasa. Fondateur de Kinshasa Elite Properties, il a développé un réseau unique dans les quartiers résidentiels prisés.",
    photoFile: "10.jpg",
    verificationTier: "VERIFIE",
    closedDeals: 112,
    rating: 4.9,
    ratingsCount: 58,
  },
  {
    name: "Judith Bompela",
    email: "j.bompela@kinshasa-elite.cd",
    phoneNumber: "+24399234002",
    agentType: "AGENT",
    agencyIdx: 2,
    communes: ["Selembao", "Kintambo"],
    propertyTypes: ["Studios", "Appartements"],
    rentalFocus: "SHORT_TERM",
    yearsExperienceLabel: "3 à 5 ans",
    bio: "Judith Bompela est spécialisée dans la location courte durée et les studios meublés. Sa maîtrise des plateformes numériques permet de maximiser la rentabilité des biens.",
    photoFile: "11.jpg",
    verificationTier: "VERIFIE",
    closedDeals: 39,
    rating: 4.7,
    ratingsCount: 21,
  },
  {
    name: "Paul Ndombe",
    email: "p.ndombe@kinshasa-elite.cd",
    phoneNumber: "+24399234003",
    agentType: "COMMISSIONNAIRE",
    agencyIdx: 2,
    communes: ["Mont-Ngafula", "Kisenso"],
    propertyTypes: ["Terrains", "Villas"],
    rentalFocus: "BOTH",
    yearsExperienceLabel: "1 à 3 ans",
    bio: "Paul Ndombe se concentre sur la vente de terrains et villas dans les zones en développement. Sa connaissance des titres fonciers est un avantage pour ses clients.",
    photoFile: "12.jpg",
    verificationTier: "NON_VERIFIE",
    closedDeals: 18,
    rating: 4.4,
    ratingsCount: 9,
  },
  // ── Agence 3 : Invest Congo Immobilier ────────────────────────────────────
  {
    name: "Patrick Tshibangu",
    email: "p.tshibangu@invest-congo.cd",
    phoneNumber: "+24384234001",
    whatsappNumber: "+24384234001",
    agentType: "AGENCY_OWNER",
    agencyIdx: 3,
    communes: ["Kintambo", "Barumbu"],
    propertyTypes: ["Bureaux", "Entrepôts"],
    rentalFocus: "LONG_TERM",
    yearsExperienceLabel: "Plus de 9 ans",
    bio: "Patrick Tshibangu est le fondateur d'Invest Congo Immobilier. Son expertise des marchés locaux et son réseau d'investisseurs en font un acteur clé du secteur de l'immobilier d'entreprise.",
    photoFile: "13.jpg",
    verificationTier: "VERIFIE",
    closedDeals: 65,
    rating: 4.8,
    ratingsCount: 33,
  },
  {
    name: "Élise Kayumba",
    email: "e.kayumba@invest-congo.cd",
    phoneNumber: "+24384234002",
    agentType: "AGENT",
    agencyIdx: 3,
    communes: ["Kalamu", "Bandalungwa"],
    propertyTypes: ["Locaux commerciaux", "Bureaux"],
    rentalFocus: "BOTH",
    yearsExperienceLabel: "5 à 7 ans",
    bio: "Élise Kayumba gère les locaux commerciaux et bureaux dans les quartiers d'affaires de Kinshasa. Sa rigueur dans l'analyse des dossiers est très appréciée.",
    photoFile: "14.jpg",
    verificationTier: "VERIFIE",
    closedDeals: 47,
    rating: 4.6,
    ratingsCount: 25,
  },
  // ── Agence 4 : La Métropole Immobilière ───────────────────────────────────
  {
    name: "François Mbemba",
    email: "f.mbemba@metropole-immo.cd",
    phoneNumber: "+24385234001",
    whatsappNumber: "+24385234001",
    agentType: "AGENCY_OWNER",
    agencyIdx: 4,
    communes: ["Barumbu", "Lemba"],
    propertyTypes: ["Appartements", "Studios", "Maisons"],
    rentalFocus: "BOTH",
    yearsExperienceLabel: "Plus de 8 ans",
    bio: "François Mbemba dirige La Métropole Immobilière depuis 2017. Son approche familiale et sa présence dans toutes les communes lui permettent de répondre à toutes les demandes.",
    photoFile: "15.jpg",
    verificationTier: "VERIFIE",
    closedDeals: 91,
    rating: 4.8,
    ratingsCount: 48,
  },
  {
    name: "Yvonne Kalonji",
    email: "y.kalonji@metropole-immo.cd",
    phoneNumber: "+24385234002",
    whatsappNumber: "+24385234002",
    agentType: "AGENT",
    agencyIdx: 4,
    communes: ["Makala", "Kasa-Vubu"],
    propertyTypes: ["Appartements", "Studios"],
    rentalFocus: "SHORT_TERM",
    yearsExperienceLabel: "4 à 6 ans",
    bio: "Yvonne Kalonji est spécialisée dans les locations meublées et la gestion locative. Son portefeuille actif de plus de 30 biens lui confère une vision unique du marché kinois.",
    photoFile: "16.jpg",
    verificationTier: "VERIFIE",
    closedDeals: 58,
    rating: 4.7,
    ratingsCount: 30,
  },
  // ── Agents indépendants ───────────────────────────────────────────────────
  {
    name: "Alexandre Diallo",
    email: "a.diallo.immo@gmail.com",
    phoneNumber: "+24389123001",
    agentType: "COMMISSIONNAIRE",
    agencyIdx: null,
    communes: ["Gombe", "Barumbu"],
    propertyTypes: ["Appartements"],
    rentalFocus: "LONG_TERM",
    yearsExperienceLabel: "2 à 4 ans",
    bio: "Agent indépendant actif à Gombe et Barumbu, Alexandre propose des appartements adaptés à tous les budgets. Réactif et disponible 7j/7.",
    photoFile: "17.jpg",
    verificationTier: "NON_VERIFIE",
    closedDeals: 15,
    rating: 4.3,
    ratingsCount: 8,
  },
  {
    name: "Nadège Mutombo",
    email: "n.mutombo.immo@gmail.com",
    phoneNumber: "+24389123002",
    agentType: "COMMISSIONNAIRE",
    agencyIdx: null,
    communes: ["Kintambo", "Lingwala"],
    propertyTypes: ["Studios", "Appartements"],
    rentalFocus: "BOTH",
    yearsExperienceLabel: "1 à 3 ans",
    bio: "Nadège Mutombo est une agente indépendante enthousiaste, spécialisée dans les studios et petits appartements. Elle accompagne notamment les jeunes professionnels.",
    photoFile: "18.jpg",
    verificationTier: "NON_VERIFIE",
    closedDeals: 11,
    rating: 4.2,
    ratingsCount: 6,
  },
  {
    name: "Christian Banza",
    email: "c.banza.immo@gmail.com",
    phoneNumber: "+24389123003",
    agentType: "AGENT",
    agencyIdx: null,
    communes: ["Ngaliema", "Mont-Ngafula"],
    propertyTypes: ["Villas", "Terrains"],
    rentalFocus: "BOTH",
    yearsExperienceLabel: "5 à 7 ans",
    bio: "Christian Banza est un agent indépendant avec une solide expérience dans les villas et terrains des communes résidentielles. Son sens de l'écoute est sa marque de fabrique.",
    photoFile: "19.jpg",
    verificationTier: "VERIFIE",
    closedDeals: 29,
    rating: 4.5,
    ratingsCount: 16,
  },
  {
    name: "Martine Kiala",
    email: "m.kiala.immo@gmail.com",
    phoneNumber: "+24389123004",
    agentType: "COMMISSIONNAIRE",
    agencyIdx: null,
    communes: ["Lemba", "Ndjili"],
    propertyTypes: ["Appartements", "Boutiques"],
    rentalFocus: "LONG_TERM",
    yearsExperienceLabel: "1 à 3 ans",
    bio: "Martine Kiala est une commissionnaire indépendante dynamique, active à Lemba et Ndjili. Elle se distingue par sa connaissance du terrain et ses prix compétitifs.",
    photoFile: "20.jpg",
    verificationTier: "NON_VERIFIE",
    closedDeals: 9,
    rating: 4.1,
    ratingsCount: 5,
  },
  {
    name: "Emmanuel Kasongo",
    email: "e.kasongo.immo@gmail.com",
    phoneNumber: "+24389123005",
    agentType: "AGENT",
    agencyIdx: null,
    communes: ["Bandalungwa", "Kalamu"],
    propertyTypes: ["Appartements", "Studios"],
    rentalFocus: "BOTH",
    yearsExperienceLabel: "3 à 5 ans",
    bio: "Emmanuel Kasongo travaille en indépendant et se spécialise dans les quartiers populaires de Kinshasa. Il aide ses clients à trouver des logements décents à des prix abordables.",
    photoFile: "21.jpg",
    verificationTier: "NON_VERIFIE",
    closedDeals: 23,
    rating: 4.4,
    ratingsCount: 13,
  },
  {
    name: "Rosalie Ngandu",
    email: "r.ngandu.immo@gmail.com",
    phoneNumber: "+24389123006",
    agentType: "COMMISSIONNAIRE",
    agencyIdx: null,
    communes: ["Makala", "Selembao"],
    propertyTypes: ["Maisons", "Studios"],
    rentalFocus: "LONG_TERM",
    yearsExperienceLabel: "1 à 3 ans",
    bio: "Rosalie Ngandu est une agente indépendante passionnée qui couvre Makala et Selembao. Elle propose des offres variées adaptées aux familles kinoisess.",
    photoFile: "22.jpg",
    verificationTier: "NON_VERIFIE",
    closedDeals: 7,
    rating: 4.0,
    ratingsCount: 4,
  },
];

// ─── 6. Properties ──────────────────────────────────────────────────────────
// agentSlot 0-13 maps to AGENTS[0-13] (agency-affiliated only)
// agencySlot = AGENTS[agentSlot].agencyIdx
const AM = ["Gardiennage 24h/24", "Groupe électrogène", "Eau courante", "Climatisation centralisée",
  "Parking couvert", "Sécurité résidentielle", "Internet fibre optique", "Cuisine équipée"];
const AM_VILLA   = [...AM, "Piscine privée", "Jardin paysager", "Terrasse panoramique", "Salle de réception"];
const AM_APT     = [...AM, "Balcon privé", "Salle de bain en suite", "Dressing", "Ascenseur"];
const AM_STUDIO  = ["Groupe électrogène", "Eau courante", "Climatisation", "Cuisine américaine", "Interphone sécurisé", "Parking"];
const AM_OFFICE  = ["Climatisation centralisée", "Groupe électrogène", "Parking", "Salle de conférence", "Internet fibre optique", "Sécurité 24h/24", "Ascenseur"];
const AM_SHOP    = ["Vitrine commerciale", "Groupe électrogène", "Eau courante", "Parking clients", "Système d'alarme", "Stockage arrière"];
const AM_DUPLEX  = [...AM, "Terrasse privée", "Salle de bain en suite", "Dressing", "Cave à vin"];
const AM_TERRAIN = ["Titre foncier sécurisé", "Accès voie asphaltée", "Électricité en bordure", "Eau de ville disponible", "Zone résidentielle sécurisée"];
const AM_ENTREPOT = ["Quai de chargement", "Groupe électrogène", "Accès poids lourds", "Bureaux intégrés", "Système de sécurité", "Grande hauteur sous plafond"];

const PROPERTIES = [
  // ─── Agent 0 : Jean-Baptiste Makaya (Agence 0) ───────────────────────────
  {
    folder: "images-1/villas/villa-1", keyPrefix: "seed/props/v1a1",
    category: "villa", iconType: "villa", imageGradient: "from-slate-700 to-slate-900",
    listingType: "sale", title: "Villa de Prestige avec Piscine", subtitle: "Villa 5 ch. · Piscine · 450 m²",
    description: "Magnifique villa de prestige dans le quartier diplomatique de Gombe. Finitions haut de gamme, piscine à débordement et jardin paysager. Idéale pour une famille exigeante ou un investisseur premium.",
    bedrooms: 5, bathrooms: 4, areaSqm: 450, price: 650000, currency: "USD",
    suburb: "Gombe", neighborhood: "Quartier diplomatique", city: "Kinshasa",
    amenities: AM_VILLA, agentSlot: 0, verified: true, premium: true, isNew: false, reference: "OPI-2026-001",
  },
  {
    folder: "images-1/villas/villa-2", keyPrefix: "seed/props/v1a2",
    category: "villa", iconType: "villa", imageGradient: "from-stone-600 to-stone-800",
    listingType: "sale", title: "Magnifique Villa Familiale", subtitle: "Villa 4 ch. · Jardin · 380 m²",
    description: "Belle villa familiale à Ngaliema avec grand jardin arboré. Salon spacieux, cuisine équipée, 4 chambres en suite. Résidence gardée avec groupe électrogène et citerne d'eau.",
    bedrooms: 4, bathrooms: 3, areaSqm: 380, price: 480000, currency: "USD",
    suburb: "Ngaliema", neighborhood: "Les Collines", city: "Kinshasa",
    amenities: AM_VILLA, agentSlot: 0, verified: true, premium: false, isNew: false, reference: "OPI-2026-002",
  },
  {
    folder: "images-2/villa/villa-1", keyPrefix: "seed/props/v2a1",
    category: "villa", iconType: "villa", imageGradient: "from-teal-700 to-teal-900",
    listingType: "rent", title: "Villa Meublée Haut Standing", subtitle: "Location · 4 ch. · Meublée · 360 m²",
    description: "Villa haut standing entièrement meublée à Gombe, idéale pour expatriés ou diplomates. Mobilier moderne, électroménager neuf, piscine et sécurité 24h. Disponible immédiatement.",
    bedrooms: 4, bathrooms: 3, areaSqm: 360, price: 3500, currency: "USD", period: "mois",
    suburb: "Gombe", neighborhood: "Zone diplomatique", city: "Kinshasa",
    amenities: AM_VILLA, agentSlot: 0, verified: true, premium: true, isNew: true, reference: "OPI-2026-003",
  },
  {
    folder: "images-2/villa/villa-2", keyPrefix: "seed/props/v2a2",
    category: "villa", iconType: "villa", imageGradient: "from-indigo-700 to-indigo-900",
    listingType: "rent", title: "Grande Villa Familiale avec Piscine", subtitle: "Location · 5 ch. · Piscine · 420 m²",
    description: "Spacieuse villa avec piscine à Ngaliema, dans une résidence sécurisée. Idéale pour famille nombreuse. Grand salon, cuisine américaine, terrasse ombragée. Groupe électrogène inclus.",
    bedrooms: 5, bathrooms: 4, areaSqm: 420, price: 4200, currency: "USD", period: "mois",
    suburb: "Ngaliema", neighborhood: "Résidence Paradis", city: "Kinshasa",
    amenities: AM_VILLA, agentSlot: 0, verified: false, premium: false, isNew: false, reference: "OPI-2026-004",
  },
  // ─── Agent 1 : Carine Mwanza (Agence 0) ──────────────────────────────────
  {
    folder: "images-1/apartments/apartment-1", keyPrefix: "seed/props/apt1",
    category: "appartement", iconType: "apartment", imageGradient: "from-blue-600 to-blue-800",
    listingType: "sale", title: "Appartement Haut Standing en Duplex", subtitle: "Appt. 3 ch. · Duplex · 180 m²",
    description: "Splendide appartement duplex au cœur de Gombe avec vue panoramique sur la ville. Finitions luxueuses, parquet massif, baignoire sur pieds dans la suite parentale. Un bien rare sur le marché.",
    bedrooms: 3, bathrooms: 2, areaSqm: 180, price: 220000, currency: "USD",
    suburb: "Gombe", neighborhood: "Centre-ville", city: "Kinshasa",
    amenities: AM_APT, agentSlot: 1, verified: true, premium: true, isNew: false, reference: "OPI-2026-005",
  },
  {
    folder: "images-1/apartments/apartment-2", keyPrefix: "seed/props/apt2",
    category: "appartement", iconType: "apartment", imageGradient: "from-cyan-600 to-cyan-800",
    listingType: "rent", title: "Appartement 3 Chambres avec Balcon", subtitle: "Location · 3 ch. · Balcon · 165 m²",
    description: "Appartement spacieux et lumineux à Limete avec grand balcon orienté est. Cuisine équipée, parking réservé, groupe électrogène de l'immeuble. Proximité des marchés et transports.",
    bedrooms: 3, bathrooms: 2, areaSqm: 165, price: 1800, currency: "USD", period: "mois",
    suburb: "Limete", neighborhood: "Quartier Industriel", city: "Kinshasa",
    amenities: AM_APT, agentSlot: 1, verified: true, premium: false, isNew: false, reference: "OPI-2026-006",
  },
  {
    folder: "images-1/apartments/apartment-3", keyPrefix: "seed/props/apt3",
    category: "appartement", iconType: "apartment", imageGradient: "from-violet-600 to-violet-800",
    listingType: "sale", title: "Appartement de Standing avec Vue", subtitle: "Appt. 2 ch. · Vue Fleuve · 140 m²",
    description: "Appartement moderne avec vue imprenable sur le fleuve Congo depuis Ngaliema. Cuisine ouverte, séjour lumineux, 2 chambres en suite. Résidence sécurisée avec gardien.",
    bedrooms: 2, bathrooms: 2, areaSqm: 140, price: 175000, currency: "USD",
    suburb: "Ngaliema", neighborhood: "Bord du Fleuve", city: "Kinshasa",
    amenities: AM_APT, agentSlot: 1, verified: false, premium: false, isNew: true, reference: "OPI-2026-007",
  },
  {
    folder: "images-2/apartments/apartment-1", keyPrefix: "seed/props/apt2a1",
    category: "appartement", iconType: "apartment", imageGradient: "from-emerald-600 to-emerald-800",
    listingType: "rent", title: "Appartement Meublé avec Parking", subtitle: "Location · 2 ch. · Meublé · 105 m²",
    description: "Appartement entièrement meublé avec parking couvert à Lemba. Idéal pour couple ou jeune famille. Voisinage calme et sécurisé, proche des commerces et de l'université.",
    bedrooms: 2, bathrooms: 1, areaSqm: 105, price: 1100, currency: "USD", period: "mois",
    suburb: "Lemba", neighborhood: "Campus", city: "Kinshasa",
    amenities: AM_APT, agentSlot: 1, verified: false, premium: false, isNew: true, reference: "OPI-2026-008",
  },
  // ─── Agent 2 : Pierre Kabila (Agence 0) ──────────────────────────────────
  {
    folder: "images-1/villas/villa-3", keyPrefix: "seed/props/v1a3",
    category: "villa", iconType: "villa", imageGradient: "from-amber-700 to-amber-900",
    listingType: "sale", title: "Villa Contemporaine avec Jardin", subtitle: "Villa 4 ch. · Jardin · 320 m²",
    description: "Villa de style contemporain à Limete, bien entretenue avec grand jardin. Architecture moderne, larges baies vitrées, cuisine américaine. Groupe électrogène 12 KVA et citerne d'eau 10000 L inclus.",
    bedrooms: 4, bathrooms: 3, areaSqm: 320, price: 420000, currency: "USD",
    suburb: "Limete", neighborhood: "Résidence Fonds Mbila", city: "Kinshasa",
    amenities: AM_VILLA, agentSlot: 2, verified: true, premium: false, isNew: false, reference: "OPI-2026-009",
  },
  {
    folder: "images-1/studios/studio-1", keyPrefix: "seed/props/stu1",
    category: "studio", iconType: "studio", imageGradient: "from-pink-600 to-pink-800",
    listingType: "rent", title: "Studio Meublé Proche Université", subtitle: "Location · Studio · Meublé · 45 m²",
    description: "Studio meublé et équipé proche de l'Université de Kinshasa. Lit double, kitchenette, salle de bain privative. Eau et électricité incluses. Idéal pour étudiant ou jeune professionnel.",
    bedrooms: 1, bathrooms: 1, areaSqm: 45, price: 600, currency: "USD", period: "mois",
    suburb: "Lemba", neighborhood: "Quartier Universitaire", city: "Kinshasa",
    amenities: AM_STUDIO, agentSlot: 2, verified: false, premium: false, isNew: false, reference: "OPI-2026-010",
  },
  {
    folder: "images-1/apartments/apartment-4", keyPrefix: "seed/props/apt4",
    category: "appartement", iconType: "apartment", imageGradient: "from-rose-600 to-rose-800",
    listingType: "sale", title: "Grand Appartement Familial", subtitle: "Appt. 4 ch. · Grande cuisine · 220 m²",
    description: "Grand appartement familial à Gombe avec 4 chambres, salon double, grande cuisine et deux terrasses. Immeuble récent avec ascenseur, gardiennage et générateur. Proximité des écoles internationales.",
    bedrooms: 4, bathrooms: 3, areaSqm: 220, price: 280000, currency: "USD",
    suburb: "Gombe", neighborhood: "Avenue des Écoles", city: "Kinshasa",
    amenities: AM_APT, agentSlot: 2, verified: true, premium: false, isNew: false, reference: "OPI-2026-011",
  },
  // ─── Agent 3 : Solange Ntumba (Agence 0) ─────────────────────────────────
  {
    folder: "images-1/apartments/apartment-5", keyPrefix: "seed/props/apt5",
    category: "appartement", iconType: "apartment", imageGradient: "from-orange-600 to-orange-800",
    listingType: "rent", title: "Appartement Meublé Centre-Ville", subtitle: "Location · 2 ch. · Meublé · 95 m²",
    description: "Appartement meublé et bien entretenu à Barumbu, à deux pas du centre-ville. Mobilier complet, connexion internet incluse, parking dans l'enceinte. Disponible de suite.",
    bedrooms: 2, bathrooms: 1, areaSqm: 95, price: 1200, currency: "USD", period: "mois",
    suburb: "Barumbu", neighborhood: "Centre commercial", city: "Kinshasa",
    amenities: AM_APT, agentSlot: 3, verified: false, premium: false, isNew: false, reference: "OPI-2026-012",
  },
  {
    folder: "images-1/studios/studio-2", keyPrefix: "seed/props/stu2",
    category: "studio", iconType: "studio", imageGradient: "from-lime-600 to-lime-800",
    listingType: "rent", title: "Studio Moderne Tout Équipé", subtitle: "Location · Studio · 52 m²",
    description: "Studio moderne avec coin bureau dans une résidence sécurisée à Kasa-Vubu. Tout équipé : réfrigérateur, machine à laver, climatisation. Eau chaude et parking inclus.",
    bedrooms: 1, bathrooms: 1, areaSqm: 52, price: 700, currency: "USD", period: "mois",
    suburb: "Kasa-Vubu", neighborhood: "Avenue Kasa-Vubu", city: "Kinshasa",
    amenities: AM_STUDIO, agentSlot: 3, verified: false, premium: false, isNew: true, reference: "OPI-2026-013",
  },
  {
    folder: "images-1/offices/office-1", keyPrefix: "seed/props/off1",
    category: "bureau", iconType: "office", imageGradient: "from-sky-600 to-sky-800",
    listingType: "rent", title: "Bureau Haut Standing Vue Panoramique", subtitle: "Bureau · 250 m² · 12e étage",
    description: "Plateau de bureaux au 12e étage d'une tour moderne à Gombe avec vue panoramique. Climatisation centralisée, fibre optique, salles de réunion équipées, parking VIP. Immeuble certifié.",
    bedrooms: 0, bathrooms: 2, areaSqm: 250, price: 5000, currency: "USD", period: "mois",
    suburb: "Gombe", neighborhood: "Tour Centrale", city: "Kinshasa",
    amenities: AM_OFFICE, agentSlot: 3, verified: true, premium: true, isNew: false, reference: "OPI-2026-014",
  },
  // ─── Agent 4 : David Lumumba (Agence 1) ──────────────────────────────────
  {
    folder: "images-1/villas/villa-4", keyPrefix: "seed/props/v1a4",
    category: "villa", iconType: "villa", imageGradient: "from-fuchsia-700 to-fuchsia-900",
    listingType: "sale", title: "Villa Luxueuse Vue Fleuve Congo", subtitle: "Villa 6 ch. · Vue Fleuve · 520 m²",
    description: "Villa d'exception à Gombe offrant une vue imprenable sur le fleuve Congo et Brazzaville. 6 chambres dont une suite présidentielle, piscine à débordement, cave à vin, salle de cinéma. Le summum du luxe à Kinshasa.",
    bedrooms: 6, bathrooms: 5, areaSqm: 520, price: 850000, currency: "USD",
    suburb: "Gombe", neighborhood: "Bord du Fleuve", city: "Kinshasa",
    amenities: [...AM_VILLA, "Cave à vin", "Salle de cinéma", "Espace barbecue"], agentSlot: 4, verified: true, premium: true, isNew: false, reference: "CPR-2026-001",
  },
  {
    folder: "images-2/villa/villa-3", keyPrefix: "seed/props/v2a3",
    category: "villa", iconType: "villa", imageGradient: "from-cyan-700 to-cyan-900",
    listingType: "rent", title: "Villa Moderne en Résidence Gardée", subtitle: "Location · 3 ch. · Résidence · 280 m²",
    description: "Villa moderne dans une résidence privée et gardée à Limete. Architecture soignée, jardin floral, terrasse avec barbecue. Groupe électrogène, eau permanente. Idéale pour famille expatriée.",
    bedrooms: 3, bathrooms: 2, areaSqm: 280, price: 2800, currency: "USD", period: "mois",
    suburb: "Limete", neighborhood: "Résidence Gardée", city: "Kinshasa",
    amenities: AM_VILLA, agentSlot: 4, verified: false, premium: false, isNew: false, reference: "CPR-2026-002",
  },
  {
    folder: "images-1/apartments/apartment-6", keyPrefix: "seed/props/apt6",
    category: "appartement", iconType: "apartment", imageGradient: "from-blue-700 to-blue-900",
    listingType: "sale", title: "Appartement 3 Chambres Rénové", subtitle: "Appt. 3 ch. · Rénové · 158 m²",
    description: "Appartement entièrement rénové à Kintambo avec matériaux de qualité. Nouvelle cuisine, parquet flottant, peintures récentes. Résidence avec gardien et parking. À deux pas du centre-ville.",
    bedrooms: 3, bathrooms: 2, areaSqm: 158, price: 185000, currency: "USD",
    suburb: "Kintambo", neighborhood: "Marché central", city: "Kinshasa",
    amenities: AM_APT, agentSlot: 4, verified: false, premium: false, isNew: true, reference: "CPR-2026-003",
  },
  {
    folder: "images-1/boutiques/boutique-1", keyPrefix: "seed/props/bou1",
    category: "boutique", iconType: "shop", imageGradient: "from-yellow-600 to-yellow-800",
    listingType: "rent", title: "Boutique Commerciale en Angle", subtitle: "Location · Boutique · 85 m² · Forte visibilité",
    description: "Boutique en angle sur une avenue très fréquentée à Barumbu. Grande vitrine sur deux côtés, arrière-boutique avec stockage, alimentation électrique triphasée. Idéale pour commerce de détail ou restaurant.",
    bedrooms: 0, bathrooms: 1, areaSqm: 85, price: 2200, currency: "USD", period: "mois",
    suburb: "Barumbu", neighborhood: "Avenue commerciale", city: "Kinshasa",
    amenities: AM_SHOP, agentSlot: 4, verified: false, premium: false, isNew: false, reference: "CPR-2026-004",
  },
  // ─── Agent 5 : Marie-Claire Botuli (Agence 1) ────────────────────────────
  {
    folder: "images-2/duplex/duplex-1", keyPrefix: "seed/props/dup1",
    category: "duplex", iconType: "apartment", imageGradient: "from-purple-600 to-purple-800",
    listingType: "sale", title: "Duplex Moderne 4 Chambres", subtitle: "Duplex 4 ch. · Terrasse · 280 m²",
    description: "Superbe duplex contemporain à Ngaliema avec grande terrasse au dernier étage. Salon double hauteur, cuisine américaine, 4 chambres en suite. Résidence sécurisée avec pool commun.",
    bedrooms: 4, bathrooms: 3, areaSqm: 280, price: 380000, currency: "USD",
    suburb: "Ngaliema", neighborhood: "Résidence Les Flamboyants", city: "Kinshasa",
    amenities: AM_DUPLEX, agentSlot: 5, verified: true, premium: false, isNew: true, reference: "CPR-2026-005",
  },
  {
    folder: "images-2/apartments/apartment-2", keyPrefix: "seed/props/apt2a2",
    category: "appartement", iconType: "apartment", imageGradient: "from-green-600 to-green-800",
    listingType: "rent", title: "Appartement Spacieux avec Parking", subtitle: "Location · 3 ch. · Parking · 155 m²",
    description: "Appartement lumineux et spacieux à Matete avec parking couvert pour deux véhicules. Salon avec climatisation, cuisine équipée, 3 chambres, 2 salles de bain. Groupe électrogène de l'immeuble.",
    bedrooms: 3, bathrooms: 2, areaSqm: 155, price: 1600, currency: "USD", period: "mois",
    suburb: "Matete", neighborhood: "Marché Matete", city: "Kinshasa",
    amenities: AM_APT, agentSlot: 5, verified: false, premium: false, isNew: false, reference: "CPR-2026-006",
  },
  {
    folder: "images-1/apartments/apartment-7", keyPrefix: "seed/props/apt7",
    category: "appartement", iconType: "apartment", imageGradient: "from-teal-600 to-teal-800",
    listingType: "sale", title: "Appartement Moderne avec Terrasse", subtitle: "Appt. 2 ch. · Terrasse · 120 m²",
    description: "Appartement moderne au 5e étage avec terrasse exposée plein ouest à Lingwala. Séjour lumineux, cuisine ouverte, 2 chambres, salle de bain avec baignoire. Vue sur le quartier résidentiel.",
    bedrooms: 2, bathrooms: 2, areaSqm: 120, price: 145000, currency: "USD",
    suburb: "Lingwala", neighborhood: "Avenue Lingwala", city: "Kinshasa",
    amenities: AM_APT, agentSlot: 5, verified: false, premium: false, isNew: false, reference: "CPR-2026-007",
  },
  // ─── Agent 6 : Jacques Nzinga (Agence 1) ─────────────────────────────────
  {
    folder: "images-1/boutiques/boutique-2", keyPrefix: "seed/props/bou2",
    category: "boutique", iconType: "shop", imageGradient: "from-orange-700 to-orange-900",
    listingType: "sale", title: "Local Commercial Avenue Principale", subtitle: "Vente · Commerce · 120 m² · Très fréquenté",
    description: "Local commercial bien situé sur l'avenue principale de Gombe, idéal pour banque, pharmacie ou boutique de luxe. Façade vitrée sur 12 m, climatisation, triple accès. Valeur patrimoniale assurée.",
    bedrooms: 0, bathrooms: 1, areaSqm: 120, price: 350000, currency: "USD",
    suburb: "Gombe", neighborhood: "Avenue principale", city: "Kinshasa",
    amenities: AM_SHOP, agentSlot: 6, verified: true, premium: true, isNew: false, reference: "CPR-2026-008",
  },
  {
    folder: "images-1/offices/office-2", keyPrefix: "seed/props/off2",
    category: "bureau", iconType: "office", imageGradient: "from-slate-500 to-slate-700",
    listingType: "rent", title: "Espace de Bureaux Moderne", subtitle: "Location · Bureau · 180 m² · Open Space",
    description: "Espace de bureaux moderne en open space à Limete, entièrement câblé et prêt à l'emploi. 3 salles de réunion, cuisine de bureau, terrasse privative. Immeuble avec gardiennage et parking.",
    bedrooms: 0, bathrooms: 1, areaSqm: 180, price: 3500, currency: "USD", period: "mois",
    suburb: "Limete", neighborhood: "Zone d'affaires", city: "Kinshasa",
    amenities: AM_OFFICE, agentSlot: 6, verified: false, premium: false, isNew: false, reference: "CPR-2026-009",
  },
  {
    folder: "images-1/boutiques/boutique-3", keyPrefix: "seed/props/bou3",
    category: "boutique", iconType: "shop", imageGradient: "from-red-600 to-red-800",
    listingType: "rent", title: "Boutique Bien Aménagée", subtitle: "Location · Boutique · 65 m²",
    description: "Boutique aménagée avec présentoirs intégrés dans un quartier commerçant animé de Kinshasa. Électricité triphasée, eau courante, arrière-boutique, WC. Loyer négociable sur 2 ans.",
    bedrooms: 0, bathrooms: 1, areaSqm: 65, price: 1500, currency: "USD", period: "mois",
    suburb: "Kinshasa", neighborhood: "Marché Central", city: "Kinshasa",
    amenities: AM_SHOP, agentSlot: 6, verified: false, premium: false, isNew: false, reference: "CPR-2026-010",
  },
  // ─── Agent 7 : Robert Mukendi (Agence 2) ─────────────────────────────────
  {
    folder: "images-1/villas/villa-5", keyPrefix: "seed/props/v1a5",
    category: "villa", iconType: "villa", imageGradient: "from-emerald-700 to-emerald-900",
    listingType: "sale", title: "Villa Résidentielle Sécurisée", subtitle: "Villa 5 ch. · Résidence · 400 m²",
    description: "Belle villa dans une résidence fermée et sécurisée à Ngaliema. 5 chambres spacieuses, deux salons, cuisine professionnelle, piscine partagée, gardiennage armé. Titre foncier propre.",
    bedrooms: 5, bathrooms: 4, areaSqm: 400, price: 550000, currency: "USD",
    suburb: "Ngaliema", neighborhood: "Résidence Sécurisée", city: "Kinshasa",
    amenities: AM_VILLA, agentSlot: 7, verified: true, premium: true, isNew: false, reference: "KEP-2026-001",
  },
  {
    folder: "images-2/villa/villa-4", keyPrefix: "seed/props/v2a4",
    category: "villa", iconType: "villa", imageGradient: "from-violet-700 to-violet-900",
    listingType: "rent", title: "Villa Prestige Entièrement Rénovée", subtitle: "Location · 4 ch. · Rénovée · 350 m²",
    description: "Villa entièrement rénovée en 2025 à Gombe. Matériaux importés, cuisine équipée haut de gamme, 4 suites parentales, piscine chauffée, jacuzzi extérieur. Pour diplomates et cadres supérieurs.",
    bedrooms: 4, bathrooms: 3, areaSqm: 350, price: 3200, currency: "USD", period: "mois",
    suburb: "Gombe", neighborhood: "Zone VIP", city: "Kinshasa",
    amenities: [...AM_VILLA, "Jacuzzi", "Cuisine professionnelle"], agentSlot: 7, verified: true, premium: true, isNew: true, reference: "KEP-2026-002",
  },
  {
    folder: "images-1/terrains/terrain-1", keyPrefix: "seed/props/ter1",
    category: "terrain", iconType: "land", imageGradient: "from-stone-500 to-stone-700",
    listingType: "sale", title: "Terrain Titré Zone Résidentielle", subtitle: "Terrain · 1000 m² · Titre foncier",
    description: "Terrain titré de 1000 m² en zone résidentielle de Ngaliema. Sol stable, accès voie asphaltée, eau et électricité en bordure. Documents légaux complets. Idéal pour construction villa.",
    bedrooms: 0, bathrooms: 0, areaSqm: 1000, price: 180000, currency: "USD",
    suburb: "Ngaliema", neighborhood: "Zone résidentielle", city: "Kinshasa",
    amenities: AM_TERRAIN, agentSlot: 7, verified: true, premium: false, isNew: false, reference: "KEP-2026-003",
  },
  {
    folder: "images-2/duplex/duplex-2", keyPrefix: "seed/props/dup2",
    category: "duplex", iconType: "apartment", imageGradient: "from-blue-600 to-indigo-800",
    listingType: "sale", title: "Duplex Standing avec Vue Ville", subtitle: "Duplex 4 ch. · Vue Ville · 260 m²",
    description: "Duplex de standing avec vue imprenable sur Kinshasa depuis le 8e étage. Grand salon ouvert sur terrasse, 4 chambres, 3 salles de bain, cuisine équipée. Ascenseur privé, parking double.",
    bedrooms: 4, bathrooms: 3, areaSqm: 260, price: 320000, currency: "USD",
    suburb: "Gombe", neighborhood: "Collines de Gombe", city: "Kinshasa",
    amenities: AM_DUPLEX, agentSlot: 7, verified: true, premium: false, isNew: false, reference: "KEP-2026-004",
  },
  // ─── Agent 8 : Judith Bompela (Agence 2) ─────────────────────────────────
  {
    folder: "images-1/studios/studio-3", keyPrefix: "seed/props/stu3",
    category: "studio", iconType: "studio", imageGradient: "from-fuchsia-600 to-fuchsia-800",
    listingType: "rent", title: "Studio Cosy en Résidence Sécurisée", subtitle: "Location · Studio · Résidence · 48 m²",
    description: "Studio cosy et fonctionnel dans une résidence sécurisée à Bandalungwa. Kitchenette équipée, salle de bain complète, WiFi inclus. Idéal pour professionnel ou étudiant. Eau et électricité incluses.",
    bedrooms: 1, bathrooms: 1, areaSqm: 48, price: 650, currency: "USD", period: "mois",
    suburb: "Bandalungwa", neighborhood: "Résidence Calme", city: "Kinshasa",
    amenities: AM_STUDIO, agentSlot: 8, verified: false, premium: false, isNew: false, reference: "KEP-2026-005",
  },
  {
    folder: "images-1/apartments/apartment-8", keyPrefix: "seed/props/apt8",
    category: "appartement", iconType: "apartment", imageGradient: "from-gold-600 to-amber-700",
    listingType: "sale", title: "Penthouse Luxueux avec Vue 360°", subtitle: "Penthouse 3 ch. · Vue 360° · 200 m²",
    description: "Penthouse d'exception au dernier étage d'un immeuble de Gombe offrant une vue à 360°. Terrasse de 80 m², cuisine de chef, salon cathédrale, jacuzzi extérieur. Le bien le plus exclusif du marché.",
    bedrooms: 3, bathrooms: 2, areaSqm: 200, price: 320000, currency: "USD",
    suburb: "Gombe", neighborhood: "Tour de Gombe", city: "Kinshasa",
    amenities: [...AM_APT, "Jacuzzi", "Terrasse 80 m²", "Cave à vin"], agentSlot: 8, verified: true, premium: true, isNew: false, reference: "KEP-2026-006",
  },
  {
    folder: "images-1/studios/studio-4", keyPrefix: "seed/props/stu4",
    category: "studio", iconType: "studio", imageGradient: "from-red-500 to-pink-700",
    listingType: "sale", title: "Studio Neuf Bien Aménagé", subtitle: "Vente · Studio · Neuf · 50 m²",
    description: "Studio neuf en vente dans une résidence moderne de Kalamu. Finitions impeccables, cuisine américaine, coin bureau, dressing. Bon investissement locatif avec rendement garanti de 8% annuel.",
    bedrooms: 1, bathrooms: 1, areaSqm: 50, price: 55000, currency: "USD",
    suburb: "Kalamu", neighborhood: "Résidence Neuve", city: "Kinshasa",
    amenities: AM_STUDIO, agentSlot: 8, verified: false, premium: false, isNew: true, reference: "KEP-2026-007",
  },
  // ─── Agent 9 : Paul Ndombe (Agence 2) ────────────────────────────────────
  {
    folder: "images-1/terrains/terrain-2", keyPrefix: "seed/props/ter2",
    category: "terrain", iconType: "land", imageGradient: "from-green-700 to-green-900",
    listingType: "sale", title: "Grand Terrain Constructible", subtitle: "Terrain · 2500 m² · Mont-Ngafula",
    description: "Grand terrain de 2500 m² en zone résidentielle paisible de Mont-Ngafula. Vue dégagée sur les collines, sol sain, accès piste carrossable. Idéal pour ensemble résidentiel ou villa de très grande taille.",
    bedrooms: 0, bathrooms: 0, areaSqm: 2500, price: 350000, currency: "USD",
    suburb: "Mont-Ngafula", neighborhood: "Collines Résidentielles", city: "Kinshasa",
    amenities: AM_TERRAIN, agentSlot: 9, verified: true, premium: false, isNew: false, reference: "KEP-2026-008",
  },
  {
    folder: "images-2/villa/villa-5", keyPrefix: "seed/props/v2a5",
    category: "villa", iconType: "villa", imageGradient: "from-lime-700 to-lime-900",
    listingType: "rent", title: "Villa Tropicale avec Grand Jardin", subtitle: "Location · 4 ch. · Jardin · 390 m²",
    description: "Villa au style tropical avec un jardin exceptionnel à Mont-Ngafula. Espace de vie en plein air, pergola, fontaine décorative. 4 chambres, 3 salles de bain. Idéale pour familles aimant la nature.",
    bedrooms: 4, bathrooms: 3, areaSqm: 390, price: 3800, currency: "USD", period: "mois",
    suburb: "Mont-Ngafula", neighborhood: "Jardin Vert", city: "Kinshasa",
    amenities: AM_VILLA, agentSlot: 9, verified: false, premium: false, isNew: false, reference: "KEP-2026-009",
  },
  {
    folder: "images-2/duplex/duplex-3", keyPrefix: "seed/props/dup3",
    category: "duplex", iconType: "apartment", imageGradient: "from-sky-700 to-sky-900",
    listingType: "rent", title: "Duplex Familial avec Terrasse", subtitle: "Location · 3 ch. · Terrasse · 220 m²",
    description: "Beau duplex familial avec grande terrasse à Limete. Salon spacieux, cuisine équipée avec îlot central, 3 chambres, terrasse de 30 m². Résidence gardée avec groupe électrogène et citerne.",
    bedrooms: 3, bathrooms: 2, areaSqm: 220, price: 2800, currency: "USD", period: "mois",
    suburb: "Limete", neighborhood: "Résidence Les Palmiers", city: "Kinshasa",
    amenities: AM_DUPLEX, agentSlot: 9, verified: false, premium: false, isNew: false, reference: "KEP-2026-010",
  },
  // ─── Agent 10 : Patrick Tshibangu (Agence 3) ─────────────────────────────
  {
    folder: "images-1/offices/office-3", keyPrefix: "seed/props/off3",
    category: "bureau", iconType: "office", imageGradient: "from-blue-800 to-blue-950",
    listingType: "sale", title: "Bureau Clé en Main", subtitle: "Vente · Bureau · Équipé · 120 m²",
    description: "Bureau clé en main à Ngaliema, entièrement équipé et prêt à l'emploi. Mobilier de direction, salle de réunion vitrée, kitchenette, 2 WC. Climatisation split inverter, groupe électrogène, parking 5 places.",
    bedrooms: 0, bathrooms: 1, areaSqm: 120, price: 280000, currency: "USD",
    suburb: "Ngaliema", neighborhood: "Zone d'affaires", city: "Kinshasa",
    amenities: AM_OFFICE, agentSlot: 10, verified: true, premium: false, isNew: false, reference: "ICI-2026-001",
  },
  {
    folder: "images-1/warehouses/warehoue-1", keyPrefix: "seed/props/wh1",
    category: "entrepôt", iconType: "warehouse", imageGradient: "from-zinc-600 to-zinc-800",
    listingType: "rent", title: "Entrepôt Industriel Zone Franche", subtitle: "Location · Entrepôt · 800 m² · Accès PL",
    description: "Grand entrepôt industriel avec accès poids lourds à Ndjili. Quai de chargement, pont roulant 5 tonnes, bureaux intégrés sur mezzanine, groupe électrogène triphasé 80 KVA. Idéal pour distribution ou stockage.",
    bedrooms: 0, bathrooms: 1, areaSqm: 800, price: 8000, currency: "USD", period: "mois",
    suburb: "Ndjili", neighborhood: "Zone industrielle", city: "Kinshasa",
    amenities: AM_ENTREPOT, agentSlot: 10, verified: false, premium: false, isNew: false, reference: "ICI-2026-002",
  },
  {
    folder: "images-1/offices/office-4", keyPrefix: "seed/props/off4",
    category: "bureau", iconType: "office", imageGradient: "from-neutral-600 to-neutral-800",
    listingType: "rent", title: "Plateau de Bureaux Aménagé", subtitle: "Location · Bureau · Open Space · 320 m²",
    description: "Grand plateau de bureaux aménagé à Gombe, idéal pour cabinet d'avocats, ONG ou grande entreprise. Open space de 200 m² + 4 bureaux fermés + 2 salles de réunion + kitchenette. Fibre optique incluse.",
    bedrooms: 0, bathrooms: 2, areaSqm: 320, price: 6500, currency: "USD", period: "mois",
    suburb: "Gombe", neighborhood: "Immeuble Central", city: "Kinshasa",
    amenities: AM_OFFICE, agentSlot: 10, verified: true, premium: true, isNew: false, reference: "ICI-2026-003",
  },
  {
    folder: "images-2/apartments/apartment-3", keyPrefix: "seed/props/apt2a3",
    category: "appartement", iconType: "apartment", imageGradient: "from-violet-500 to-purple-700",
    listingType: "sale", title: "Appartement 2 Pièces Bien Situé", subtitle: "Appt. 2 ch. · Bien situé · 90 m²",
    description: "Appartement propre et bien entretenu à Kinshasa commune, proche de tous les commerces et transports. 2 chambres, salon, cuisine, salle de bain. Document de vente propre. Excellent rapport qualité-prix.",
    bedrooms: 2, bathrooms: 1, areaSqm: 90, price: 110000, currency: "USD",
    suburb: "Kinshasa", neighborhood: "Centre Kinshasa", city: "Kinshasa",
    amenities: AM_APT, agentSlot: 10, verified: false, premium: false, isNew: false, reference: "ICI-2026-004",
  },
  // ─── Agent 11 : Élise Kayumba (Agence 3) ─────────────────────────────────
  {
    folder: "images-1/boutiques/boutique-4", keyPrefix: "seed/props/bou4",
    category: "boutique", iconType: "shop", imageGradient: "from-amber-600 to-amber-800",
    listingType: "sale", title: "Commerce Avec Grande Vitrine", subtitle: "Vente · Commerce · Grande vitrine · 95 m²",
    description: "Local commercial avec grande vitrine sur l'une des avenues les plus commerçantes de Limete. Fort potentiel de clientèle, arrière-boutique, stock room, triphasé. Idéal pour supermarché ou boutique de mode.",
    bedrooms: 0, bathrooms: 1, areaSqm: 95, price: 220000, currency: "USD",
    suburb: "Limete", neighborhood: "Avenue commerciale", city: "Kinshasa",
    amenities: AM_SHOP, agentSlot: 11, verified: false, premium: false, isNew: false, reference: "ICI-2026-005",
  },
  {
    folder: "images-1/offices/office-5", keyPrefix: "seed/props/off5",
    category: "bureau", iconType: "office", imageGradient: "from-blue-500 to-sky-700",
    listingType: "sale", title: "Bureau Professionnel Bien Situé", subtitle: "Vente · Bureau · 95 m² · Kintambo",
    description: "Bureau professionnel à Kintambo avec finitions soignées. Salle d'attente, bureau principal et bureau secondaire, salle de réunion, WC indépendant. Parking 3 voitures, groupe électrogène. Titre propre.",
    bedrooms: 0, bathrooms: 1, areaSqm: 95, price: 180000, currency: "USD",
    suburb: "Kintambo", neighborhood: "Zone professionnelle", city: "Kinshasa",
    amenities: AM_OFFICE, agentSlot: 11, verified: true, premium: false, isNew: false, reference: "ICI-2026-006",
  },
  {
    folder: "images-1/warehouses/warehouse-2", keyPrefix: "seed/props/wh2",
    category: "entrepôt", iconType: "warehouse", imageGradient: "from-stone-700 to-stone-900",
    listingType: "sale", title: "Entrepôt Moderne avec Bureau Intégré", subtitle: "Vente · Entrepôt · Bureau · 600 m²",
    description: "Entrepôt moderne de 600 m² avec bureaux intégrés à Masina. Grande hauteur sous plafond (8 m), accès camions, quai surélevé, triphasé 380V. Bureaux de 80 m² climatisés avec vue sur la cour. Titre foncier sécurisé.",
    bedrooms: 0, bathrooms: 1, areaSqm: 600, price: 1200000, currency: "USD",
    suburb: "Masina", neighborhood: "Zone logistique", city: "Kinshasa",
    amenities: AM_ENTREPOT, agentSlot: 11, verified: true, premium: true, isNew: false, reference: "ICI-2026-007",
  },
  // ─── Agent 12 : François Mbemba (Agence 4) ───────────────────────────────
  {
    folder: "images-1/apartments/apartment-9", keyPrefix: "seed/props/apt9",
    category: "appartement", iconType: "apartment", imageGradient: "from-rose-500 to-rose-700",
    listingType: "sale", title: "Appartement Neuf 3 Chambres", subtitle: "Appt. 3 ch. · Neuf · 162 m²",
    description: "Appartement neuf dans un immeuble livré en 2025 à Barumbu. Cuisine américaine, séjour ouvert, 3 chambres dont une suite parentale avec dressing. Ascenseur, parking sécurisé, terrasse commune au sommet.",
    bedrooms: 3, bathrooms: 2, areaSqm: 162, price: 195000, currency: "USD",
    suburb: "Barumbu", neighborhood: "Résidence Neuve", city: "Kinshasa",
    amenities: AM_APT, agentSlot: 12, verified: false, premium: false, isNew: true, reference: "LMI-2026-001",
  },
  {
    folder: "images-2/apartments/apartment-4", keyPrefix: "seed/props/apt2a4",
    category: "appartement", iconType: "apartment", imageGradient: "from-teal-500 to-teal-700",
    listingType: "rent", title: "Appartement Lumineux avec Balcon", subtitle: "Location · 3 ch. · Balcon · 145 m²",
    description: "Appartement lumineux avec grand balcon orienté sud à Ndjili. Vue dégagée, séjour spacieux, cuisine équipée, 3 chambres. Groupe électrogène de l'immeuble. Proche des transports et des marchés.",
    bedrooms: 3, bathrooms: 2, areaSqm: 145, price: 1400, currency: "USD", period: "mois",
    suburb: "Ndjili", neighborhood: "Commune Ndjili", city: "Kinshasa",
    amenities: AM_APT, agentSlot: 12, verified: false, premium: false, isNew: false, reference: "LMI-2026-002",
  },
  {
    folder: "images-1/terrains/terrain-3", keyPrefix: "seed/props/ter3",
    category: "terrain", iconType: "land", imageGradient: "from-amber-500 to-orange-700",
    listingType: "sale", title: "Terrain avec Titre Foncier", subtitle: "Terrain · 800 m² · Selembao",
    description: "Terrain de 800 m² avec titre foncier enregistré à Selembao. Zone résidentielle en pleine expansion, sol sain, chemin d'accès. Toutes les démarches légales effectuées. Disponible de suite.",
    bedrooms: 0, bathrooms: 0, areaSqm: 800, price: 120000, currency: "USD",
    suburb: "Selembao", neighborhood: "Expansion résidentielle", city: "Kinshasa",
    amenities: AM_TERRAIN, agentSlot: 12, verified: false, premium: false, isNew: false, reference: "LMI-2026-003",
  },
  {
    folder: "images-2/duplex/duplex-4", keyPrefix: "seed/props/dup4",
    category: "duplex", iconType: "apartment", imageGradient: "from-indigo-500 to-indigo-700",
    listingType: "rent", title: "Duplex Lumineux en Résidence", subtitle: "Location · 3 ch. · Résidence · 200 m²",
    description: "Duplex lumineux dans une résidence gardée à Kintambo. Grand salon double hauteur, terrasse privée, cuisine équipée, 3 chambres. Piscine commune, gardiennage armé, parking couvert.",
    bedrooms: 3, bathrooms: 2, areaSqm: 200, price: 2500, currency: "USD", period: "mois",
    suburb: "Kintambo", neighborhood: "Résidence Gardée", city: "Kinshasa",
    amenities: AM_DUPLEX, agentSlot: 12, verified: false, premium: false, isNew: false, reference: "LMI-2026-004",
  },
  // ─── Agent 13 : Yvonne Kalonji (Agence 4) ────────────────────────────────
  {
    folder: "images-2/studio/studio-1", keyPrefix: "seed/props/stu2a1",
    category: "studio", iconType: "studio", imageGradient: "from-pink-500 to-pink-700",
    listingType: "rent", title: "Studio Lumineux Centre Ville", subtitle: "Location · Studio · Centre-ville · 55 m²",
    description: "Studio lumineux avec vue sur jardin intérieur dans le centre de Barumbu. Kitchenette équipée, salle de bain moderne, placard encastré, climatisation. Eau et électricité incluses. Idéal pour professionnel célibataire.",
    bedrooms: 1, bathrooms: 1, areaSqm: 55, price: 800, currency: "USD", period: "mois",
    suburb: "Barumbu", neighborhood: "Centre-ville", city: "Kinshasa",
    amenities: AM_STUDIO, agentSlot: 13, verified: false, premium: false, isNew: true, reference: "LMI-2026-005",
  },
  {
    folder: "images-2/studio/studio-2", keyPrefix: "seed/props/stu2a2",
    category: "studio", iconType: "studio", imageGradient: "from-yellow-500 to-amber-700",
    listingType: "sale", title: "Studio Équipé avec Cuisine Ouverte", subtitle: "Vente · Studio · Cuisine ouverte · 60 m²",
    description: "Studio bien pensé avec cuisine ouverte à Lingwala. Coin nuit séparé, espace bureau intégré, balconnette, rangements optimisés. Immeuble sécurisé avec gardien. Excellent investissement locatif.",
    bedrooms: 1, bathrooms: 1, areaSqm: 60, price: 65000, currency: "USD",
    suburb: "Lingwala", neighborhood: "Avenue Lingwala", city: "Kinshasa",
    amenities: AM_STUDIO, agentSlot: 13, verified: false, premium: false, isNew: false, reference: "LMI-2026-006",
  },
  {
    folder: "images-1/boutiques/boutique-5", keyPrefix: "seed/props/bou5",
    category: "boutique", iconType: "shop", imageGradient: "from-green-500 to-emerald-700",
    listingType: "rent", title: "Boutique de Coin Passante", subtitle: "Location · Boutique · Angle · 55 m²",
    description: "Boutique de coin dans un quartier très fréquenté de Kasa-Vubu. Visible depuis deux avenues, grande vitrine, alimentation électrique stable, eau courante. Loyer compétitif. Idéale pour alimentation ou téléphonie.",
    bedrooms: 0, bathrooms: 1, areaSqm: 55, price: 1200, currency: "USD", period: "mois",
    suburb: "Kasa-Vubu", neighborhood: "Carrefour", city: "Kinshasa",
    amenities: AM_SHOP, agentSlot: 13, verified: false, premium: false, isNew: false, reference: "LMI-2026-007",
  },
  {
    folder: "images-1/terrains/terrain-4", keyPrefix: "seed/props/ter4",
    category: "terrain", iconType: "land", imageGradient: "from-orange-500 to-red-700",
    listingType: "sale", title: "Terrain Prêt à Bâtir", subtitle: "Terrain · 1500 m² · Kisenso",
    description: "Terrain de 1500 m² avec titre foncier en zone de développement de Kisenso. Accès route goudronnée, eau et électricité disponibles. Idéal pour projet immobilier résidentiel ou commercial.",
    bedrooms: 0, bathrooms: 0, areaSqm: 1500, price: 220000, currency: "USD",
    suburb: "Kisenso", neighborhood: "Zone de développement", city: "Kinshasa",
    amenities: AM_TERRAIN, agentSlot: 13, verified: false, premium: false, isNew: false, reference: "LMI-2026-008",
  },
  {
    folder: "images-2/duplex/duplex-5", keyPrefix: "seed/props/dup5",
    category: "duplex", iconType: "apartment", imageGradient: "from-purple-500 to-purple-700",
    listingType: "sale", title: "Duplex Neuf Haut de Gamme", subtitle: "Duplex 5 ch. · Neuf · 340 m²",
    description: "Duplex neuf haut de gamme livré en 2026 à Mont-Ngafula. Matériaux de prestige, cuisine de chef, 5 chambres dont 2 suites, terrasse panoramique de 50 m². Résidence ultra-sécurisée avec piscine commune.",
    bedrooms: 5, bathrooms: 4, areaSqm: 340, price: 450000, currency: "USD",
    suburb: "Mont-Ngafula", neighborhood: "Résidence Premium", city: "Kinshasa",
    amenities: [...AM_DUPLEX, "Cuisine professionnelle", "Terrasse panoramique"], agentSlot: 13, verified: true, premium: true, isNew: true, reference: "LMI-2026-009",
  },
];

// ─── 7. Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌱  Seed démo Okapi — 5 agences · 20 agents · 50 propriétés\n");

  // ── Étape 1 : Agences ──────────────────────────────────────────────────────
  console.log("📦  Création des agences...");
  const agencyIds: string[] = [];
  for (let i = 0; i < AGENCIES.length; i++) {
    const ag = AGENCIES[i];
    const created = await prisma.agency.create({
      data: {
        name:             ag.name,
        monogram:         ag.monogram,
        accentClass:      ag.accentClass,
        tagline:          ag.tagline,
        email:            ag.email,
        phone:            ag.phone,
        whatsapp:         ag.whatsapp,
        website:          ag.website,
        address:          ag.address,
        description:      ag.description,
        founded:          ag.founded,
        communes:         ag.communes,
        propertyTypes:    ag.propertyTypes,
        rentalFocus:      ag.rentalFocus as any,
        specializations:  ag.specializations,
        areasServed:      ag.areasServed,
        languages:        ag.languages,
        rccmNumber:       ag.rccmNumber,
        freeListingCap:   ag.freeListingCap,
      },
    });
    agencyIds.push(created.id);
    console.log(`  ✅  [${i + 1}/5] ${ag.name}`);
  }

  // ── Étape 2 : Agents (photos uploadées) ───────────────────────────────────
  console.log("\n👤  Upload photos + création agents...");
  const agentIds: string[] = [];
  for (let i = 0; i < AGENTS.length; i++) {
    const ag = AGENTS[i];
    process.stdout.write(`  ↑  [${i + 1}/20] ${ag.name} — upload photo...`);
    const photoUrl = await uploadPhoto("images-1/agents", ag.photoFile, `seed/agents/agent-${i + 1}.jpg`);
    process.stdout.write(` ✓\n`);

    const created = await prisma.agent.create({
      data: {
        name:                ag.name,
        email:               ag.email,
        phoneNumber:         ag.phoneNumber,
        whatsappNumber:      (ag as any).whatsappNumber ?? null,
        agentType:           ag.agentType as any,
        agencyId:            ag.agencyIdx !== null ? agencyIds[ag.agencyIdx] : null,
        communes:            ag.communes,
        propertyTypes:       ag.propertyTypes,
        rentalFocus:         ag.rentalFocus as any,
        yearsExperienceLabel: ag.yearsExperienceLabel,
        bio:                 ag.bio,
        photo:               photoUrl,
        verificationTier:    ag.verificationTier as any,
        closedDeals:         ag.closedDeals,
        rating:              ag.rating,
        ratingsCount:        ag.ratingsCount,
        emailVerified:       true,
      },
    });
    agentIds.push(created.id);
  }

  // ── Étape 3 : Propriétés (galeries uploadées) ──────────────────────────────
  console.log("\n🏠  Upload galeries + création propriétés...");
  for (let i = 0; i < PROPERTIES.length; i++) {
    const p = PROPERTIES[i];
    const agentSlot = p.agentSlot;
    const agentId   = agentIds[agentSlot];
    const agencyIdx = AGENTS[agentSlot].agencyIdx as number;
    const agencyId  = agencyIds[agencyIdx];

    process.stdout.write(`  ↑  [${i + 1}/50] ${p.title} — upload galerie...`);
    const gallery = await uploadGallery(p.folder, p.keyPrefix, 7);
    process.stdout.write(` ${gallery.length} image(s) ✓\n`);

    await prisma.property.create({
      data: {
        agentId,
        agencyId,
        listingType:    p.listingType,
        category:       p.category,
        iconType:       p.iconType,
        imageGradient:  p.imageGradient,
        title:          p.title,
        subtitle:       p.subtitle,
        description:    p.description ?? "",
        bedrooms:       p.bedrooms,
        bathrooms:      p.bathrooms,
        areaSqm:        p.areaSqm,
        price:          p.price,
        currency:       p.currency,
        period:         (p as any).period ?? null,
        suburb:         p.suburb,
        neighborhood:   p.neighborhood,
        city:           p.city,
        amenities:      p.amenities,
        gallery,
        verified:       p.verified ?? false,
        premium:        p.premium ?? false,
        isNew:          p.isNew ?? false,
        reference:      (p as any).reference ?? null,
        listedDaysAgo:  Math.floor(Math.random() * 90),
      },
    });
  }

  console.log("\n🎉  Seed terminé avec succès !");
  console.log(`   • ${agencyIds.length} agences créées`);
  console.log(`   • ${agentIds.length} agents créés`);
  console.log(`   • ${PROPERTIES.length} propriétés créées`);
  console.log("\n   Démarrez le backend (npm run start:dev) puis visitez l'app.\n");
}

main()
  .catch((e) => { console.error("\n❌  Seed échoué :", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
