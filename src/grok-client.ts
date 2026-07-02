/**
 * Minimal xAI (Grok) chat-completions client returning parsed JSON.
 *
 * Configure via environment:
 *   GROK_API_KEY          — required
 *   GROK_MODEL_REASONING  — optional, defaults to grok-4.3
 */

export const GROK_MODEL_REASONING = process.env.GROK_MODEL_REASONING ?? 'grok-4.3';

type GrokResponse = {
  choices: Array<{ message: { content: string } }>;
};

function getGrokApiKey(): string {
  const key = process.env.GROK_API_KEY;
  if (!key) {
    throw new Error('GROK_API_KEY is not set');
  }
  return key;
}

export async function grokJson<T>(
  prompt: string,
  opts?: { maxTokens?: number; temperature?: number; timeoutMs?: number }
): Promise<T> {
  const apiKey = getGrokApiKey();
  const controller = new AbortController();
  const timeoutMs = opts?.timeoutMs ?? 60000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROK_MODEL_REASONING,
        messages: [
          {
            role: 'system',
            content: 'Return ONLY valid JSON. Do not wrap in markdown fences. No extra text.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: opts?.maxTokens ?? 2500,
        temperature: opts?.temperature ?? 0.2,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Grok API error: ${res.status} ${res.statusText} ${body}`.trim());
    }

    const data = (await res.json()) as GrokResponse;
    const text = data.choices?.[0]?.message?.content ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error(`No JSON object found in Grok response. Starts with: ${text.slice(0, 200)}`);
    }
    return JSON.parse(match[0]) as T;
  } finally {
    clearTimeout(timeout);
  }
}
