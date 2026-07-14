/**
 * Quick channel ID lookup by name via YouTube search API
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

const YT_KEY = process.env.YOUTUBE_API_KEY!;

const CHANNELS_TO_FIND = [
  "LakiFN",
  "Biggaboo",
  "JayDubSlays",
  "Mongraal200IQ",
  "FNCompUpdates",
  "oriko skateboarding",
  "Ricky Glaser skateboarding",
  "Johnny Ringer skateboarding",
  "Andrew Schrock",
  "Bryan Arnett skateboarding",
  "Sk8heart",
  "JMK Freeskates",
  "Kayo Martin",
  "Tyler Vitelli",
  "Thinknoodles",
  "MrBeast",
  "HYPEFLIX",
];

async function searchChannel(query: string) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("key", YT_KEY);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "channel");
  url.searchParams.set("maxResults", "1");

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error(`  Error searching "${query}": ${res.status}`);
    return null;
  }
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) {
    console.log(`  No results for: ${query}`);
    return null;
  }
  return {
    name: item.snippet.channelTitle,
    id: item.snippet.channelId,
    description: (item.snippet.description || "").slice(0, 80),
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("Looking up channel IDs...\n");
  const results: any[] = [];

  for (const query of CHANNELS_TO_FIND) {
    const result = await searchChannel(query);
    if (result) {
      console.log(`  "${query}" -> ${result.name} (${result.id})`);
      results.push({ query, ...result });
    }
    await sleep(500);
  }

  console.log("\n\n// Paste into seed-videos.ts:\n");
  for (const r of results) {
    console.log(`  { id: "${r.id}", name: "${r.name}", tags: [] },`);
  }
}

main().catch(console.error);
