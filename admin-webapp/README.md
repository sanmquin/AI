# Admin Web App

A Vite-powered React + TypeScript admin console styled with Bulma. The app provides a responsive operations dashboard with metric cards, a review queue, service health indicators, and an audit trail.

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Netlify

The repository includes `netlify.admin.toml` at the repo root for deploying this app as a separate Netlify site:

```bash
netlify deploy --config netlify.admin.toml --build
```

Use `--prod` when promoting a verified deploy to production.
