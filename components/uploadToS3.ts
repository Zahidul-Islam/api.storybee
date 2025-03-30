import { S3Client, S3File } from "bun";
import { stat } from "fs/promises";
import mime from "mime-types";
import path from "path";

const client = new S3Client({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  bucket: process.env.AWS_S3_BUCKET_NAME!,
  region: process.env.AWS_REGION!,
});

interface UploadOptions {
  filePath: string; // local file path (e.g., ./assets/xyz/output.mp4)
  name: string; // file name (e.g., output.mp4)
  userId: string;
  folder?: string; // optional override path
}

const uploadToS3 = async ({
  filePath,
  name,
  userId,
  folder,
}: UploadOptions) => {
  try {
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const fileStats = await stat(filePath);
    const fileSize = fileStats.size;

    const mimeType = mime.lookup(name) || "application/octet-stream";

    const rendomeString = Math.random().toString(36).substring(2, 15);

    const s3Path =
      folder ||
      `${process.env.NODE_ENV}/linkedin/${userId}/videos/${rendomeString}/${name}`;

    const s3file: S3File = client.file(s3Path);
    await Bun.write(s3file, file);

    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Path}`;

    console.log("✅ Uploaded to S3:", fileUrl);
    console.log("📦 File Size:", fileSize, "bytes");
    console.log("📁 Content Type:", mimeType);

    return { url: fileUrl, fileSize };
  } catch (error) {
    console.error("🚨 Error uploading to S3:", error);
    throw error;
  }
};

export default uploadToS3;
