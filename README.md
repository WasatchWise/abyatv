# abya.tv

The anonymous, zero-PII public front-end for **Ask Before You App**'s video
product. This is Phase 0: the top of the funnel. It sells; it never converts.

## ⛔ The one non-negotiable

**abya.tv holds ZERO PII. No accounts. No login. No email column. No session.
No stored preference. EVER.**

This is not a policy that lives in a doc. It is enforced by the shape of the app:

- **No auth.** No Supabase Auth, no NextAuth, no login route. The plain
  `@supabase/supabase-js` client is used (not `@supabase/ssr`) with
  `persistSession: false` — there is nothing to persist and no cookie to set.
- **No service-role key.** The only Supabase key in the app is the **anon**
  (publishable) key, restricted by RLS to public-read of three vetted-content
  tables. There is no key that could write, and no table to write PII into.
- **No fingerprinting analytics.** No Google Analytics, no Meta pixel, no
  cookies, no device fingerprinting. Traffic counting, if ever added, must be
  cookieless and aggregate.
- **No personal `localStorage`.** Directory search and filters are anonymous UI
  state held in React memory only. Refresh resets everything, by design.

Anything that needs identity (membership, payment, the weekly-briefing email
address) happens on **askbeforeyouapp.com**, a separate production app. abya.tv
links out to it; it never collects on its behalf.

## Architecture

| Surface | What it is | Where it lives |
| --- | --- | --- |
| Hub video | Five-pillars intro (4:07) | Self-hosted on R2, plays on-site |
| 10 track tiles + Track 0 | Agent FERPA training tracks | Placeholders, trailer-ready |
| The Directory | 314 vetted videos, each with a plain-language brief | Live from ABYA_TV, links out |
| Gated episodes | The produced case files | Cards that link to the Agency apex |
| Weekly briefing | Email sign-up | Links out to askbeforeyouapp.com |

### Data source

Supabase project **ABYA_TV** (`pkzexxqshawljljdyobf`), read-only, anon key.
Three tables, all RLS-on, public-read: `abya_channels`, `abya_videos`,
`abya_vetting_log`. The product is `abya_videos.parent_abstract` — the "here's
what's in this video" summary shown on every directory card. The canonical
schema lives at `supabase/migrations/001_initial_schema.sql` (v2, 2026-03-06),
salvaged verbatim from the prior local-only app; it matches the sealed DB.

### The directory data engine (offline ops, not part of the app)

`scripts/seed-videos.ts` is the vetting pipeline: it pulls videos from a curated
channel list, scores each on the 10-dimension rubric with Claude Haiku, writes
the plain-language `parent_abstract`, and upserts approved rows. It is run by
hand (`pnpm seed`) with the ops env (`.env.ops.example`) and is **never imported
by the Next.js app**. It uses the service-role key because it writes *content*
(videos/channels — zero PII); the deployed app has neither the key nor a write
path. `scripts/lookup-channels.ts` resolves channel IDs by name.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind · `@supabase/supabase-js` ·
pnpm. Matches the ask-before-you-app conventions. Deploy target: Vercel project
`abyatv`.

## Local development

```bash
pnpm install
cp .env.example .env.local   # then fill in NEXT_PUBLIC_SUPABASE_ANON_KEY
pnpm dev                     # http://localhost:3000
```

Get the ABYA_TV anon key with:

```bash
supabase projects api-keys --project-ref pkzexxqshawljljdyobf   # the "anon" row
```

## Environment variables

All are `NEXT_PUBLIC_` because the app is entirely public read. **Do not add a
service-role key.**

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pkzexxqshawljljdyobf.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ABYA_TV anon (publishable) key |
| `NEXT_PUBLIC_AGENCY_URL` | `https://askbeforeyouapp.com` (apex only) |
| `NEXT_PUBLIC_HUB_VIDEO_URL` | `https://media.askbeforeyouapp.com/hub-intro-five-pillars-v4.mp4` |

## Scripts

- `pnpm dev` — local dev server
- `pnpm build` — production build
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — `next lint`

## Canon guardrails baked in

- The 10 tracks use their real names (from `agent-ferpa-master-script-v2.md`).
  Track 0 (DPA 101) is the free on-ramp.
- Only 3 pieces are produced (Hub Intro, Ep-F1, Ep-F2). No inflated counts.
- THE FOG is not a character. The only rogues shown are canonical League of
  Gaps art from the master-script rogue-visuals — THE TRACKER (Ep-F1) and THE
  BROKER (Ep-F2), silhouette only. No invented lore.
- Palette is locked to `agent-ferpa-visual-bible.md`: navy `#003D6B`, mid
  `#005696`, cyan `#9CEAFF`, amber `#FFB347`, BreachCorp acid green `#7CFC4D`.
- Pricing lives on the Agency; it is not sold here.

## Salvaged vs. rebuilt

Salvaged from the prior local-only `abya-tv/` app (never pushed):
- `supabase/migrations/001_initial_schema.sql` — canonical v2 schema, verbatim.
- `scripts/seed-videos.ts` — the vetting pipeline. Scoring machinery kept as-is;
  the kid-safe / "Depth Zone" copy was reframed to the review-directory voice.
- `scripts/lookup-channels.ts` — channel-ID lookup helper, verbatim.
- `public/villains/*.webp` — the 11 canonical League of Gaps art files.

Rebuilt new (the old ocean / "Depth Zones" / kid-safe front-end was discarded):
- All of `app/`, `components/`, `lib/` — the case-file-noir front-end.
- `lib/supabase.ts` — a cookieless, anon-only, read-only client (replaces the
  salvaged `@supabase/ssr` cookie client, which is unnecessary with no auth).

Never ported (by design): `joinWaitlist` / the `waitlist` table, and every
ocean/Depth-Zone/kid-safe component. Porting `joinWaitlist` would rebuild the
PII wall that was torn down.
