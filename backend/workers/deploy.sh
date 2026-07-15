#!/bin/bash

# Cloudflare Workers Deployment Script
# =====================================

set -e

echo "🚀 Deploying Spllit Workers to Cloudflare..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ wrangler CLI not found. Install with: npm install -g wrangler"
    exit 1
fi

# Check if user is authenticated
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not authenticated with Cloudflare. Run: wrangler login"
    exit 1
fi

# Get environment from argument or default to production
ENVIRONMENT=${1:-production}
echo "📦 Environment: $ENVIRONMENT"

# Install dependencies
echo "📚 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Set secrets if they're provided via environment variables
if [ ! -z "$JWT_SECRET" ]; then
    echo "🔐 Setting JWT_SECRET..."
    echo "$JWT_SECRET" | wrangler secret put JWT_SECRET --env $ENVIRONMENT
fi

if [ ! -z "$JWT_REFRESH_SECRET" ]; then
    echo "🔐 Setting JWT_REFRESH_SECRET..."
    echo "$JWT_REFRESH_SECRET" | wrangler secret put JWT_REFRESH_SECRET --env $ENVIRONMENT
fi

if [ ! -z "$RENDER_BACKEND_URL" ]; then
    echo "🔗 Setting RENDER_BACKEND_URL..."
    echo "$RENDER_BACKEND_URL" | wrangler secret put RENDER_BACKEND_URL --env $ENVIRONMENT
fi

# Deploy
if [ "$ENVIRONMENT" = "staging" ]; then
    echo "🌐 Deploying to staging..."
    npm run deploy:staging
else
    echo "🌐 Deploying to production..."
    npm run deploy
fi

echo "✅ Deployment complete!"
echo ""
echo "📊 View logs:"
echo "   npm run tail"
echo ""
echo "🧪 Test health endpoint:"
if [ "$ENVIRONMENT" = "staging" ]; then
    echo "   https://api-staging.spllit.app/health"
else
    echo "   https://api.spllit.app/health"
fi
