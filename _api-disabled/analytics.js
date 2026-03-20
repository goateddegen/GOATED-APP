// =============================================================================
// GOATED Solutions - Analytics / KPI Endpoint
// =============================================================================
// Endpoints:
//   POST /api/analytics  - Track an event (page_view, button_click, feature_used, etc.)
//   GET  /api/analytics  - Retrieve aggregated analytics data
//
// Query Parameters (GET):
//   - period: "1h" | "24h" | "7d" | "30d" (default: "24h")
//   - event:  filter by event type
//
// POST Body:
//   {
//     "event": "page_view" | "button_click" | "feature_used" | "lead_viewed" | "ai_chat" | ...,
//     "properties": { ... },  // any additional metadata
//     "userId": "optional-user-id",
//     "sessionId": "optional-session-id"
//   }
//
// NOTE: Currently stores events in-memory. In production, connect to a real
// database (PostgreSQL, MongoDB, etc.) or use a dedicated analytics service:
//   - Vercel Analytics (built-in)
//   - Mixpanel (https://mixpanel.com/)
//   - PostHog (https://posthog.com/) - open source, self-hostable
//   - Amplitude (https://amplitude.com/)
//   - Segment (https://segment.com/) - for routing to multiple destinations
//
// To connect a database, set the DATABASE_URL env var and use a client like:
//   - @vercel/postgres
//   - prisma
//   - drizzle-orm
//   - mongoose (for MongoDB)
// =============================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ---------------------------------------------------------------------------
// In-memory event store
// WARNING: This resets on every cold start in serverless. For persistence,
// use a database or external analytics service.
// ---------------------------------------------------------------------------
const eventStore = [];
const MAX_EVENTS = 10000; // Cap to prevent memory issues

// ---------------------------------------------------------------------------
// Database integration (commented out - shows how to persist events)
// ---------------------------------------------------------------------------
/*
// Option 1: Vercel Postgres (recommended for Vercel deployments)
import { sql } from '@vercel/postgres';

async function persistEvent(event) {
  await sql`
    INSERT INTO analytics_events (event_type, properties, user_id, session_id, timestamp)
    VALUES (${event.event}, ${JSON.stringify(event.properties)}, ${event.userId}, ${event.sessionId}, ${event.timestamp})
  `;
}

async function queryEvents(period, eventType) {
  const since = new Date(Date.now() - parsePeriodMs(period)).toISOString();

  if (eventType) {
    return await sql`
      SELECT * FROM analytics_events
      WHERE timestamp >= ${since} AND event_type = ${eventType}
      ORDER BY timestamp DESC
    `;
  }

  return await sql`
    SELECT * FROM analytics_events
    WHERE timestamp >= ${since}
    ORDER BY timestamp DESC
  `;
}

// Option 2: MongoDB with Mongoose
import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  event: String,
  properties: mongoose.Schema.Types.Mixed,
  userId: String,
  sessionId: String,
  timestamp: { type: Date, default: Date.now },
});

const Event = mongoose.model('AnalyticsEvent', EventSchema);

// Option 3: PostHog (dedicated analytics)
import { PostHog } from 'posthog-node';
const posthog = new PostHog(process.env.POSTHOG_API_KEY, {
  host: 'https://app.posthog.com',
});

async function trackWithPostHog(event) {
  posthog.capture({
    distinctId: event.userId || 'anonymous',
    event: event.event,
    properties: event.properties,
  });
}
*/

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const VALID_EVENTS = [
  'page_view',
  'button_click',
  'feature_used',
  'lead_viewed',
  'lead_contacted',
  'ai_chat',
  'ai_query',
  'search',
  'export',
  'filter_applied',
  'deal_updated',
  'playbook_used',
  'signup',
  'login',
  'logout',
  'subscription_change',
  'error',
  'custom',
];

function parsePeriodMs(period) {
  const map = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  return map[period] || map['24h'];
}

function aggregateEvents(events) {
  // Count by event type
  const byType = {};
  const byPage = {};
  const byHour = {};
  const uniqueUsers = new Set();
  const uniqueSessions = new Set();

  for (const event of events) {
    // By type
    byType[event.event] = (byType[event.event] || 0) + 1;

    // By page (from properties.page)
    const page = event.properties?.page || 'unknown';
    byPage[page] = (byPage[page] || 0) + 1;

    // By hour
    const hour = new Date(event.timestamp).toISOString().substring(0, 13) + ':00:00Z';
    byHour[hour] = (byHour[hour] || 0) + 1;

    // Unique counts
    if (event.userId) uniqueUsers.add(event.userId);
    if (event.sessionId) uniqueSessions.add(event.sessionId);
  }

  // Sort byType by count
  const topEvents = Object.entries(byType)
    .sort(([, a], [, b]) => b - a)
    .map(([event, count]) => ({ event, count }));

  // Sort byPage by count
  const topPages = Object.entries(byPage)
    .sort(([, a], [, b]) => b - a)
    .map(([page, count]) => ({ page, count }));

  // Timeline data (sorted chronologically)
  const timeline = Object.entries(byHour)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, count]) => ({ hour, count }));

  return {
    totalEvents: events.length,
    uniqueUsers: uniqueUsers.size,
    uniqueSessions: uniqueSessions.size,
    topEvents,
    topPages,
    timeline,
    eventsPerMinute: events.length > 0
      ? parseFloat((events.length / ((Date.now() - new Date(events[events.length - 1].timestamp).getTime()) / 60000)).toFixed(2))
      : 0,
  };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  try {
    // =====================================================================
    // POST - Track an event
    // =====================================================================
    if (req.method === 'POST') {
      const { event, properties = {}, userId = null, sessionId = null } = req.body || {};

      // Validate event name
      if (!event || typeof event !== 'string') {
        return res.status(400).json({
          error: 'Missing or invalid "event" field',
          validEvents: VALID_EVENTS,
        });
      }

      const normalizedEvent = event.toLowerCase().replace(/\s+/g, '_');

      // Build event object
      const eventRecord = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        event: normalizedEvent,
        properties: {
          ...properties,
          userAgent: req.headers['user-agent'] || null,
          referer: req.headers['referer'] || null,
          ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || null,
        },
        userId,
        sessionId,
        timestamp: new Date().toISOString(),
      };

      // Store in memory
      eventStore.push(eventRecord);

      // Trim if over max
      if (eventStore.length > MAX_EVENTS) {
        eventStore.splice(0, eventStore.length - MAX_EVENTS);
      }

      // ------------------------------------
      // In production, persist to database:
      // await persistEvent(eventRecord);
      // await trackWithPostHog(eventRecord);
      // ------------------------------------

      return res.status(201).json({
        success: true,
        eventId: eventRecord.id,
        event: normalizedEvent,
        timestamp: eventRecord.timestamp,
        _meta: {
          storageType: 'in-memory',
          totalStored: eventStore.length,
          note: 'Events are stored in-memory and will be lost on cold start. Connect a database for persistence.',
        },
      });
    }

    // =====================================================================
    // GET - Retrieve aggregated analytics
    // =====================================================================
    if (req.method === 'GET') {
      const {
        period = '24h',
        event: filterEvent = '',
      } = req.query;

      const periodMs = parsePeriodMs(period);
      const since = Date.now() - periodMs;

      // Filter events by time period and optionally by event type
      let filteredEvents = eventStore.filter(
        (e) => new Date(e.timestamp).getTime() >= since
      );

      if (filterEvent) {
        filteredEvents = filteredEvents.filter(
          (e) => e.event === filterEvent.toLowerCase()
        );
      }

      const aggregated = aggregateEvents(filteredEvents);

      return res.status(200).json({
        period,
        since: new Date(since).toISOString(),
        until: new Date().toISOString(),
        ...aggregated,
        recentEvents: filteredEvents.slice(-20).reverse(), // Last 20 events
        _meta: {
          storageType: 'in-memory',
          totalInStore: eventStore.length,
          filteredCount: filteredEvents.length,
          note: 'In-memory storage resets on cold start. For production, connect a database.',
          suggestedServices: [
            { name: 'Vercel Analytics', url: 'https://vercel.com/analytics', type: 'built-in' },
            { name: 'PostHog', url: 'https://posthog.com/', type: 'open-source' },
            { name: 'Mixpanel', url: 'https://mixpanel.com/', type: 'SaaS' },
            { name: 'Amplitude', url: 'https://amplitude.com/', type: 'SaaS' },
          ],
        },
      });
    }

    // Method not allowed
    return res.status(405).json({
      error: 'Method not allowed. Use GET or POST.',
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
