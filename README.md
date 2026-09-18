# 🎤 PitchCoach — your AI investor, in your pocket

**Say your startup pitch out loud. Get scored like a YC partner would. Hear it rewritten — in your own voice.**

Built in one hour at [OSS4AI: Build an AI Startup in One Day](https://luma.com/oss4ai-fdvg) · Voice AI Track

> 👉 **Live demo:** https://saurabhkaran11.github.io/pitchcoach/ — no signup. Hit **▶ Try a demo pitch** to see it work in 5 seconds.

---

## The problem

Founders practice their pitch in the mirror. The mirror doesn't tell you your hook is weak, you said "um" nine times, or that you never actually asked for money. Real feedback only comes from investors — and by then it's too late.

## What PitchCoach does

1. **You talk.** Tap the orb and pitch. A live coach shows your time, words-per-minute and filler-word count *while you speak*, with a "wrap it up" nudge at 45 seconds.
2. **An AI investor scores you** on the five things that matter: **Hook · Clarity · Problem · Solution · Ask.** Pick who judges you — YC partner, Shark Tank shark, friendly angel, or brutal VC.
3. **It rewrites your pitch** into a tight 30-second version.
4. **You hear it back in *your own voice*.** We clone your voice from the recording you just made, so the rewrite sounds like you — not a robot.
5. **Face the hardest question.** The investor asks the one question that would kill your deal. You answer out loud. It grades your answer.
6. **Pitch again.** Every attempt is tracked — see your score go up. Confetti at 8+.

## Why this wins

- **Real voice AI, not a chatbot with a mic.** Speech in, cloned speech out, live coaching in between.
- **The "wow" is instant.** Hearing your own voice deliver a better version of your pitch is something people remember.
- **Zero friction.** One HTML file. No install, no backend, no account. Works on a phone.
- **Built on the sponsors' stack:**
  - **Boson AI — Higgs TTS 3** for speech and one-shot voice cloning (`ref_audio`)
  - **Nebius Token Factory** for the investor brain (scoring, rewrite, Q&A)

## Try it in 60 seconds

1. Open the live link in **Chrome** (mic + speech recognition).
2. Tap **▶ Try a demo pitch** — see scoring, feedback and rewrite with no keys.
3. For the full experience, open *Model settings* and paste a Nebius key + Boson key. Then tap the orb and pitch.

## How it's built

| Piece | Tech |
|---|---|
| Speech → text, live waveform, WPM & filler detection | Browser Web Speech + Web Audio APIs |
| Investor scoring, rewrite, hardest question, answer grading | Nebius LLM (OpenAI-compatible) |
| Rewrite read back in your cloned voice · question spoken aloud | Boson AI Higgs TTS 3 |
| Attempt history, sparkline, shareable PNG scorecard | localStorage + canvas |

Everything is in `index.html`. ~250 lines. No dependencies.

## The business

| | |
|---|---|
| **Who pays** | Founders raising a round (~500K new startups/yr in the US alone), accelerator cohorts, university pitch competitions, sales teams practicing demos |
| **Pricing** | Free: 3 pitches/day. **Pro $12/mo:** unlimited, voice clone, investor Q&A, team mode. **Accelerator $99/mo:** cohort dashboard |
| **Go-to-market** | Every scorecard is a shareable PNG → founders post their score on X/LinkedIn → free viral loop. Partner with accelerators for Demo Day prep |
| **Cost to serve** | ~$0.02 per pitch (Nebius 70B + Boson TTS). 98% gross margin at Pro pricing |
| **Moat** | Attempt history + your cloned voice = switching cost. Every pitch scored makes the coach better |

Already in the app: free-tier limit, Pro waitlist, privacy note, sponsor defaults prefilled.

## Judging criteria — how we map

| Criterion | PitchCoach |
|---|---|
| **Innovation** | First pitch coach that answers back in *your own voice*. Live coaching HUD while you speak, not after |
| **Technical execution** | Full voice loop (STT → LLM → voice-cloned TTS) + investor Q&A in a single dependency-free HTML file, working on phone and desktop |
| **Use of sponsor tech** | Boson Higgs TTS 3 (speech + one-shot voice clone), Nebius Token Factory (all reasoning) — both core, not decorative |
| **Business viability** | Clear buyer, pricing, $0.02 cost per pitch, built-in viral loop via shareable scorecards |
| **Demo / presentation** | Works with zero setup (▶ demo button). 60-second wow: pitch → score → hear yourself improved |
| **Completeness** | Live at the link above. Error handling, mobile layout, free tier, waitlist — shippable today |

## What's next

- Multi-round Q&A that gets harder as you improve
- Team mode: pitch to your co-founders' cloned voices
- Deck outline generated from the winning pitch

---

Made by [Saurabh Karan](https://github.com/Saurabhkaran11) · OSS4AI Hackathon
