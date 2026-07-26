// =============================================================================
// GOATED — Vapi voice agent API
// -----------------------------------------------------------------------------
// Endpoint: /api/voice
//
//   GET  ?action=status          → live account state (assistants, numbers, config)
//   GET  ?action=calls&limit=20  → recent call history
//   GET  ?action=call&id=<uuid>  → single call detail (incl. transcript when ended)
//   POST { action:'call', phoneNumber, confirm:true, assistantId? }
//                                → place an outbound call
//
// Key roles (verified against the live account):
//   VAPI_PRIVATE_KEY — server-side. Authorises api.vapi.ai. NEVER expose.
//   VAPI_PUBLIC_KEY  — browser Web SDK only; 401s against this REST API. Safe
//                      to ship to the client as VITE_VAPI_PUBLIC_KEY.
//
// Outbound calling places a REAL phone call to a REAL person and costs money.
// It therefore requires an explicit `confirm: true` and a caller-supplied E.164
// number — there is deliberately no "call every lead" path in this handler.
// Whoever triggers it is responsible for consent and local calling law
// (TCPA/CRTC/GDPR: consent, calling hours, DNC lists, call recording notice).
// =============================================================================
import { guardRequest, setCacheHeaders } from './_lib/guard.js';

const VAPI = 'https://api.vapi.ai';

// Back-compat: the key was originally documented as VAPI_API_KEY.
const privateKey = () => process.env.VAPI_PRIVATE_KEY || process.env.VAPI_API_KEY || '';

async function vapi(path, opts = {}) {
  const key = privateKey();
  const r = await fetch(`${VAPI}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    signal: AbortSignal.timeout(15000),
  });
  const text = await r.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { ok: r.ok, status: r.status, body };
}

// E.164: leading +, country code, up to 15 digits total.
const E164 = /^\+[1-9]\d{7,14}$/;

export default async function handler(req, res) {
  const guard = guardRequest(req, res, {
    rateMaxPerWindow: 20,
    methods: ['GET', 'POST'],
  });
  if (!guard.ok) {
    if (guard.handled) return;
    return res.status(guard.status).json(guard.body);
  }

  if (!privateKey()) {
    return res.status(503).json({
      error: 'Voice agent not configured',
      detail: 'Set VAPI_PRIVATE_KEY in the environment.',
      configured: false,
    });
  }

  try {
    // ─── GET ────────────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { action = 'status', limit = '20', id = '' } = req.query;

      if (action === 'status') {
        setCacheHeaders(res, 30, 10);
        const [assistants, numbers, calls] = await Promise.all([
          vapi('/assistant'),
          vapi('/phone-number'),
          vapi('/call?limit=100'),
        ]);

        if (!assistants.ok) {
          return res.status(502).json({
            error: 'Vapi rejected the private key',
            status: assistants.status,
            configured: false,
          });
        }

        const list = Array.isArray(assistants.body) ? assistants.body : [];
        const nums = Array.isArray(numbers.body) ? numbers.body : [];
        const hist = Array.isArray(calls.body) ? calls.body : [];

        const ended = hist.filter(c => c.status === 'ended');
        const totalSeconds = ended.reduce((s, c) => {
          if (!c.startedAt || !c.endedAt) return s;
          return s + Math.max(0, (new Date(c.endedAt) - new Date(c.startedAt)) / 1000);
        }, 0);

        return res.status(200).json({
          configured: true,
          assistants: list.map(a => ({
            id: a.id,
            name: a.name,
            model: a.model?.model || null,
            voice: a.voice?.voiceId || null,
            firstMessage: a.firstMessage || null,
          })),
          phoneNumbers: nums.map(n => ({
            id: n.id,
            number: n.number,
            name: n.name,
            status: n.status,
            assistantId: n.assistantId || null,
          })),
          defaults: {
            assistantId: process.env.VAPI_ASSISTANT_ID || null,
            phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID || null,
          },
          stats: {
            totalCalls: hist.length,
            endedCalls: ended.length,
            totalMinutes: Math.round(totalSeconds / 60),
          },
          _meta: { source: 'api.vapi.ai', fetchedAt: new Date().toISOString() },
        });
      }

      if (action === 'calls') {
        const n = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const r = await vapi(`/call?limit=${n}`);
        if (!r.ok) return res.status(502).json({ error: 'Vapi call history failed', status: r.status });
        const hist = Array.isArray(r.body) ? r.body : [];
        return res.status(200).json({
          calls: hist.map(c => ({
            id: c.id,
            type: c.type,
            status: c.status,
            endedReason: c.endedReason || null,
            customerNumber: c.customer?.number || null,
            startedAt: c.startedAt || null,
            endedAt: c.endedAt || null,
            durationSeconds: c.startedAt && c.endedAt
              ? Math.round((new Date(c.endedAt) - new Date(c.startedAt)) / 1000)
              : null,
            cost: c.cost ?? null,
            summary: c.analysis?.summary || null,
          })),
          total: hist.length,
        });
      }

      if (action === 'call') {
        if (!id) return res.status(400).json({ error: 'id is required' });
        const r = await vapi(`/call/${encodeURIComponent(id)}`);
        if (!r.ok) return res.status(r.status === 404 ? 404 : 502).json({ error: 'Call not found', status: r.status });
        const c = r.body || {};
        return res.status(200).json({
          id: c.id,
          status: c.status,
          endedReason: c.endedReason || null,
          transcript: c.transcript || null,
          summary: c.analysis?.summary || null,
          recordingUrl: c.recordingUrl || null,
          cost: c.cost ?? null,
          startedAt: c.startedAt || null,
          endedAt: c.endedAt || null,
        });
      }

      return res.status(400).json({ error: `Unknown action "${action}"` });
    }

    // ─── POST — place an outbound call ──────────────────────────────────────
    const { action, phoneNumber, assistantId, phoneNumberId, confirm, metadata } = req.body || {};

    if (action !== 'call') {
      return res.status(400).json({ error: 'Unsupported action. Use { action: "call" }.' });
    }

    if (!E164.test(String(phoneNumber || ''))) {
      return res.status(400).json({
        error: 'phoneNumber must be E.164 format, e.g. +18325551234',
      });
    }

    // Explicit opt-in: this dials a real person and bills the account.
    if (confirm !== true) {
      return res.status(400).json({
        error: 'Refusing to place a call without explicit confirmation',
        detail: 'Send confirm: true. You are responsible for consent, calling hours, and DNC compliance.',
      });
    }

    const useAssistant = assistantId || process.env.VAPI_ASSISTANT_ID;
    const useNumber = phoneNumberId || process.env.VAPI_PHONE_NUMBER_ID;

    if (!useAssistant || !useNumber) {
      return res.status(503).json({
        error: 'Missing assistant or phone number',
        detail: 'Set VAPI_ASSISTANT_ID and VAPI_PHONE_NUMBER_ID, or pass them in the request.',
      });
    }

    const r = await vapi('/call', {
      method: 'POST',
      body: JSON.stringify({
        assistantId: useAssistant,
        phoneNumberId: useNumber,
        customer: { number: phoneNumber },
        ...(metadata ? { metadata } : {}),
      }),
    });

    if (!r.ok) {
      return res.status(502).json({
        error: 'Vapi rejected the call',
        status: r.status,
        detail: typeof r.body === 'string' ? r.body.slice(0, 300) : r.body,
      });
    }

    return res.status(200).json({
      ok: true,
      callId: r.body?.id,
      status: r.body?.status,
      to: phoneNumber,
      assistantId: useAssistant,
      phoneNumberId: useNumber,
      createdAt: r.body?.createdAt,
    });
  } catch (err) {
    console.error('[GOATED] /api/voice error:', err.message);
    return res.status(500).json({ error: 'Voice API error', message: err.message });
  }
}
