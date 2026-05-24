#!/bin/bash

set -e

GARAGE_ENDPOINT="${GARAGE_ENDPOINT:-http://localhost:9000}"
GARAGE_BUCKET="${GARAGE_BUCKET:-smatway}"
GARAGE_ACCESS_KEY="${GARAGE_ACCESS_KEY:-minioadmin}"
GARAGE_SECRET_KEY="${GARAGE_SECRET_KEY:-minioadmin}"

echo "🔧 Setting up Garage (MinIO) for Smatway..."
echo "📦 Endpoint: $GARAGE_ENDPOINT"
echo "🪣 Bucket: $GARAGE_BUCKET"

# Wait for Garage to be healthy
echo "⏳ Waiting for Garage to be ready..."
for i in {1..30}; do
  if curl -f -s "$GARAGE_ENDPOINT/minio/health/live" > /dev/null 2>&1; then
    echo "✅ Garage is ready!"
    break
  fi
  echo "  Attempt $i/30..."
  sleep 1
done

# Create bucket using MinIO client style
echo "🔨 Creating bucket: $GARAGE_BUCKET"

# Use S3 API with proper date header
DATE=$(date -R)
SIGNATURE=$(echo -en "PUT\n\n\n${DATE}\n/$GARAGE_BUCKET/" | openssl sha1 -hmac "$GARAGE_SECRET_KEY" -binary | base64)

curl -X PUT "$GARAGE_ENDPOINT/$GARAGE_BUCKET" \
  -H "Date: $DATE" \
  -H "Authorization: AWS $GARAGE_ACCESS_KEY:$SIGNATURE" 2>/dev/null || {
  echo "⚠️  Could not create bucket via API. Try accessing MinIO Console instead."
}

echo ""
echo "✅ Garage setup complete!"
echo ""
echo "📋 Access Information:"
echo "   S3 Endpoint: $GARAGE_ENDPOINT"
echo "   Bucket: $GARAGE_BUCKET"
echo "   Access Key: $GARAGE_ACCESS_KEY"
echo "   Secret Key: $GARAGE_SECRET_KEY"
echo ""
echo "🎨 MinIO Web Console:"
echo "   URL: http://localhost:9001"
echo "   Username: minioadmin"
echo "   Password: minioadmin"
echo ""
echo "💡 To create the bucket manually:"
echo "   1. Open http://localhost:9001 in your browser"
echo "   2. Login with minioadmin:minioadmin"
echo "   3. Click 'Create Bucket' and enter 'smatway'"
echo ""
