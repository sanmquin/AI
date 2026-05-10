# Admin Web App

A minimal Vite-powered React + TypeScript admin page styled with Bulma.

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Netlify

This repository now uses one Netlify config: the root `netlify.toml`.

Netlify reads one config file per site by default. It will not automatically read both `netlify.toml` and a second custom TOML file. The root config builds:

- the existing main app from `webapp/`
- this admin app from `admin-webapp/`

The build output is combined into root `dist/` so both apps deploy to the same Netlify domain:

- `/` serves the main app
- `/admin/` serves this admin app

The admin Vite config sets `base: '/admin/'` so its generated assets resolve correctly from the `/admin/` path.
