#!/bin/bash

# Template Project Setup Script
# This script automates the initial setup process

set -e

echo "🚀 Template Project Setup"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v bun &> /dev/null; then
    echo -e "${RED}❌ Bun is not installed${NC}"
    echo -e "${YELLOW}   Install with: curl -fsSL https://bun.sh/install | bash${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Bun found: $(bun --version)${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker found: $(docker --version)${NC}"

if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose found${NC}"

echo ""

# Install dependencies
echo "📦 Installing dependencies..."
bun install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Setup environment
if [ ! -f .env ]; then
    echo "⚙️  Setting up environment..."
    cp .env.example .env

    # Generate auth secret
    if command -v openssl &> /dev/null; then
        SECRET=$(openssl rand -base64 32)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$SECRET|" .env
        else
            sed -i "s|BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$SECRET|" .env
        fi
        echo -e "${GREEN}✅ Generated BETTER_AUTH_SECRET${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not generate BETTER_AUTH_SECRET (openssl not found)${NC}"
        echo -e "${YELLOW}   Please manually set it in .env${NC}"
    fi
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${YELLOW}⚠️  .env already exists, skipping${NC}"
fi
echo ""

# Start Docker services
echo "🐳 Starting Docker services..."
docker compose up -d
echo -e "${GREEN}✅ Docker services started${NC}"
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service health
echo "🏥 Checking service health..."
if docker compose ps postgres | grep -q "Up"; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not running${NC}"
fi

if docker compose ps redis | grep -q "Up"; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Redis is not running${NC}"
fi

if docker compose ps minio | grep -q "Up"; then
    echo -e "${GREEN}✅ MinIO is running${NC}"
else
    echo -e "${RED}❌ MinIO is not running${NC}"
fi
echo ""

# Setup database
echo "💾 Setting up database..."
bun run db:push
echo -e "${GREEN}✅ Database schema applied${NC}"
echo ""

# Setup complete
echo ""
echo "🎉 Setup Complete!"
echo "==================="
echo ""
echo "Next steps:"
echo "  1. Start development server: ${GREEN}bun run dev${NC}"
echo "  2. Visit http://localhost:3000"
echo "  3. Visit dashboard: http://localhost:3000/dashboard"
echo ""
echo "Service URLs:"
echo "  • App:          http://localhost:3000"
echo "  • MinIO:        http://localhost:9001 (minioadmin / minioadmin)"
echo "  • Dozzle Logs:  http://localhost:8080"
echo ""
echo "Useful commands:"
echo "  • bun run dev        - Start development server"
echo "  • bun run db:studio  - Open database studio"
echo "  • docker compose logs -f - View logs"
echo ""
