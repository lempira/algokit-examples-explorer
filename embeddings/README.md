# AlgoKit Examples Embeddings

Generate vector embeddings for AlgoKit examples using the `all-MiniLM-L6-v2` model for semantic search.

## Overview

This tool processes AlgoKit example metadata and generates 384-dimensional vector embeddings that enable semantic search capabilities in the AlgoKit Examples Explorer. The embeddings capture the meaning and context of each example, allowing users to find relevant examples using natural language queries.

## Prerequisites

- Python 3.12 or higher
- [uv](https://github.com/astral-sh/uv) - Fast Python package installer and resolver

## Installation

Install dependencies using `uv`:

```bash
uv sync
```

This will install:
- `sentence-transformers` - For generating embeddings using the all-MiniLM-L6-v2 model
- `polars` - For data processing

## Usage

### Generate Embeddings

Run the embedding generation script:

```bash
uv run python src/generate_embeddings.py
```

### Input/Output

- **Input**: `data/03-distillation.json` - AlgoKit example metadata
- **Output**: `output/embeddings.json` - Examples with 384-dimensional vector embeddings

### What Gets Embedded

The script creates rich text representations for each example by combining:
- Title and summary (primary content)
- Feature tags and demonstrated features (categorization)
- Complexity level and target users (filtering context)
- Programming language (technical context)

All embeddings are L2-normalized for efficient cosine similarity search.

## Example Output

The generated `embeddings.json` contains an array of examples with the following structure:

```json
[
  {
    "example_id": "...",
    "repository": "...",
    "title": "Example Title",
    "summary": "Example description",
    "complexity": "beginner|intermediate|advanced",
    "language": "Python|TypeScript",
    "feature_tags": ["tag1", "tag2"],
    "features_to_demonstrate": ["feature1", "feature2"],
    "target_users": ["user1", "user2"],
    "folder_name": "example-folder",
    "vector": [0.123, -0.456, ...]
  }
]
```

## Model Information

- **Model**: `all-MiniLM-L6-v2`
- **Embedding Dimension**: 384
- **Normalization**: L2 (for cosine similarity)
- **Use Case**: Semantic search and similarity matching

## Development

To modify the embedding generation logic:

1. Edit `src/generate_embeddings.py`
2. The `create_embedding_text()` function controls what fields are embedded
3. The `prepare_output()` function controls what fields are exported

## Notes

- The first run will download the all-MiniLM-L6-v2 model (~80MB)
- Embeddings are cached in the model's default location
- Generation time depends on the number of examples (~1-2 seconds per 100 examples)

