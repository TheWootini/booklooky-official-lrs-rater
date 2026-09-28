// SPDX-License-Identifier: MIT
import {
  OFFICIAL_SCAN_TRANSCRIPT_CHUNK_CHARS,
  OFFICIAL_SCAN_TRANSCRIPT_CHUNK_OVERLAP,
} from './constants';

/** Normalize line endings and collapse extra blank lines. */
export function cleanTranscriptText(input: string): string {
  return String(input || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function chunkByChars(text: string, chunkSize: number, overlap: number): string[] {
  const out: string[] = [];
  const t = text.trim();
  if (!t) return out;

  const size = Math.max(500, chunkSize);
  const ov = Math.max(0, Math.min(overlap, size - 50));

  let start = 0;
  while (start < t.length) {
    const end = Math.min(t.length, start + size);
    const slice = t.slice(start, end).trim();
    if (slice) out.push(slice);
    if (end >= t.length) break;
    start = Math.max(0, end - ov);
  }
  return out;
}

/** Split a full transcript into overlapping segments sized for the per-chunk scan pass. */
export function chunkTranscript(text: string): string[] {
  return chunkByChars(text, OFFICIAL_SCAN_TRANSCRIPT_CHUNK_CHARS, OFFICIAL_SCAN_TRANSCRIPT_CHUNK_OVERLAP);
}
