#!/bin/bash
# Deploy frontend to Google Cloud Run

set -e  # Exit on error

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  AlgoKit Examples - Frontend Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="algokit-frontend"
BACKEND_URL="${VITE_API_URL:-}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}✗ gcloud CLI not found. Please install it first:${NC}"
    echo "  https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if project ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}✗ GCP_PROJECT_ID not set${NC}"
    echo "  Usage: GCP_PROJECT_ID=your-project-id VITE_API_URL=<backend-url> ./deploy-frontend.sh"
    echo "  Or set it: export GCP_PROJECT_ID=your-project-id"
    exit 1
fi

# Check if backend URL is set (REQUIRED)
if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}✗ VITE_API_URL not set${NC}"
    echo "  The backend URL is required for the frontend to work."
    echo "  Usage: VITE_API_URL=<backend-url> ./deploy-frontend.sh"
    echo
    echo "  Example:"
    echo "    VITE_API_URL=https://algokit-backend-xxx.run.app ./deploy-frontend.sh"
    echo
    echo "  Deploy the backend first to get its URL:"
    echo "    ./deploy-backend.sh"
    exit 1
fi

echo -e "${GREEN}✓${NC} Project ID: $PROJECT_ID"
echo -e "${GREEN}✓${NC} Region: $REGION"
echo -e "${GREEN}✓${NC} Service: $SERVICE_NAME"
echo -e "${GREEN}✓${NC} Backend URL: $BACKEND_URL"
echo

# Set the project
echo -e "${BLUE}→${NC} Setting GCP project..."
gcloud config set project "$PROJECT_ID"

# Deploy to Cloud Run
echo -e "${BLUE}→${NC} Deploying frontend to Cloud Run..."
echo "  This will take a few minutes (building Docker image)..."
echo "  The backend URL will be baked into the JavaScript bundle."
echo

cd app

gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --timeout 60 \
    --min-instances 0 \
    --max-instances 5 \
    --set-build-env-vars "VITE_API_URL=$BACKEND_URL"

cd ..

# Get the service URL
echo
echo -e "${BLUE}→${NC} Getting service URL..."
FRONTEND_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)')

echo
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Frontend deployed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
echo -e "  Frontend URL: ${BLUE}$FRONTEND_URL${NC}"
echo -e "  Backend URL:  ${BLUE}$BACKEND_URL${NC}"
echo
echo -e "Next steps:"
echo -e "  1. Open the app: ${BLUE}$FRONTEND_URL${NC}"
echo -e "  2. Test search functionality"
echo