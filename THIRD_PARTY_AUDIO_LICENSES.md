# Third-Party Audio Licenses

This file tracks every third-party audio recording bundled in Zoni Baby Tracker, its source, license, attribution requirements, and verification date. Per project policy, no recording is added to the app until its specific license has been confirmed to explicitly permit commercial app distribution and offline/embedded bundling.

## Bundled ambient/music sounds (`assets/sounds/*.wav`)

Not third party. All 11 files are original, procedurally synthesized in-house (noise, filters, envelopes, oscillators) — not sourced, sampled, recorded, or copied from any existing app, artist, or recording. No license entry required.

## Kids' Zikr — status: no audio sourced yet

The Kids' Zikr section (`src/data/zikr.ts`, `src/components/sounds/ZikrCard.tsx`) currently ships **text only** — Arabic script, transliteration, and English meaning for four phrases. **No audio file is bundled or referenced for this section.**

Research into real, licensed, child-voice Arabic recitation audio was attempted and did not yield a usable source:
- Direct license verification (fetching and reading license terms, or downloading candidate files) was not possible in the research session — outbound access to every candidate host (including `islamic.network`, `freesound.org`, `archive.org`) failed at DNS resolution.
- Web search surfaced no candidate with a confirmed commercial-embedding license. One source (Makkah Live) explicitly restricts its dhikr recordings to personal, non-commercial use. Others (SalmanSpiritual.com, Audiomack/Quranize) showed no stated license at all — absence of a stated license is not treated as permission.
- No synthesized or placeholder audio was created or substituted, per project policy against inventing religious audio or using misleading playback controls.

**Next step:** source specific, verifiable recordings (e.g., a commissioned child-voice recitation, or an existing recording whose rights holder confirms commercial app-embedding permission in writing). Once a recording is selected, add a row below with its title, creator, source URL, exact license, attribution text, and the date verified — only then will a `play` control be enabled for that phrase.

| Phrase | Title | Creator | Source URL | License | Attribution required | Verified on |
|---|---|---|---|---|---|---|
| — | *(none yet)* | — | — | — | — | — |
