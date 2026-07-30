/**
 * Script pour configurer les règles CORS sur un bucket Cloudflare R2 (compatible S3).
 * 
 * Usage: node scripts/configure-r2-cors.js
 * 
 * Prérequis: les variables d'environnement S3_* doivent être définies dans .env.local ou .env.production
 */

const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require("@aws-sdk/client-s3");
const path = require("path");
const fs = require("fs");

// Chargement manuel des variables d'environnement (sans dépendance dotenv)
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Enlever les guillemets
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// Charger .env.local puis .env en fallback
loadEnvFile(path.join(__dirname, "..", ".env.local"));
if (!process.env.S3_ACCESS_KEY_ID) {
  loadEnvFile(path.join(__dirname, "..", ".env"));
}
if (!process.env.S3_ACCESS_KEY_ID) {
  loadEnvFile(path.join(__dirname, "..", ".env.production"));
}

const s3Client = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: !!process.env.S3_ENDPOINT,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "journal-storage";

// Origines autorisées pour le CORS
// Adaptez cette liste selon vos environnements de déploiement
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.NEXT_PUBLIC_APP_URL,
  // Ajoutez votre domaine Vercel ici :
  // "https://votre-projet.vercel.app",
  // "https://votre-domaine.com",
].filter(Boolean); // Filtre les valeurs undefined/null

const CORS_CONFIGURATION = {
  CORSRules: [
    {
      // Autorise les origines spécifiques (pas de wildcard avec credentials)
      AllowedOrigins: ALLOWED_ORIGINS,
      // Méthodes HTTP autorisées
      AllowedMethods: ["GET", "PUT", "HEAD", "POST", "DELETE"],
      // Headers autorisés dans la requête
      AllowedHeaders: [
        "Content-Type",
        "Content-Length",
        "Content-Encoding",
        "x-amz-*",
        "x-amz-checksum-*",
        "x-amz-meta-*",
        "x-id",
        "Authorization",
      ],
      // Headers exposés au client
      ExposeHeaders: [
        "ETag",
        "x-amz-request-id",
        "x-amz-version-id",
      ],
      // Durée de mise en cache du preflight (secondes)
      MaxAgeSeconds: 3600,
    },
  ],
};

async function main() {
  console.log("🚀 Configuration CORS pour le bucket R2");
  console.log("────────────────────────────────────────");
  console.log(`Bucket:   ${BUCKET_NAME}`);
  console.log(`Endpoint: ${process.env.S3_ENDPOINT || "(AWS S3 par défaut)"}`);
  console.log(`Origines: ${ALLOWED_ORIGINS.join(", ") || "(aucune définie!)"}`);
  console.log("");

  if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) {
    console.error("❌ ERREUR: S3_ACCESS_KEY_ID et S3_SECRET_ACCESS_KEY doivent être définis.");
    console.error("   Vérifiez votre fichier .env.local ou .env.production");
    process.exit(1);
  }

  if (ALLOWED_ORIGINS.length === 0) {
    console.warn("⚠️  ATTENTION: Aucune origine CORS définie !");
    console.warn("   Définissez NEXT_PUBLIC_APP_URL dans votre .env ou ajoutez des origines manuellement.");
    console.warn("   Le script continue avec les origines par défaut (localhost).");
    ALLOWED_ORIGINS.push("http://localhost:3000");
  }

  try {
    // 1. Vérifier la configuration CORS actuelle
    console.log("1️⃣  Vérification de la configuration CORS actuelle...");
    try {
      const getCorsCmd = new GetBucketCorsCommand({ Bucket: BUCKET_NAME });
      const currentCors = await s3Client.send(getCorsCmd);
      console.log("   Configuration CORS existante :");
      console.log(JSON.stringify(currentCors.CORSRules, null, 2));
    } catch (err) {
      if (err.name === "NoSuchCORSConfiguration") {
        console.log("   Aucune configuration CORS existante.");
      } else {
        console.warn(`   Impossible de lire la config CORS: ${err.message}`);
      }
    }

    // 2. Appliquer la nouvelle configuration
    console.log("\n2️⃣  Application de la nouvelle configuration CORS...");
    const putCorsCmd = new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: CORS_CONFIGURATION,
    });
    await s3Client.send(putCorsCmd);

    console.log("✅ Configuration CORS appliquée avec succès !");
    console.log("\n📋 Résumé des règles CORS :");
    console.log(`   Origines autorisées : ${ALLOWED_ORIGINS.join(", ")}`);
    console.log(`   Méthodes autorisées : GET, PUT, HEAD, POST, DELETE`);
    console.log(`   MaxAge (preflight)  : 3600 secondes`);
    console.log("\n💡 Conseil : Si vous déployez sur un nouveau domaine, relancez ce script");
    console.log("   ou mettez à jour les origines dans le dashboard Cloudflare R2.");

  } catch (error) {
    console.error("\n❌ ERREUR lors de la configuration CORS :");
    console.error(`   ${error.name}: ${error.message}`);

    if (error.name === "AccessDenied" || error.$metadata?.httpStatusCode === 403) {
      console.error("\n🔑 Problème de permissions :");
      console.error("   Votre token R2 doit avoir les permissions suivantes :");
      console.error("   - GetBucketCors");
      console.error("   - PutBucketCors");
      console.error("\n   Dans le dashboard Cloudflare > R2 > Manage API Tokens :");
      console.error("   Créez un token avec le droit 'Admin Read & Write' sur ce bucket.");
    }

    if (error.name === "NetworkingError" || error.message.includes("fetch")) {
      console.error("\n🌐 Problème réseau :");
      console.error(`   Vérifiez que S3_ENDPOINT est correct : ${process.env.S3_ENDPOINT}`);
      console.error("   Format attendu : https://<accountid>.r2.cloudflarestorage.com");
    }

    process.exit(1);
  }
}

main();
