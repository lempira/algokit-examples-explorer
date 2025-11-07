#!/bin/bash
# Deploy backend to Google Cloud Run

set -e  # Exit on error

# Color output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  AlgoKit Examples - Backend Deployment${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="algokit-backend"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}✗ gcloud CLI not found. Please install it first:${NC}"
    echo "  https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if project ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}✗ GCP_PROJECT_ID not set${NC}"
    echo "  Usage: GCP_PROJECT_ID=your-project-id ./deploy-backend.sh"
    echo "  Or set it: export GCP_PROJECT_ID=your-project-id"
    exit 1
fi

echo -e "${GREEN}✓${NC} Project ID: $PROJECT_ID"
echo -e "${GREEN}✓${NC} Region: $REGION"
echo -e "${GREEN}✓${NC} Service: $SERVICE_NAME"
echo

# Set the project
echo -e "${BLUE}→${NC} Setting GCP project..."
gcloud config set project "$PROJECT_ID"

# Deploy to Cloud Run
echo -e "${BLUE}→${NC} Deploying backend to Cloud Run..."
echo "  This will take a few minutes (building Docker image + downloading ML model)..."
echo

cd backend

gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --min-instances 0 \
    --max-instances 10

cd ..

# Get the service URL
echo
echo -e "${BLUE}→${NC} Getting service URL..."
BACKEND_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)')

echo
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Backend deployed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
echo -e "  Backend URL: ${BLUE}$BACKEND_URL${NC}"
echo
echo -e "Next steps:"
echo -e "  1. Test the backend: ${BLUE}curl $BACKEND_URL/api/health${NC}"
echo -e "  2. Deploy frontend with backend URL:"
echo -e "     ${BLUE}GCP_PROJECT_ID=$PROJECT_ID VITE_API_URL=$BACKEND_URL ./deploy-frontend.sh${NC}"
echo