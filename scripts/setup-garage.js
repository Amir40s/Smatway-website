#!/usr/bin/env node

const { S3Client, CreateBucketCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: process.env.GARAGE_ENDPOINT || 'http://localhost:9000',
  credentials: {
    accessKeyId: process.env.GARAGE_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.GARAGE_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
});

const bucketName = process.env.GARAGE_BUCKET || 'smatway';

async function createBucket() {
  try {
    console.log(`Creating bucket: ${bucketName}`);
    const command = new CreateBucketCommand({ Bucket: bucketName });
    await s3Client.send(command);
    console.log(`✅ Bucket '${bucketName}' created successfully!`);
    console.log(`\n📦 Garage is ready at: http://localhost:9000`);
    console.log(`🔐 MinIO Console: http://localhost:9001`);
    console.log(`\nDefault credentials:`);
    console.log(`  Access Key: minioadmin`);
    console.log(`  Secret Key: minioadmin`);
  } catch (error) {
    if (error.name === 'BucketAlreadyOwnedByYou' || error.Code === 'BucketAlreadyOwnedByYou') {
      console.log(`✅ Bucket '${bucketName}' already exists!`);
    } else if (error.message && error.message.includes('bucket already')) {
      console.log(`✅ Bucket '${bucketName}' already exists!`);
    } else {
      console.error('❌ Error creating bucket:', error.message);
      process.exit(1);
    }
  }
}

createBucket();
