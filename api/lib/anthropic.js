// =============================================================================
// GOATED Solutions — Shared Anthropic Claude Helper
// =============================================================================
// Reusable function for calling Claude across all API endpoints.
// Graceful fallback: returns null if API key is missing or call fails.
// =============================================================================

export async function callClaude(systemPrompt, userMessage, maxTokens = 500) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null; // graceful fallback

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!res.ok) {
      console.warn('[anthropic] Claude API returned', res.status);
      return null;
    }

    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch (err) {
    console.warn('[anthropic] Claude call failed:', err.message);
    return null;
  }
}
