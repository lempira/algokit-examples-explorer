# Deployment Guide - Google Cloud Run

This guide walks you through deploying the AlgoKit Examples Explorer to Google Cloud Run.

## Overview

The application consists of two services:
- **Backend**: Fastify API with LanceDB vector search
- **Frontend**: SolidStart web application

Both services are deployed as separate Cloud Run services and communicate via HTTPS.

---

## Prerequisites

### 1. Google Cloud Account
- Create a Google Cloud account: https://cloud.google.com/
- Create a new project or use an existing one

### 2. Install Google Cloud CLI
```bash
# macOS
brew install --cask google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash

# Windows
# Download installer from https://cloud.google.com/sdk/docs/install
```

### 3. Authenticate with Google Cloud
```bash
gcloud auth login
gcloud auth application-default login
```

### 4. Enable Required APIs
```bash
# Set your project ID
export GCP_PROJECT_ID=your-project-id

# Enable Cloud Run and Container Registry APIs
gcloud services enable run.googleapis.com --project=$GCP_PROJECT_ID
gcloud services enable cloudbuild.googleapis.com --project=$GCP_PROJECT_ID
gcloud services enable containerregistry.googleapis.com --project=$GCP_PROJECT_ID
```

---

## Deployment Steps

### Step 1: Deploy Backend

The backend must be deployed first to get its URL.

```bash
# Set your project ID
export GCP_PROJECT_ID=your-project-id

# Deploy backend
./deploy-backend.sh
```

**What this does:**
- Builds a Docker image with TypeScript compiled and ML model pre-downloaded
- Deploys to Cloud Run in `us-central1` region
- Configures: 1GB memory, 1 CPU, auto-scaling 0-10 instances
- Returns the backend URL (e.g., `https://algokit-backend-xxx.run.app`)

**Expected time:** 5-10 minutes (first deployment is slower due to ML model download)

**Save the backend URL** - you'll need it for the frontend deployment.

### Step 2: Test Backend

```bash
# Replace with your actual backend URL
BACKEND_URL=https://algokit-backend-xxx.run.app

# Test health endpoint
curl $BACKEND_URL/api/health

# Test search endpoint
curl -X POST $BACKEND_URL/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "account creation", "limit": 5}'
```

### Step 3: Deploy Frontend

```bash
# Set backend URL from Step 1
export VITE_API_URL=https://algokit-backend-xxx.run.app

# Or retrieve it if you deployed the backend earlier
export VITE_API_URL=$(gcloud run services describe algokit-backend \
  --region us-central1 \
  --format='value(status.url)')

# Deploy frontend
./deploy-frontend.sh
```

**What this does:**
- Builds a Docker image with SolidStart app (backend URL baked into bundle)
- Deploys to Cloud Run in `us-central1` region
- Configures: 512MB memory, 1 CPU, auto-scaling 0-5 instances
- Returns the frontend URL (e.g., `https://algokit-frontend-xxx.run.app`)

**Expected time:** 3-5 minutes

### Step 4: Open Your App

Open the frontend URL in your browser and test the search functionality!

---

## Configuration Options

### Change Region

```bash
export GCP_REGION=us-west1
./deploy-backend.sh
```

Available regions: https://cloud.google.com/run/docs/locations

### Custom Resource Limits

Edit the `cloudbuild.yaml` files to adjust Cloud Run resource settings:
- `--memory` - RAM allocation (e.g., `2Gi`, `512Mi`)
- `--cpu` - CPU allocation (e.g., `1`, `2`)
- `--min-instances` - Minimum instances (0 = scale to zero)
- `--max-instances` - Maximum instances for auto-scaling
- `--timeout` - Request timeout in seconds

**Backend**: Edit `backend/cloudbuild.yaml` (Step 3, lines 24-44)
**Frontend**: Edit `app/cloudbuild.yaml` (Step 3, lines 24-46)

---

## Updating the Application

### Update Backend Code

```bash
# Make your changes to backend code
# Then redeploy
./deploy-backend.sh
```

Cloud Run will automatically:
1. Build a new Docker image
2. Deploy the new version
3. Gradually shift traffic to the new version
4. Keep the old version as a rollback point

### Update Frontend Code

```bash
# Make your changes to frontend code
# Then redeploy with the backend URL
export VITE_API_URL=https://algokit-backend-xxx.run.app
./deploy-frontend.sh
```

### Update Embeddings Data

If you update `backend/data/embeddings.json`:

```bash
# Rebuild and redeploy backend
./deploy-backend.sh
```

The new embeddings will be baked into the Docker image.