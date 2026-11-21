# Vice Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/miologalo/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/miologalo/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

**Vice Cover Studio** turns your photo and a caption into GTA-style poster cover art — the multi-panel key-art look with bold lettering and a Vice City sunset or neon colour grade — and exports it as a PNG to share. It runs **offline in a desktop browser from its own static files**: photos never leave your machine.

Built for the [make.fun GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01) (`gta6-cover-art-01`).

## How it works

1. **Upload a photo** (or try a built-in sample) — up to 3 photos, one per panel or one filling them all.
2. **Pick a layout** — Trio (hero + two panels), Duo, Quad, or Hero — then click a panel in the live preview to select it, **drag to reposition** the photo inside it and **scroll to zoom**.
3. **Pick a colour grade** — Vice Sunset, Neon Nights, Palm Noir, Golden Hour — plus halftone dots, film grain and light/dark gutters.
4. **Write the caption** — big condensed gradient title with a neon rule and subtitle, in four title styles.
5. **Export PNG** in 1080 × 1080, 1080 × 1350 or 1920 × 1080.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests: `app/index.html` and everything it loads live under `app/`.

## Originality

Everything is original: the renderer, lettering and sample illustration are drawn in code. No Rockstar Games logo, artwork or fonts are used. The two kit sample photos (`app/samples/boulevard.jpg`, `app/samples/pier.jpg`) were made for make.fun and are free to use; the third sample (`sunset-figure.jpg`) is an original illustration drawn for this entry.

## Layout

- `main.ts` — the entry program: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`
- `app/index.html`, `app/style.css` — the editor page
- `app/src/cover.js` — the cover renderer (panels, grades, halftone, lettering)
- `app/src/editor.js` — editor state, photo loading, drag/zoom, PNG export
- `app/src/main.js` — bootstrap
- `screenshots/` — the app with a photo loaded, and covers it exported

## License

MIT — see [LICENSE](LICENSE).
