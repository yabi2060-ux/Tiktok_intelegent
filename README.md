# VELLORA

VELLORA is a local-first affiliate intelligence studio built from the provided master specification.

## Run

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Architecture

- `src/components` — cinematic UI and React Bits-inspired interaction components.
- `src/engine` — spreadsheet parsing, normalization, aggregation, report model.
- `src/templates` — report templates.
- `src/styles` — visual system and responsive rules.

The local prototype parses `.xls`, `.xlsx`, and `.csv` in the browser. Raw files are not sent to a server.

## Quick preview on phone / code editor

Open `VELLORA-preview.html` directly with your editor's Preview / Open in Browser feature. This standalone preview keeps the main visual experience and spreadsheet flow in one HTML file. It loads React, Recharts, SheetJS, html2canvas, and Babel from CDN, so the preview requires an internet connection.

The main React/Vite project remains the production/hosting version.
