// =============================================================================
// GOATED — Shared LLM caller
// -----------------------------------------------------------------------------
// One OpenAI-compatible client for every AI feature.
//
// Order:
//   1. xAI Grok, when XAI_API_KEY is set (https://console.x.ai)
//   2. Groq, using a model this account can actually call
//
// Claude is not called. The Anthropic key on file authenticates, but the
// account has no credits, so every request came back 400 and the chat looked
// broken. The previous Groq defaults (llama-3.3-70b-versatile and
// llama-3.1-8b-instant) also 404 on the current Groq catalog. Qwen 3.8 27B
// is on that catalog, returns normal content, speaks JSON mode, and emits
// tool calls the lead search loop can run.
// =============================================================================

const XAI_URL = 'https://api.x.ai/v1/chat/completions';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Verified against GET /openai/v1/models on the configured Groq key.
const GROQ_DEFAULT = 'qwen/qwen3.8-27b';
const GROQ_FALLBACK = 'openai/gpt-oss-120b';

export const MODELS = {
  xai: process.env.XAI_MODEL || 'grok-4',
  groq: process.env.GROQ_CHAT_MODEL || GROQ_DEFAULT,
};

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

/** Providers actually configured, best first. Each entry is one model attempt. */
export function llmTargets() {
  const out = [];
  const xaiKey = process.env.XAI_API_KEY;
  if (xaiKey) {
    for (const model of unique([process.env.XAI_MODEL, 'grok-4', 'grok-3'])) {
      out.push({ id: 'xai', key: xaiKey, url: XAI_URL, model });
    }
  }
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    for (const model of unique([process.env.GROQ_CHAT_MODEL, GROQ_DEFAULT, GROQ_FALLBACK])) {
      out.push({ id: 'groq', key: groqKey, url: GROQ_URL, model });
    }
  }
  return out;
}

/**
 * One chat completion against a single target.
 * ok is false when the HTTP call failed or the model returned neither text
 * nor a tool call — callers then try the next target.
 */
export async function completeOnce(target, opts = {}) {
  const {
    messages,
    tools,
    toolChoice,
    maxTokens = 500,
    temperature = 0.7,
    timeoutMs = 25000,
    json = false,
  } = opts;

  const body = {
    model: target.model,
    messages,
    max_tokens: maxTokens,
    temperature,
  };
  if (tools?.length) {
    body.tools = tools;
    body.tool_choice = toolChoice || 'auto';
  }
  if (json) body.response_format = { type: 'json_object' };

  try {
    const r = await fetch(target.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${target.key}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) {
      return {
        ok: false,
        error: `${target.id}:${target.model} ${r.status}: ${(await r.text()).slice(0, 180)}`,
      };
    }
    const data = await r.json();
    const message = data.choices?.[0]?.message;
    if (!message) return { ok: false, error: `${target.id}:${target.model} empty message` };
    const content = typeof message.content === 'string' ? message.content.trim() : '';
    const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
    if (!content && toolCalls.length === 0) {
      return { ok: false, error: `${target.id}:${target.model} empty content` };
    }
    return {
      ok: true,
      content,
      message,
      toolCalls,
      provider: target.id,
      model: target.model,
    };
  } catch (e) {
    return { ok: false, error: `${target.id}:${target.model} threw: ${e.message}` };
  }
}

/** Plain text. Returns the string, or null if every target failed. */
export async function callLLM(systemPrompt, userMessage, maxTokens = 500, opts = {}) {
  const errors = [];
  for (const target of llmTargets()) {
    const turn = await completeOnce(target, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      maxTokens,
      temperature: opts.temperature ?? 0.7,
      timeoutMs: opts.timeoutMs ?? 25000,
      json: !!opts.json,
    });
    if (turn.ok && turn.content) return turn.content;
    if (turn.error) errors.push(turn.error);
  }
  if (errors.length) console.warn('[GOATED] LLM failed:', errors.join(' | '));
  return null;
}

/** Strict JSON object. Returns { data, provider, model, errors }. */
export async function callJSON(systemPrompt, userMessage, maxTokens = 2600, opts = {}) {
  const errors = [];
  for (const target of llmTargets()) {
    const turn = await completeOnce(target, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      maxTokens,
      temperature: opts.temperature ?? 0.35,
      timeoutMs: opts.timeoutMs ?? 20000,
      json: true,
    });
    if (!turn.ok) {
      if (turn.error) errors.push(turn.error);
      continue;
    }
    const clean = (turn.content || '').replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    try {
      return { data: JSON.parse(clean), provider: target.provider, model: target.model, errors };
    } catch {
      errors.push(`${target.id}:${target.model} invalid json`);
    }
  }
  return { data: null, provider: null, model: null, errors };
}

export function llmStatus() {
  return {
    xai: !!process.env.XAI_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    models: MODELS,
  };
}
