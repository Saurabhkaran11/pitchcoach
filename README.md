# 🎤 PitchCoach — your AI investor, in your pocket

**Say your startup pitch out loud. Get scored like a YC partner would. Hear it rewritten — in your own voice.**

Built in one hour at [OSS4AI: Build an AI Startup in One Day](https://luma.com/oss4ai-fdvg) · Voice AI Track

> 🎬 **2-min demo video:** [demo.mp4](public/demo.mp4) · **Instant scored demo:** https://saurabhkaran11.github.io/pitchcoach/?demo=1&qa=1&skin=glass
>
> 👉 **Live app:** https://pitchcoach-five.vercel.app/ — no signup. Hit **▶ Try a demo pitch** to see it work in 5 seconds. Real scoring needs your own Gemini API key.

---

## New: Repo to Pitch in 30s (`/deck`)

Paste a GitHub repo, pick the room (Hackathon, VC Pitch, Product Launch, College Demo) and get an editable slide deck, a demo script with a timer, a 60-second and 5-minute pitch with Q&A prep, and event tips. Present in the browser (arrow keys, F fullscreen, N notes), or export PPTX, PDF, Markdown or a share link. Facts come from the repo only; the model is told to leave `[add: …]` placeholders where a number is missing.

Stack: Next.js (App Router) · Tailwind v4 · shadcn-style components · Zustand · Mermaid · pptxgenjs. Try it: https://pitchcoach-five.vercel.app/deck

---

## The problem

Founders practice their pitch in the mirror. The mirror doesn't tell you your hook is weak, you said "um" nine times, or that you never actually asked for money. Real feedback only comes from investors — and by then it's too late.

## What PitchCoach does

1. **You talk.** Tap the orb and pitch. A live coach shows your time, words-per-minute and filler-word count *while you speak*, with a "wrap it up" nudge at 45 seconds.
   *Can't or don't want to speak?* Open **⌨️ Prefer to type your pitch?** and write it instead — same scoring, rewrite, and Q&A, and the rewrite is still read aloud.
2. **An AI investor scores you** on the five things that matter: **Hook · Clarity · Problem · Solution · Ask.** Pick who judges you — YC partner, Shark Tank shark, friendly angel, or brutal VC.
3. **It rewrites your pitch** into a tight 30-second version.
4. **You hear it back in *your own voice*.** We clone your voice from the recording you just made, so the rewrite sounds like you — not a robot.
5. **Face the hardest question.** The investor asks the one question that would kill your deal. You answer out loud. It grades your answer.
6. **Pitch again.** Every attempt is tracked — see your score go up. Confetti at 8+.
7. **See your analysis.** Best, average and change since your first try; a trend chart; a table per criterion with your weakest area flagged; an AI coaching plan with 3 drills; CSV export.

## Why this wins

- **Real voice AI, not a chatbot with a mic.** Speech in, cloned speech out, live coaching in between.
- **The "wow" is instant.** Hearing your own voice deliver a better version of your pitch is something people remember.
- **Zero friction.** No install and no account. Works on a phone. The demo pitch needs no key.
- **Built on the sponsors' stack:**
  - **Boson AI — Higgs TTS 3** for speech and one-shot voice cloning (`ref_audio`)
  - **Nebius Token Factory** for the investor brain (scoring, rewrite, Q&A) at the event. The app now uses Google Gemini.

## Run locally / deploy

```bash
npm install
npm run dev                 # http://localhost:8787  (voice coach at /, decks at /deck)
node lib/github.test.mjs    # self-check for the repo URL parser + stack detection
```
## Deploy

Host on Vercel, or any host that runs Next.js. Run `npm run build` and `npm start`.

No setting is required. Visitors bring their own AI keys.

- **Visitor keys:** a Gemini key for scoring, rewrites and decks, and an optional Boson AI key for the cloned voice. They are pasted into the app, held in browser memory, sent only with a request to this app's own routes and never stored or logged. There is no server key fallback.
- **Optional owner settings** (see `.env.example`): `GITHUB_TOKEN` raises the GitHub rate limit for public repos, `WAITLIST_WEBHOOK` receives waitlist emails, `LLM_MODEL` and `LLM_FALLBACK_MODEL` change the Gemini model, `ALLOWED_ORIGINS` allows extra API origins.

A static copy such as GitHub Pages has no `/api` routes, so only the demo pitch works there.

## Try it in 60 seconds

1. Open the live link in **Chrome** (mic + speech recognition).
2. Tap **▶ Try a demo pitch** — see scoring, feedback and rewrite with no keys.
3. For the full experience, open *Model settings* and paste your own Gemini key, plus a Boson key for the cloned voice. Then tap the orb and pitch.

## How it's built

| Piece | Tech |
|---|---|
| Speech → text, live waveform, WPM & filler detection | Browser Web Speech + Web Audio APIs |
| Investor scoring, rewrite, hardest question, answer grading | Google Gemini (OpenAI-compatible endpoint), through `/api/llm` |
| Rewrite read back in your cloned voice · question spoken aloud | Boson AI Higgs TTS 3, through `/api/tts`. Browser voice without a key |
| Attempt history, sparkline, shareable PNG scorecard | localStorage + canvas |

The voice coach is `public/index.html` and `public/analysis.js`. The deck builder is a Next.js app under `app/deck`.

## The business

| | |
|---|---|
| **Who pays** | Founders raising a round (~500K new startups/yr in the US alone), accelerator cohorts, university pitch competitions, sales teams practicing demos |
| **Pricing** | Free: 3 pitches/day. **Pro $12/mo:** unlimited, voice clone, investor Q&A, team mode. **Accelerator $99/mo:** cohort dashboard |
| **Go-to-market** | Every scorecard is a shareable PNG → founders post their score on X/LinkedIn → free viral loop. Partner with accelerators for Demo Day prep |
| **Cost to serve** | Not measured. Visitors currently pay their own AI costs through their own keys |
| **Moat** | Attempt history + your cloned voice = switching cost. Every pitch scored makes the coach better |

Already in the app: a browser-side daily limit, a Pro waitlist form and a privacy note. Pro plans and payments are not built.

## Judging criteria — how we map

This table describes the build as submitted at the event.

| Criterion | PitchCoach |
|---|---|
| **Innovation** | First pitch coach that answers back in *your own voice*. Live coaching HUD while you speak, not after |
| **Technical execution** | Full voice loop (STT → LLM → voice-cloned TTS) + investor Q&A in a single dependency-free HTML file, working on phone and desktop |
| **Use of sponsor tech** | Boson Higgs TTS 3 (speech + one-shot voice clone), Nebius Token Factory (all reasoning) — both core, not decorative |
| **Business viability** | Clear buyer, pricing, $0.02 cost per pitch, built-in viral loop via shareable scorecards |
| **Demo / presentation** | Works with zero setup (▶ demo button). 60-second wow: pitch → score → hear yourself improved |
| **Completeness** | Live at the link above. Error handling, mobile layout, free tier, waitlist — shippable today |

## Production readiness

Visitor-supplied keys held in browser memory, per-IP rate limits and origin checks on every endpoint, provider retry + model fallback, voice-clone consent, privacy & terms page, analytics tag. Full status and what is still open: [GTM.md](GTM.md).

## What's next

- Multi-round Q&A that gets harder as you improve
- Team mode: pitch to your co-founders' cloned voices
- Deck outline generated from the winning pitch

---

Made by [Saurabh Karan](https://github.com/Saurabhkaran11) · OSS4AI Hackathon
