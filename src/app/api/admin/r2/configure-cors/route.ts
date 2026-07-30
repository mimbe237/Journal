import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import { getCurrentUserFromRequest } from "@/lib/auth/currentUser";

/**
 * Endpoint temporaire pour configurer les règles CORS sur le bucket R2.
 * À appeler une fois, puis à supprimer.
 * 
 * GET  /api/admin/r2/configure-cors → Voir la config actuelle
 * POST /api/admin/r2/configure-cors → Appliquer la config CORS
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user || !["SUPER_ADMIN", "SUPPORT"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const s3Client = createS3Client();
    const bucketName = process.env.S3_BUCKET_NAME || "journal-storage";

    const getCorsCmd = new GetBucketCorsCommand({ Bucket: bucketName });

    try {
      const cors = await s3Client.send(getCorsCmd);
      return NextResponse.json({
        status: "existing",
        bucket: bucketName,
        endpoint: process.env.S3_ENDPOINT || "(AWS S3)",
        corsRules: cors.CORSRules,
      });
    } catch (err: any) {
      if (err.name === "NoSuchCORSConfiguration") {
        return NextResponse.json({
          status: "none",
          bucket: bucketName,
          message: "Aucune configuration CORS existante.",
        });
      }
      throw err;
    }
  } catch (error: any) {
    console.error("[R2 CORS GET]", error);
    return NextResponse.json(
      { error: error.message, code: error.name },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(req);
    if (!user || !["SUPER_ADMIN", "SUPPORT"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const s3Client = createS3Client();
    const bucketName = process.env.S3_BUCKET_NAME || "journal-storage";

    // Récupérer les origines depuis le body ou utiliser des valeurs par défaut
    let allowedOrigins: string[] = [];
    try {
      const body = await req.json();
      if (body.allowedOrigins) {
        allowedOrigins = body.allowedOrigins;
      }
    } catch {
      // Pas de body, on utilise les valeurs par défaut
    }

    // Déterminer les origines autorisées
    if (allowedOrigins.length === 0) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (appUrl) allowedOrigins.push(appUrl);
      // Toujours autoriser localhost pour le développement
      allowedOrigins.push("http://localhost:3000");
      allowedOrigins.push("http://localhost:3001");
    }

    const corsConfiguration = {
      CORSRules: [
        {
          AllowedOrigins: allowedOrigins,
          AllowedMethods: ["GET", "PUT", "HEAD", "POST", "DELETE"],
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
          ExposeHeaders: [
            "ETag",
            "x-amz-request-id",
            "x-amz-version-id",
          ],
          MaxAgeSeconds: 3600,
        },
      ],
    };

    const putCorsCmd = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration,
    });

    await s3Client.send(putCorsCmd);

    return NextResponse.json({
      success: true,
      bucket: bucketName,
      allowedOrigins,
      message: "Configuration CORS appliquée avec succès.",
    });
  } catch (error: any) {
    console.error("[R2 CORS POST]", error);

    let hint = "";
    if (error.name === "AccessDenied" || error.$metadata?.httpStatusCode === 403) {
      hint = "Le token R2 doit avoir les permissions GetBucketCors et PutBucketCors.";
    } else if (error.name === "NetworkingError") {
      hint = `Vérifiez S3_ENDPOINT: ${process.env.S3_ENDPOINT}`;
    }

    return NextResponse.json(
      { error: error.message, code: error.name, hint },
      { status: 500 }
    );
  }
}

function createS3Client(): S3Client {
  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: !!process.env.S3_ENDPOINT,
  });
}
