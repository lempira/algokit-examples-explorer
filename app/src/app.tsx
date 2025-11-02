import { createSignal, onMount, Show, For } from "solid-js";
import { initializeDatabase } from "./lib/db";
import { searchExamples, formatResults } from "./lib/search";
import type { SearchResult } from "./lib/types";

export default function App() {
  const [initStatus, setInitStatus] = createSignal("Initializing...");
  const [isInitialized, setIsInitialized] = createSignal(false);
  const [initError, setInitError] = createSignal<string | null>(null);

  const [query, setQuery] = createSignal("");
  const [isSearching, setIsSearching] = createSignal(false);
  const [searchError, setSearchError] = createSignal<string | null>(null);
  const [results, setResults] = createSignal<Array<SearchResult & { similarity: number }>>([]);

  // Initialize database on mount
  onMount(async () => {
    try {
      setInitStatus("Loading database...");
      await initializeDatabase();
      setInitStatus("Database ready");
      setIsInitialized(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setInitError(message);
      setInitStatus("Initialization failed");
    }
  });

  // Handle search
  async function handleSearch() {
    if (!query().trim()) {
      setSearchError("Please enter a search query");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setResults([]);

    try {
      const rawResults = await searchExamples(query(), 10);
      const formatted = formatResults(rawResults);
      setResults(formatted);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSearchError(message);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div>
      <h1>AlgoKit Examples Explorer</h1>

      {/* Initialization Status */}
      <div>
        <strong>Status:</strong> {initStatus()}
        <Show when={initError()}>
          <div style={{ color: 'red' }}>
            <strong>Error:</strong> {initError()}
          </div>
        </Show>
      </div>

      <hr />

      {/* Search Form */}
      <Show when={isInitialized()}>
        <div>
          <h2>Search Examples</h2>
          <input
            type="text"
            placeholder="Search for AlgoKit examples..."
            value={query()}
            onInput={(e) => setQuery(e.currentTarget.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            disabled={isSearching()}
            style={{ width: '400px', padding: '8px' }}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching() || !query().trim()}
            style={{ padding: '8px 16px', 'margin-left': '8px' }}
          >
            {isSearching() ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Error */}
        <Show when={searchError()}>
          <div style={{ color: 'red', 'margin-top': '16px' }}>
            <strong>Search Error:</strong> {searchError()}
          </div>
        </Show>

        {/* Results */}
        <Show when={results().length > 0}>
          <div style={{ 'margin-top': '24px' }}>
            <h3>Results ({results().length})</h3>
            <For each={results()}>
              {(result) => (
                <div style={{
                  border: '1px solid #ccc',
                  padding: '16px',
                  'margin-bottom': '16px'
                }}>
                  <h4>{result.title}</h4>
                  <p><strong>Similarity:</strong> {result.similarity.toFixed(1)}%</p>
                  <p>{result.summary}</p>
                  <div>
                    <strong>Repository:</strong> {result.repository} |
                    <strong> Language:</strong> {result.language} |
                    <strong> Complexity:</strong> {result.complexity}
                  </div>
                  <div>
                    <strong>Tags:</strong> {result.feature_tags.join(', ')}
                  </div>
                  <div>
                    <strong>Target Users:</strong> {result.target_users.join(', ')}
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* No Results Message */}
        <Show when={!isSearching() && results().length === 0 && query().trim()}>
          <div style={{ 'margin-top': '24px' }}>
            <p>No results found. Try a different search query.</p>
          </div>
        </Show>
      </Show>
    </div>
  );
}
