import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from './useStore';

/**
 * useLiveData — Custom hook for polling live API data
 *
 * Fetches from /api/leads, /api/trends, /api/market-data, and /api/plays
 * at configurable intervals. Falls back to generated data on failure.
 *
 * Intervals:
 *   - Leads:       every 30s
 *   - Trends:      every 60s
 *   - Market Data: every 15s
 *   - Plays:       every 20s
 *
 * Returns: { leads, trends, marketData, plays, isLive, isLoading, error, refetch }
 */

const INTERVALS = {
  leads: 30_000,       // 30 seconds
  trends: 60_000,      // 60 seconds
  marketData: 15_000,  // 15 seconds
  plays: 20_000,       // 20 seconds
};

export function useLiveData({ enabled = true, intervals = {} } = {}) {
  const mergedIntervals = { ...INTERVALS, ...intervals };

  // Store selectors
  const fetchLiveLeads = useStore(s => s.fetchLiveLeads);
  const fetchLiveTrends = useStore(s => s.fetchLiveTrends);
  const fetchMarketData = useStore(s => s.fetchMarketData);
  const fetchLivePlays = useStore(s => s.fetchLivePlays);

  const dataMode = useStore(s => s.dataMode);
  const generatedLeads = useStore(s => s.leads);
  const liveLeads = useStore(s => s.liveLeads);
  const liveTrends = useStore(s => s.liveTrends);
  const liveMarketData = useStore(s => s.liveMarketData);
  const livePlays = useStore(s => s.livePlays);

  const isLoadingLeads = useStore(s => s.isLoadingLeads);
  const isLoadingTrends = useStore(s => s.isLoadingTrends);
  const isLoadingMarketData = useStore(s => s.isLoadingMarketData);
  const isLoadingPlays = useStore(s => s.isLoadingPlays);

  const leadsError = useStore(s => s.leadsError);
  const trendsError = useStore(s => s.trendsError);
  const marketDataError = useStore(s => s.marketDataError);
  const playsError = useStore(s => s.playsError);

  // Track whether initial fetch has been attempted
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  // Refs for interval IDs so we can clean up
  const leadsInterval = useRef(null);
  const trendsInterval = useRef(null);
  const marketDataInterval = useRef(null);
  const playsInterval = useRef(null);

  // Fetch all data sources at once
  const refetch = useCallback(async () => {
    const results = await Promise.allSettled([
      fetchLiveLeads(),
      fetchLiveTrends(),
      fetchMarketData(),
      fetchLivePlays(),
    ]);
    setInitialFetchDone(true);
    return results;
  }, [fetchLiveLeads, fetchLiveTrends, fetchMarketData, fetchLivePlays]);

  // Set up polling intervals
  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    refetch();

    // Set up individual intervals per data source
    leadsInterval.current = setInterval(() => {
      fetchLiveLeads();
    }, mergedIntervals.leads);

    trendsInterval.current = setInterval(() => {
      fetchLiveTrends();
    }, mergedIntervals.trends);

    marketDataInterval.current = setInterval(() => {
      fetchMarketData();
    }, mergedIntervals.marketData);

    playsInterval.current = setInterval(() => {
      fetchLivePlays();
    }, mergedIntervals.plays);

    // Cleanup all intervals on unmount or when enabled changes
    return () => {
      if (leadsInterval.current) clearInterval(leadsInterval.current);
      if (trendsInterval.current) clearInterval(trendsInterval.current);
      if (marketDataInterval.current) clearInterval(marketDataInterval.current);
      if (playsInterval.current) clearInterval(playsInterval.current);
    };
  }, [enabled, refetch, fetchLiveLeads, fetchLiveTrends, fetchMarketData, fetchLivePlays, mergedIntervals.leads, mergedIntervals.trends, mergedIntervals.marketData, mergedIntervals.plays]);

  // Determine active leads: live if available, otherwise generated fallback
  const leads = (dataMode === 'live' && liveLeads.length > 0) ? liveLeads : generatedLeads;

  // Determine if we are truly live (at least leads came from API)
  const isLive = dataMode === 'live' && liveLeads.length > 0;

  // Combined loading state
  const isLoading = isLoadingLeads || isLoadingTrends || isLoadingMarketData || isLoadingPlays;

  // Combined error — first error found, or null
  const error = leadsError || trendsError || marketDataError || playsError || null;

  return {
    // Data
    leads,
    trends: liveTrends,
    marketData: liveMarketData,
    plays: livePlays,

    // Status
    isLive,
    isLoading,
    initialFetchDone,
    error,
    dataMode,

    // Per-source loading
    loading: {
      leads: isLoadingLeads,
      trends: isLoadingTrends,
      marketData: isLoadingMarketData,
      plays: isLoadingPlays,
    },

    // Per-source errors
    errors: {
      leads: leadsError,
      trends: trendsError,
      marketData: marketDataError,
      plays: playsError,
    },

    // Actions
    refetch,
  };
}

export default useLiveData;
