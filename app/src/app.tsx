import { createSignal, onMount, Show, For } from "solid-js";
import { searchExamples, getHealth } from "./lib/search";
import type { SearchResult, SearchResponse } from "./lib/types";

export default function App() {
  const [query, setQuery] = createSignal("");
  const [isSearching, setIsSearching] = createSignal(false);
  const [searchError, setSearchError] = createSignal<string | null>(null);
  const [results, setResults] = createSignal<SearchResult[]>([]);
  const [processingTime, setProcessingTime] = createSignal<number | null>(null);
  const [examplesCount, setExamplesCount] = createSignal<number | null>(null);

  onMount(async () => {
    try {
      const health = await getHealth();
      setExamplesCount(health.examplesCount);
    } catch (error) {
      console.warn('Health check failed:', error);
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
    setProcessingTime(null);

    try {
      const response = await searchExamples(query(), 10);
      setResults(response.results);
      setProcessingTime(response.processingTimeMs);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      // Provide helpful error message if backend is not running
      if (message.includes('backend') || message.includes('connect')) {
        setSearchError('Backend API is not running. Start it with: cd backend && npm run dev');
      } else {
        setSearchError(message);
      }
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div>
      <h1>AlgoKit Examples Explorer</h1>
      <p>Search for AlgoKit examples using semantic similarity</p>
      <Show when={examplesCount()}>
        <p>Searching across {examplesCount()} examples</p>
      </Show>

      {/* Search Form */}
      <div style={{ 'margin-top': '24px' }}>
        <input
          type="text"
          placeholder="Search for AlgoKit examples..."
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          disabled={isSearching()}
          style={{ width: '400px', padding: '8px', 'font-size': '16px' }}
        />
        <button
          onClick={handleSearch}
          disabled={isSearching() || !query().trim()}
          style={{ padding: '8px 16px', 'margin-left': '8px', 'font-size': '16px' }}
        >
          {isSearching() ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search Error */}
      <Show when={searchError()}>
        <div style={{ color: 'red', 'margin-top': '16px', padding: '12px', border: '1px solid red', 'background-color': '#fee' }}>
          <strong>Error:</strong> {searchError()}
        </div>
      </Show>

      {/* Results */}
      <Show when={results().length > 0}>
        <div style={{ 'margin-top': '24px' }}>
          <h3>
            Results ({results().length})
            <Show when={processingTime()}>
              <span style={{ 'font-weight': 'normal', 'font-size': '14px', color: '#666', 'margin-left': '8px' }}>
                ({processingTime()}ms)
              </span>
            </Show>
          </h3>
          <For each={results()}>
            {(result) => (
              <div style={{
                border: '1px solid #ccc',
                padding: '16px',
                'margin-bottom': '16px',
                'border-radius': '4px'
              }}>
                <h4 style={{ 'margin-top': '0' }}>{result.title}</h4>
                <p style={{
                  'font-weight': 'bold',
                  color: result.similarity >= 70 ? '#2d7a2d' : result.similarity >= 50 ? '#d97706' : '#666'
                }}>
                  {result.similarity.toFixed(1)}% match
                </p>
                <p>{result.summary}</p>
                <div style={{ 'margin-top': '8px', 'font-size': '14px', color: '#666' }}>
                  <strong>Repository:</strong> {result.repository} |{' '}
                  <strong>Language:</strong> {result.language} |{' '}
                  <strong>Complexity:</strong> {result.complexity}
                </div>
                <div style={{ 'margin-top': '8px' }}>
                  <strong>Tags:</strong>{' '}
                  <span style={{ 'font-size': '14px' }}>
                    {result.feature_tags.join(', ')}
                  </span>
                </div>
                <div style={{ 'margin-top': '4px' }}>
                  <strong>Target Users:</strong>{' '}
                  <span style={{ 'font-size': '14px' }}>
                    {result.target_users.join(', ')}
                  </span>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* No Results Message */}
      <Show when={!isSearching() && results().length === 0 && query().trim() && !searchError()}>
        <div style={{ 'margin-top': '24px', padding: '16px', 'background-color': '#f0f0f0', 'border-radius': '4px' }}>
          <p>No results found. Try a different search query.</p>
        </div>
      </Show>
    </div>
  );
}