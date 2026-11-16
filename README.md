# Ashgrove Systems — website

Single-page marketing site for Ashgrove Systems (ashgrovesystems.co.uk).

- `index.html`, `styles.css`, `script.js`, `assets/` — plain static files, no build step.
- Motion: GSAP + ScrollTrigger and Lenis, loaded from CDNs. Respects `prefers-reduced-motion`.
- Deployed on Render as a static site (see `render.yaml`): publish directory is the repo root, no build command.

## Local preview

```bash
python -m http.server 8765
```

Then open http://localhost:8765/.

## Open TODOs

Marked in amber on the page: Bite Promotions quote and hours-saved figure, phone number, LinkedIn link, and a photo to replace the monogram.
