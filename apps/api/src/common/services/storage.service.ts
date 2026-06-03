import { Injectable } from '@nestjs/common';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName = process.env.GARAGE_BUCKET || 'smatway';

  constructor() {
    // Configure Cloudinary SDK
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Keep S3 client configured as a fallback/backwards-compatibility mechanism
    this.s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: process.env.GARAGE_ENDPOINT || 'http://localhost:9000',
      credentials: {
        accessKeyId: process.env.GARAGE_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.GARAGE_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(
    file: any,
    folder: string,
  ): Promise<{ filePath: string; presignedUrl: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          if (!result) {
            return reject(new Error('Cloudinary upload returned undefined result'));
          }
          // With Cloudinary, the secure_url is persistent and doesn't require dynamic presigning.
          // We return result.secure_url for both filePath and presignedUrl to match the application's expected structure.
          resolve({
            filePath: result.secure_url,
            presignedUrl: result.secure_url,
          });
        },
      );

      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);
      stream.pipe(uploadStream);
    });
  }

  // Call this everywhere an image URL needs to be served to a browser.
  // Handles null, raw S3 keys, new Cloudinary URLs, and old full-URL records safely.
  async resolveImageUrl(filePathOrUrl: string | null | undefined): Promise<string | null> {
    if (!filePathOrUrl) return null;

    const trimmed = filePathOrUrl.trim();

    // Handle JSON array of URLs (e.g., ["http://...", "http://..."])
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return this.resolveImageUrl(parsed[0]);
        }
      } catch (e) {
        // Ignore and fall through
      }
    }

    // Handle comma-separated paths/URLs
    if (trimmed.includes(',') && !trimmed.startsWith('http')) {
      const paths = trimmed.split(',').map(p => p.trim()).filter(Boolean);
      if (paths.length > 0) {
        return this.resolveImageUrl(paths[0]);
      }
    }

    // If it's already a full HTTP/HTTPS URL:
    if (trimmed.startsWith('http')) {
      // Check if it's a legacy S3/MinIO URL (typically pointing to localhost, minio, or the public garage endpoint).
      // If it is NOT a legacy URL (e.g. it is a Cloudinary URL), return it directly.
      const publicEndpoint = process.env.GARAGE_PUBLIC_URL;
      const publicHostname = publicEndpoint ? new URL(publicEndpoint).hostname : null;
      
      const isLegacyS3Url =
        trimmed.includes('localhost') ||
        trimmed.includes('minio') ||
        (publicHostname && trimmed.includes(publicHostname));

      if (!isLegacyS3Url) {
        return trimmed;
      }
    }

    try {
      return await this.generatePresignedUrl(trimmed);
    } catch {
      return null;
    }
  }

  async generatePresignedUrl(filePathOrUrl: string): Promise<string> {
    // Old records stored the full presigned URL — extract just the S3 key.
    let key = filePathOrUrl;
    if (filePathOrUrl.startsWith('http')) {
      const url = new URL(filePathOrUrl);
      // forcePathStyle URL format: /{bucket}/{key}
      key = url.pathname.replace(`/${this.bucketName}/`, '');
    }

    // Use GARAGE_PUBLIC_URL for the presigned URL endpoint so browsers can reach it.
    const publicEndpoint = process.env.GARAGE_PUBLIC_URL;
    const client = publicEndpoint
      ? new S3Client({
          region: 'us-east-1',
          endpoint: publicEndpoint,
          credentials: {
            accessKeyId: process.env.GARAGE_ACCESS_KEY || 'minioadmin',
            secretAccessKey: process.env.GARAGE_SECRET_KEY || 'minioadmin',
          },
          forcePathStyle: true,
        })
      : this.s3Client;

    return getSignedUrl(client, new GetObjectCommand({ Bucket: this.bucketName, Key: key }), {
      expiresIn: 7 * 24 * 60 * 60,
    });
  }
}

