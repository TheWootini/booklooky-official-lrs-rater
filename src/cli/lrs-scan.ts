#!/usr/bin/env node
/**
 * lrs-scan — run the official LRS transcript rater on a plain-text book transcript.
 *
 * Usage:
 *   GROK_API_KEY=... lrs-scan --title "Book Title" --author "Author Name" [--isbn 978...] [--out report.json] transcript.txt
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { rateTranscript } from '../analyzer';
import { GROK_MODEL_REASONING } from '../grok-client';
import {
  OFFICIAL_SCAN_CATEGORY_LABELS,
  OFFICIAL_SCAN_CONTENT_INTENSITY_KEYS,
  OFFICIAL_SCAN_STORY_THEME_KEYS,
  isOfficialScanStoryThemeKey,
} from '../categories';

type CliArgs = {
  title: string;
  author: string;
  isbn?: string;
  out?: string;
  file: string;
};

function printUsageAndExit(message?: string): never {
  if (message) console.error(`Error: ${message}\n`);
  console.error(
    'Usage: lrs-scan --title "Book Title" --author "Author Name" [--isbn 9781234567890] [--out report.json] transcript.txt\n\n' +
      'Environment:\n' +
      '  GROK_API_KEY           xAI API key (required)\n' +
      `  GROK_MODEL_REASONING   Model override (default: ${GROK_MODEL_REASONING})`
  );
  process.exit(1);
}

function parseArgs(argv: string[]): CliArgs {
  let title = '';
  let author = '';
  let isbn: string | undefined;
  let out: string | undefined;
  let file = '';

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--title') title = argv[++i] ?? '';
    else if (arg === '--author') author = argv[++i] ?? '';
    else if (arg === '--isbn') isbn = argv[++i];
    else if (arg === '--out') out = argv[++i];
    else if (arg === '--help' || arg === '-h') printUsageAndExit();
    else if (arg.startsWith('--')) printUsageAndExit(`Unknown option: ${arg}`);
    else file = arg;
  }

  if (!title) printUsageAndExit('--title is required');
  if (!author) printUsageAndExit('--author is required');
  if (!file) printUsageAndExit('transcript file path is required (plain-text .txt)');

  return { title, author, isbn, out, file };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!process.env.GROK_API_KEY) {
    printUsageAndExit('GROK_API_KEY environment variable is not set');
  }

  let transcript: string;
  try {
    transcript = readFileSync(args.file, 'utf8');
  } catch (err) {
    printUsageAndExit(`Could not read transcript file "${args.file}": ${err instanceof Error ? err.message : err}`);
  }

  console.error(`Rating "${args.title}" by ${args.author}...`);
  const { report, grokAnalysis } = await rateTranscript({
    title: args.title,
    author: args.author,
    isbn: args.isbn,
    transcript,
    model: process.env.GROK_MODEL_REASONING || undefined,
    onProgress: (done, total) => {
      console.error(`  scanned segment ${done}/${total}`);
    },
  });

  console.error('\n=== LRS Report ===');
  console.error('\nContent Intensity');
  for (const cat of OFFICIAL_SCAN_CONTENT_INTENSITY_KEYS) {
    const r = report.ratings[cat];
    console.error(`  ${OFFICIAL_SCAN_CATEGORY_LABELS[cat].padEnd(28)} ${r.rating}/5`);
  }
  console.error('\nStory Themes');
  for (const cat of OFFICIAL_SCAN_STORY_THEME_KEYS) {
    const r = report.ratings[cat];
    const label = isOfficialScanStoryThemeKey(cat)
      ? `${OFFICIAL_SCAN_CATEGORY_LABELS[cat]} (prominence)`
      : OFFICIAL_SCAN_CATEGORY_LABELS[cat];
    console.error(`  ${label.padEnd(28)} ${r.rating}/5`);
  }
  console.error(`  Minimum age: ${report.minimumAge}+  (confidence: ${report.ageRecommendation?.confidence ?? 'n/a'})`);
  console.error(`  Summary: ${report.reasoningSummary}`);

  const output = JSON.stringify({ report, grokAnalysis }, null, 2);
  if (args.out) {
    writeFileSync(args.out, output, 'utf8');
    console.error(`\nFull report written to ${args.out}`);
  } else {
    console.log(output);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
