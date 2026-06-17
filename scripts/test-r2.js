const { S3Client, ListObjectsV2Command, PutObjectCommand } = require("@aws-sdk/client-s3");
require('dotenv').config({ path: '.env.production' });

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

async function testR2() {
  console.log("Testing R2 Connection...");
  console.log("Endpoint:", process.env.S3_ENDPOINT);
  console.log("Bucket:", process.env.S3_BUCKET_NAME);

  try {
    // 1. Try to list objects
    console.log("\n1. Listing objects...");
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      MaxKeys: 1
    });
    const response = await s3Client.send(command);
    console.log("✅ Success! Connection established.");
    console.log("Files found:", response.KeyCount);

    // 2. Try to upload a tiny test file
    console.log("\n2. Uploading test file...");
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: "test-connection.txt",
      Body: "Hello from Journal App Test",
      ContentType: "text/plain"
    });
    await s3Client.send(uploadCommand);
    console.log("✅ Success! File uploaded.");

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.name === 'NetworkingError') {
        console.error("Hint: Check your internet connection or S3_ENDPOINT.");
    } else if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
        console.error("Hint: Check S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY.");
    } else if (error.name === 'NoSuchBucket') {
        console.error(`Hint: Bucket '${process.env.S3_BUCKET_NAME}' does not exist.`);
    }
  }
}

testR2();
