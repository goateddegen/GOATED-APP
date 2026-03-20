import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// useGoatedAI — Custom hook for GOATED AI Engine integration
// Fetches predictions, technicals, sentiment, regime detection from /api/goated-ai
// ============================================================================

const CACHE_TTL = 30_000; // 30s cache
let globalCache = { data: null, ts: 0 };

export function useGoatedAI({ autoFetch = true, interval = 60_000 } = {}) {
  const [aiData, setAiData] = useState(globalCache.data);
  const [loading, setLoading] = useState(!globalCache.data);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const fetchAI = useCallback(async () => {
    // Return cache if fresh
    if (globalCache.data && Date.now() - globalCache.ts < CACHE_TTL) {
      setAiData(globalCache.data);
      setLoading(false);
      return globalCache.data;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/goated-ai');
      if (!res.ok) throw new Error(`AI engine returned ${res.status}`);
      const data = await res.json();
      globalCache = { data, ts: Date.now() };
      setAiData(data);
      setError(null);
      return data;
    } catch (err) {
      console.warn('GOATED AI fetch failed:', err.message);
      setError(err.message);
      // Return stale cache if available
      if (globalCache.data) {
        setAiData(globalCache.data);
        return globalCache.data;
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoFetch) return;
    fetchAI();
    intervalRef.current = setInterval(fetchAI, interval);
    return () => clearInterval(intervalRef.current);
  }, [autoFetch, interval, fetchAI]);

  // Get prediction for a specific coin
  const getPrediction = useCallback((symbol) => {
    if (!aiData?.predictions) return null;
    return aiData.predictions.find(p =>
      p.symbol?.toUpperCase() === symbol?.toUpperCase() ||
      p.id === symbol?.toLowerCase()
    );
  }, [aiData]);

  // Get technical analysis for a specific coin
  const getTechnicals = useCallback((symbol) => {
    if (!aiData?.technicals) return null;
    return aiData.technicals.find(t =>
      t.symbol?.toUpperCase() === symbol?.toUpperCase() ||
      t.id === symbol?.toLowerCase()
    );
  }, [aiData]);

  return {
    aiData,
    loading,
    error,
    fetchAI,
    getPrediction,
    getTechnicals,
    regime: aiData?.regime || null,
    sentiment: aiData?.sentiment || null,
    predictions: aiData?.predictions || [],
    correlations: aiData?.correlations || [],
    newsIntelligence: aiData?.newsIntelligence || null,
    portfolioHeat: aiData?.portfolioHeat || null,
    engineVersion: aiData?.engineVersion || null,
  };
}
