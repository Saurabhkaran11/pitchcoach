# PitchCoach — go-to-market checklist

Honest status. ✅ = built and tested. ⬜ = needs a decision, an account, or money from you.

## Product (done in code)
- ✅ Core loop: speak or type → score → rewrite → hear it in your voice → investor Q&A → pitch again
- ✅ **Score analysis**: every attempt saved; KPIs (best, average, change since first try, wpm, filler %), trend chart, per-criterion table, weakest-area focus tip, AI coaching plan, CSV export, clear history
- ✅ Free tier (3 real pitches/day), Pro waitlist, shareable PNG scorecard, 4 skins, mobile layout, demo mode, judge deep-links
- ✅ Accessibility: typed mode, keyboard (space = mic), labels, readable contrast

## Safety, trust, reliability (done in code)
- ✅ API keys server-side only (`api/llm.js`, `api/tts.js`); `keys.js` never deployed or committed
- ✅ **Abuse guard** on every endpoint: same-site origin check + per-IP rate limit + input size caps — strangers can't burn your credits from another site
- ✅ **Provider outages handled**: LLM proxy retries transient 429/5xx and falls back to a second model; the client retries once on unreadable AI output and shows plain-language errors
- ✅ **Voice-clone consent**: one-time explicit OK before a recording leaves the browser; decline = standard voice
- ✅ Privacy & Terms page (`privacy.html`), "AI can be wrong / not investment advice" notice
- ✅ Vercel Web Analytics tag (turn it on: Vercel → project → Analytics → Enable)

## Needs you (cannot be done from code alone)
- ⬜ **Rotate both API keys** — they were shared in chat. Then update `LLM_KEY` / `BOSON_KEY` on Vercel and redeploy.
- ⬜ **Waitlist destination**: set env `WAITLIST_WEBHOOK` to a Zapier / Make / Google Apps Script / Slack webhook URL. Until then signups are only saved in the visitor's browser (you never see them).
- ⬜ **Hard global rate limit**: the guard is per server instance. Before real traffic, add Upstash Redis or Vercel KV (≈20 lines in `api/_guard.js`).
- ⬜ **Accounts + payments** for Pro ($12/mo): Clerk or Supabase Auth + Stripe Checkout. Needs a Stripe account and a business entity. The 3/day limit is browser-side today, so it is a nudge, not a paywall.
- ⬜ **Server-side history** once accounts exist (today history lives in each browser).
- ⬜ **Custom domain** (e.g. pitchcoach.app) and a support email.
- ⬜ **Legal review** of `privacy.html` before charging money — voice cloning is biometric data in some places (Illinois BIPA, EU GDPR).
- ⬜ **Confirm provider terms** allow commercial use at your tier (Gemini API, Boson AI), and check real cost per pitch from your dashboards before fixing the price.

## First 30 days — simplest path to real users
1. Week 1: rotate keys, set the waitlist webhook, enable analytics, buy the domain.
2. Week 1–2: put it in front of 20 founders (this hackathon's attendees, your accelerator/university network). Watch 5 of them use it. Fix what confuses them.
3. Week 2–3: one accelerator or pitch-competition organiser as a free pilot before their Demo Day — that is the first paying segment.
4. Week 3–4: add accounts + Stripe only after people ask to pay or hit the daily limit repeatedly.

## What to measure
Activation = finished first scored pitch. Retention = 2+ attempts in a session (the loop works). Wow = pressed 🔊. Growth = scorecards saved/shared. Revenue intent = waitlist signups.
