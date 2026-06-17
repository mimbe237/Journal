import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { IFileStorageProvider } from "./IFileStorageProvider";
import { Readable } from "stream";

export class S3FileStorageProvider implements IFileStorageProvider {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    const region = process.env.S3_REGION || "eu-west-3";
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    const endpoint = process.env.S3_ENDPOINT; // Optionnel, pour Cloudflare R2 ou MinIO

    if (!accessKeyId || !secretAccessKey) {
      throw new Error("S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be defined");
    }

    this.bucketName = process.env.S3_BUCKET_NAME || "journal-storage";

    this.client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: !!endpoint, // Souvent nécessaire pour les providers compatibles S3 autres qu'AWS
    });
  }

  async saveFile(params: { buffer: Buffer; destinationPath: string }): Promise<void> {
    // On retire le slash initial s'il existe pour éviter les dossiers vides à la racine du bucket
    const key = params.destinationPath.startsWith("/") ? params.destinationPath.slice(1) : params.destinationPath;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: params.buffer,
    });

    await this.client.send(command);
  }

  async fileExists(params: { path: string }): Promise<boolean> {
    const key = params.path.startsWith("/") ? params.path.slice(1) : params.path;

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async getFileStream(params: { path: string }): Promise<NodeJS.ReadableStream> {
    const key = params.path.startsWith("/") ? params.path.slice(1) : params.path;

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`File not found or empty body: ${key}`);
    }

    // Dans Node.js, response.Body est un IncomingMessage (Readable Stream)
    return response.Body as NodeJS.ReadableStream;
  }

  async deleteFile(params: { path: string }): Promise<void> {
    const key = params.path.startsWith("/") ? params.path.slice(1) : params.path;

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }
}
