import { Client } from "minio";

function assertMinioEnv(): {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
} {
  const endPoint = process.env.MINIO_ENDPOINT;
  if (!endPoint) throw new Error("MINIO_ENDPOINT environment variable is not set");

  const accessKey = process.env.MINIO_ROOT_USER;
  const secretKey = process.env.MINIO_ROOT_PASSWORD;
  if (!accessKey || !secretKey) throw new Error("MinIO credentials are not set");

  return {
    endPoint,
    port: parseInt(process.env.MINIO_PORT || "9000"),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey,
    secretKey,
  };
}

let cachedClient: Client | null = null;

export function getMinioClient(): Client {
  if (cachedClient) return cachedClient;
  const cfg = assertMinioEnv();
  cachedClient = new Client(cfg);
  return cachedClient;
}

// Initialize bucket on startup
export async function initializeBucket(bucketName: string = "uploads") {
  try {
    const minioClient = getMinioClient();
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, "us-east-1");
      console.log(`✅ Created MinIO bucket: ${bucketName}`);

      // Set public read policy for uploads bucket (adjust as needed)
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      console.log(`✅ Set public read policy for bucket: ${bucketName}`);
    } else {
      console.log(`✅ MinIO bucket already exists: ${bucketName}`);
    }
  } catch (error) {
    console.error("❌ Error initializing MinIO bucket:", error);
    throw error;
  }
}

// Helper function to upload file
export async function uploadFile(
  bucketName: string,
  fileName: string,
  fileBuffer: Buffer,
  contentType: string
) {
  try {
    const minioClient = getMinioClient();
    await minioClient.putObject(bucketName, fileName, fileBuffer, fileBuffer.length, {
      "Content-Type": contentType,
    });

    return {
      bucket: bucketName,
      fileName,
      url: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}/${fileName}`,
    };
  } catch (error) {
    console.error("Error uploading file to MinIO:", error);
    throw error;
  }
}

// Helper function to get presigned URL for private files
export async function getPresignedUrl(
  bucketName: string,
  fileName: string,
  expirySeconds: number = 3600
) {
  try {
    const minioClient = getMinioClient();
    const url = await minioClient.presignedGetObject(bucketName, fileName, expirySeconds);
    return url;
  } catch (error) {
    console.error("Error getting presigned URL:", error);
    throw error;
  }
}

export async function getPresignedUploadUrl(
  bucketName: string,
  fileName: string,
  expirySeconds: number = 3600
) {
  try {
    const minioClient = getMinioClient();
    const url = await minioClient.presignedPutObject(bucketName, fileName, expirySeconds);
    return url;
  } catch (error) {
    console.error("Error getting presigned upload URL:", error);
    throw error;
  }
}

// Helper function to delete file
export async function deleteFile(bucketName: string, fileName: string) {
  try {
    const minioClient = getMinioClient();
    await minioClient.removeObject(bucketName, fileName);
    return { success: true, fileName };
  } catch (error) {
    console.error("Error deleting file from MinIO:", error);
    throw error;
  }
}

export async function downloadFile(bucketName: string, fileName: string): Promise<Buffer> {
  const minioClient = getMinioClient();
  const stream = await minioClient.getObject(bucketName, fileName);
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => resolve());
    stream.on("error", (err) => reject(err));
  });
  return Buffer.concat(chunks);
}
