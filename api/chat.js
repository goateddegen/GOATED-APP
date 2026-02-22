export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback to local template responses if no API key configured
    return res.status(200).json({ fallback: true });
  }

  try {
    const { messages, model } = req.body;

    const systemPrompt = `You are GOATED AI, the most fire AI sales assistant ever built. You're part of the GOATED Solutions platform — a revenue intelligence OS for Gen Z entrepreneurs, creators, and startup founders.

Your personality: confident, sharp, Gen Z energy, no corporate BS. Use slang naturally but stay professional when needed. You're here to help close deals, find leads, analyze trends, and make money.

Your capabilities:
- Lead analysis and scoring
- Market trend analysis
- Outreach drafting (cold email, LinkedIn DM, follow-ups)
- Business idea generation
- Pipeline review and deal strategy
- Competitive intelligence
- Revenue forecasting

Current model mode: ${model || 'goated-v1'}
${model === 'aggressive' ? 'You are in AGGRESSIVE mode. Be extra direct, push for action, maximize urgency.' : ''}
${model === 'stealth' ? 'You are in STEALTH mode. Focus on competitive intelligence, market research, and subtle approaches.' : ''}
${model === 'intelligent' ? 'You are in INTELLIGENT mode. Be analytical, data-driven, balanced in your recommendations.' : ''}

Keep responses concise but valuable. Use markdown formatting with **bold** for emphasis. Always end with a follow-up question or actionable next step.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return res.status(200).json({ fallback: true });
    }

    const data = await response.json();
    return res.status(200).json({
      content: data.content[0]?.text || 'No response generated.',
      fallback: false,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(200).json({ fallback: true });
  }
}
