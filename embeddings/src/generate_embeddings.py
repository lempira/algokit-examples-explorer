"""
Generate vector embeddings for AlgoKit examples using all-MiniLM-L6-v2.

This script reads AlgoKit example metadata from data/test-examples/03-distillation.json,
generates 384-dimensional embeddings for semantic search, and exports
the results to output/embeddings.json.
"""

import json
import logging
from pathlib import Path
from sentence_transformers import SentenceTransformer

# Set up logger
logger = logging.getLogger(__name__)


def load_examples(input_path: Path) -> list[dict]:
    """
    Load AlgoKit examples from JSON file.

    Returns a flattened list of examples with repository metadata.
    """
    with open(input_path, "r") as f:
        data = json.load(f)

    repository = data.get("repository", "unknown")
    examples = data.get("examples", [])

    # Add repository to each example for context
    for example in examples:
        example["repository"] = repository

    return examples


def create_embedding_text(example: dict) -> str:
    """
    Create rich text representation for embedding generation.

    Combines multiple fields for better semantic search:
    - Title and summary (primary content)
    - Feature tags and demonstrated features (categorization)
    - Complexity and target users (filtering context)
    - Language (technical context)
    """
    parts = []

    # Primary content
    if "title" in example:
        parts.append(f"Title: {example['title']}")

    if "summary" in example:
        parts.append(f"Description: {example['summary']}")

    # Features and tags
    if "feature_tags" in example and example["feature_tags"]:
        tags = ", ".join(example["feature_tags"])
        parts.append(f"Tags: {tags}")

    if "features_to_demonstrate" in example and example["features_to_demonstrate"]:
        features = ", ".join(example["features_to_demonstrate"])
        parts.append(f"Features: {features}")

    # Context metadata
    if "complexity" in example:
        parts.append(f"Complexity: {example['complexity']}")

    if "target_users" in example and example["target_users"]:
        users = ", ".join(example["target_users"])
        parts.append(f"Target Users: {users}")

    if "language" in example:
        parts.append(f"Language: {example['language']}")

    return ". ".join(parts)


def generate_embeddings(examples: list[dict], model: SentenceTransformer) -> list[dict]:
    """
    Generate embeddings for each example.

    Creates embeddings from combined text representation.
    Normalizes embeddings for cosine similarity search.

    Args:
        examples: List of example dictionaries
        model: SentenceTransformer model instance

    Returns:
        Examples with added 'vector' field containing 384-dim embeddings
    """
    logger.info(f"Generating embeddings for {len(examples)} examples...")

    for i, example in enumerate(examples, 1):
        # Create rich text representation
        text = create_embedding_text(example)

        logger.debug(f"Processing example {i}: {example.get('example_id', 'unknown')}")

        # Generate normalized embedding (384 dimensions)
        embedding = model.encode(
            text,
            normalize_embeddings=True,  # L2 normalization for cosine similarity
            show_progress_bar=False,
        )

        # Convert numpy array to list for JSON serialization
        example["vector"] = embedding.tolist()

        if i % 10 == 0:
            logger.info(f"  Processed {i}/{len(examples)} examples")

    logger.info(f"✓ Generated embeddings for all {len(examples)} examples")
    return examples


def prepare_output(examples: list[dict]) -> list[dict]:
    """
    Prepare examples for browser consumption.

    Keeps only fields needed for search results display.
    """
    output_examples = []

    for example in examples:
        output_example = {
            "example_id": example.get("example_id"),
            "repository": example.get("repository"),
            "title": example.get("title"),
            "summary": example.get("summary"),
            "complexity": example.get("complexity"),
            "language": example.get("language"),
            "feature_tags": example.get("feature_tags", []),
            "features_to_demonstrate": example.get("features_to_demonstrate", []),
            "target_users": example.get("target_users", []),
            "folder_name": example.get("folder"),
            "source_code": example.get("source_code"),  # Include source code for display
            "vector": example["vector"],  # Required field
        }
        output_examples.append(output_example)

    return output_examples


def save_embeddings(examples: list[dict], output_path: Path) -> None:
    """Save examples with embeddings to JSON file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    logger.info(f"Saving embeddings to {output_path}")

    with open(output_path, "w") as f:
        json.dump(examples, f, indent=2)

    # Log file size for reference
    file_size_mb = output_path.stat().st_size / (1024 * 1024)
    logger.info(f"✓ Saved embeddings successfully (file size: {file_size_mb:.2f} MB)")


def main():
    """Main execution function."""
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Define paths
    project_root = Path(__file__).parent.parent
    input_path = project_root / "data" / "03-distillation.json"
    output_path = project_root / "output" / "embeddings.json"

    logger.info("=" * 50)
    logger.info("AlgoKit Examples Embedding Generator")
    logger.info("=" * 50)
    logger.info(f"Input:  {input_path}")
    logger.info(f"Output: {output_path}")

    # Load the embedding model
    logger.info("Loading all-MiniLM-L6-v2 model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    logger.info(
        f"✓ Model loaded (embedding dimension: {model.get_sentence_embedding_dimension()})"
    )

    # Load examples
    logger.info("Loading AlgoKit examples...")
    examples = load_examples(input_path)
    logger.info(f"✓ Loaded {len(examples)} examples from repository")

    # Generate embeddings
    examples_with_embeddings = generate_embeddings(examples, model)

    # Prepare output (clean up fields for browser)
    logger.info("Preparing output data...")
    output_data = prepare_output(examples_with_embeddings)

    # Save results
    save_embeddings(output_data, output_path)

    logger.info("=" * 50)
    logger.info("✓ Done! Embeddings ready for browser app.")
    logger.info("=" * 50)

    # Show sample embedding text for verification
    if examples:
        logger.info("Sample embedding text for first example:")
        logger.info("-" * 50)
        logger.info(create_embedding_text(examples[0]))


if __name__ == "__main__":
    main()
