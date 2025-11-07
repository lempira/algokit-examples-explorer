# AlgoKit Examples Explorer

Semantic search application for discovering AlgoKit examples using vector similarity and natural language queries.

## Architecture

This project uses a **backend API + frontend client** architecture:

```
┌─────────────────────┐         ┌──────────────────────┐
│   Frontend (SolidJS)│         │   Backend (Fastify)  │
│   Port 3000         │ ──────> │   Port 3001          │
│                     │  HTTP   │                      │
│   - Search UI       │         │   - LanceDB          │
│   - Results Display │         │   - Transformers.js  │
└─────────────────────┘         │   - Vector Search    │
                                └──────────────────────┘
```

### Why This Architecture?

Initially attempted browser-based vector search but discovered:

- ❌ LanceDB doesn't support browser/WASM (requires native Rust bindings)
- ❌ Loading 25MB embedding model per user was slow
- ❌ Browser constraints limited functionality

**Solution**: Backend API handles all vector operations

- ✅ LanceDB works perfectly in Node.js
- ✅ Shared embedding model across all users
- ✅ ~93% smaller frontend bundle
- ✅ ~50-100x faster first search

## Quick Start

### Prerequisites

- Node.js ≥22
- npm or pnpm

### 1. Start Backend

```bash
cd backend
npm install
npm run dev
```

Server starts on `http://localhost:3001`

**Note**: First run downloads embedding model (~25MB, takes 10-20s). Subsequent runs are instant.

### 2. Start Frontend

```bash
cd app
npm install
npm run dev
```

Frontend starts on `http://localhost:3000`

### 3. Search Examples

Open `http://localhost:3000` and try searching:

- "create algorand account"
- "smart contract testing"
- "algorand transactions"
- "dApp development"

## Project Structure

```
algokit-examples-explorer/
├── backend/              # Fastify API server
│   ├── src/
│   │   ├── services/     # Database, embedder, search
│   │   ├── routes/       # API endpoints
│   │   └── schemas/      # Validation schemas
│   ├── data/
│   │   └── embeddings.json  # 37 examples with vectors
│   └── README.md
├── app/                  # SolidJS frontend
│   ├── src/
│   │   ├── lib/          # API client, types
│   │   └── app.tsx       # Main UI component
│   └── package.json
├── embeddings/           # Python embedding pipeline
│   ├── src/
│   │   └── generate_embeddings.py
│   └── data/
│       └── test-examples/  # Raw example data
└── README.md
```

## Technology Stack

### Backend

- **Framework**: Fastify (high-performance Node.js framework)
- **Database**: LanceDB (vector database with native Rust bindings)
- **Embeddings**: Transformers.js with `all-MiniLM-L6-v2` model
- **Validation**: TypeBox (JSON schema + TypeScript types)

### Frontend

- **Framework**: SolidJS (reactive UI library)
- **Build Tool**: Solid Start + Vinxi
- **HTTP Client**: Native fetch API

### Embeddings Pipeline

- **Language**: Python
- **Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Vector Dimensions**: 384
- **Data Processing**: Polars

## How It Works

### 1. Pre-computed Embeddings

Python pipeline generates embeddings for all AlgoKit examples:

```bash
cd embeddings
uv run src/generate_embeddings.py
```

Outputs `embeddings.json` with:

- 37 AlgoKit examples
- 384-dimensional normalized vectors
- Rich text representations (title, summary, tags, etc.)

### 2. Backend Initialization

On startup, backend:

1. Loads embeddings into LanceDB
2. Downloads and caches embedding model
3. Starts API server

### 3. Search Flow

```
User Query: "create account"
    ↓
Frontend: POST /api/search
    ↓
Backend: Embed query → 384-dim vector
    ↓
LanceDB: Vector similarity search
    ↓
Backend: Format results with similarity scores
    ↓
Frontend: Display results with match percentage
```

## API Endpoints

### POST /api/search

Search for examples using semantic similarity.

**Request:**

```json
{
  "query": "create algorand account",
  "limit": 10
}
```

**Response:**

```json
{
  "results": [...],
  "query": "create algorand account",
  "count": 10,
  "processingTimeMs": 234
}
```

### GET /api/examples/:id

Get a specific example by ID.

### GET /api/health

Health check with service status.

See [backend/README.md](backend/README.md) for full API documentation.

## Development

### Adding New Examples

1. Add example data to `embeddings/data/test-examples/`
2. Regenerate embeddings:
   ```bash
   cd embeddings
   uv run src/generate_embeddings.py
   ```
3. Copy to backend:
   ```bash
   cp embeddings/output/embeddings.json backend/data/
   ```
4. Restart backend

### Updating the Model

To use a different embedding model:

1. Update Python pipeline (`embeddings/src/generate_embeddings.py`)
2. Update backend embedder (`backend/src/services/embedder.ts`)
3. Ensure both use the same model for vector compatibility

## Performance

| Metric              | Before (Browser) | After (Backend API) |
| ------------------- | ---------------- | ------------------- |
| Bundle Size         | ~30MB            | ~100KB              |
| First Search        | 15-30s           | 200-500ms           |
| Subsequent Searches | 100-200ms        | 200-500ms           |
| Model Loading       | Per user         | Shared              |

## Deployment

### Backend

Deploy to any Node.js hosting platform:

- Railway
- Render
- Fly.io
- Google Cloud Run
- AWS ECS

See [backend/README.md](backend/README.md) for deployment details.

### Frontend

Deploy to static hosting:

- Vercel
- Netlify
- Cloudflare Pages

Update API URL in `app/src/lib/search.ts` for production.

## Data

Currently includes **37 AlgoKit examples** from:

- `algokit-utils-ts` repository
- `algokit-utils-py` repository

Examples span various:

- **Complexities**: Simple, Intermediate, Complex
- **Languages**: TypeScript, Python
- **Features**: Account management, transactions, smart contracts, testing, etc.

## Architecture Decision

See `implementation-change.md` for detailed analysis of the architectural pivot from browser-based to backend API approach.

## License

MIT

## Contributing

Contributions welcome! Areas for improvement:

- Add more AlgoKit examples
- Improve search relevance
- Add filters (language, complexity, repository)
- Add example preview/details view
- Implement search result caching
