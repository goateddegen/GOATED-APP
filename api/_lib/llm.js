// =============================================================================
// GOATED — Shared LLM caller (Anthropic → Groq)
// -----------------------------------------------------------------------------
// Single place that knows how to reach a model, so a dead provider degrades to
// the other one instead of to static text — and so model IDs live in ONE file.
//
// This module is NOT a serverless function (underscore prefix = excluded).
//
// Why this exists: four endpoints each carried their own copy of a
// `callClaude()` helper hardcoded to claude-sonnet-4-20250514, a model ID that
// now 404s. Every one of them was silently returning null.
// =============================================================================

// Verified against GET /v1/models. Update here, nowhere else.
export const MODELS = {
  anthropic: 'claude-sonnet-4-6',
  groq: 'llama-3.3-70b-versatile',
};

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Call the best available LLM. Returns the text, or null if every provider
 * failed — callers treat null as "no AI available" and fall back to their own
 * deterministic output.
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {number} maxTokens
 * @param {object} [opts] - { temperature, timeoutMs }
 */
export async function callLLM(systemPrompt, userMessage, maxTokens = 500, opts = {}) {
  const { temperature = 0.7, timeoutMs = 25000 } = opts;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (anthropicKey) {
    try {
      const r = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODELS.anthropic,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (r.ok) {
        const d = await r.json();
        const text = d.content?.[0]?.text;
        if (text) return text;
      } else {
        // 400 = bad/retired model, 401 = bad key, 429 = rate limit,
        // 402/400-credit = exhausted balance. All worth seeing in logs.
        console.warn(`[GOATED] Anthropic ${r.status}: ${(await r.text()).slice(0, 160)}`);
      }
    } catch (e) {
      console.warn(`[GOATED] Anthropic threw: ${e.message}`);
    }
  }

  if (groqKey) {
    try {
      const r = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: MODELS.groq,
          max_tokens: maxTokens,
          temperature,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (r.ok) {
        const d = await r.json();
        const text = d.choices?.[0]?.message?.content;
        if (text) return text;
      } else {
        console.warn(`[GOATED] Groq ${r.status}: ${(await r.text()).slice(0, 160)}`);
      }
    } catch (e) {
      console.warn(`[GOATED] Groq threw: ${e.message}`);
    }
  }

  return null;
}

/** Which providers are actually configured — for /api health surfaces. */
export function llmStatus() {
  return {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    models: MODELS,
  };
}
