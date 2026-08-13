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

/** Max chars of an upstream error body to include in thrown Errors / logs. */
const GROK_ERROR_BODY_MAX_CHARS = 400;

/**
 * Security best practice: never append full upstream API error bodies to thrown
 * Errors. Providers may return large or unexpected payloads; truncating keeps
 * failures debuggable without flooding logs or leaking excess detail.
 */
function summarizeGrokErrorBody(body: string): string {
  const raw = String(body || '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const nested =
      parsed.error && typeof parsed.error === 'object'
        ? (parsed.error as Record<string, unknown>)
        : undefined;
    const message =
      (typeof nested?.message === 'string' && nested.message) ||
      (typeof parsed.message === 'string' && parsed.message) ||
      (typeof nested?.code === 'string' && nested.code) ||
      (typeof parsed.code === 'string' && parsed.code) ||
      '';
    if (message) {
      return message.length > GROK_ERROR_BODY_MAX_CHARS
        ? `${message.slice(0, GROK_ERROR_BODY_MAX_CHARS)}…`
        : message;
    }
  } catch {
    // Not JSON — fall through to truncated plain text.
  }

  return raw.length > GROK_ERROR_BODY_MAX_CHARS
    ? `${raw.slice(0, GROK_ERROR_BODY_MAX_CHARS)}…`
    : raw;
}

/** Cap model message content before parsing to bound memory / DoS from huge replies. */
const GROK_CONTENT_MAX_CHARS = 200_000;

/**
 * Security best practice: do not use a greedy `/\{[\s\S]*\}/` regex on model
 * output (it spans from the first `{` to the last `}` and can over-read huge
 * or malformed payloads). Prefer direct JSON.parse, then a brace-balanced
 * extraction of the first object only.
 */
function extractJsonObjectText(content: string): string {
  let text = String(content || '').trim();
  if (!text) {
    throw new Error('Grok response content was empty');
  }
  if (text.length > GROK_CONTENT_MAX_CHARS) {
    throw new Error(
      `Grok response content exceeded ${GROK_CONTENT_MAX_CHARS} characters (${text.length})`
    );
  }

  // Models sometimes wrap JSON in markdown fences despite the system prompt.
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) {
    text = fenced[1].trim();
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return text;
    }
  } catch {
    // Fall through to brace-balanced extraction.
  }

  const start = text.indexOf('{');
  if (start === -1) {
    throw new Error(`No JSON object found in Grok response. Starts with: ${text.slice(0, 200)}`);
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  throw new Error(`Unbalanced JSON object in Grok response. Starts with: ${text.slice(0, 200)}`);
}

function parseGrokJsonContent<T>(content: string): T {
  const jsonText = extractJsonObjectText(content);
  try {
    return JSON.parse(jsonText) as T;
  } catch (err) {
    throw new Error(
      `Failed to parse Grok JSON: ${err instanceof Error ? err.message : err}. Starts with: ${jsonText.slice(0, 200)}`
    );
  }
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
      const detail = summarizeGrokErrorBody(body);
      throw new Error(
        detail
          ? `Grok API error: ${res.status} ${res.statusText} — ${detail}`
          : `Grok API error: ${res.status} ${res.statusText}`
      );
    }

    const data = (await res.json()) as GrokResponse;
    const text = data.choices?.[0]?.message?.content ?? '';
    return parseGrokJsonContent<T>(text);
  } finally {
    clearTimeout(timeout);
  }
}
