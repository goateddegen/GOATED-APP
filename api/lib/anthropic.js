import Anthropic from '@anthropic-ai/sdk';

let client = null;

function getClient() {
  if (!client && process.env.ANTHROPIC_API_KEY) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function callClaude(systemPrompt, userMessage, maxTokens = 1024) {
  const c = getClient();
  if (!c) return null;

  try {
    const response = await c.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    const text = response.content?.[0]?.text || '';
    return text;
  } catch (err) {
    console.error('[callClaude] Error:', err.message);
    return null;
  }
}

export default { callClaude };
