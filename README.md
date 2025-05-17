# Coffee

The cleanest lean coffee solution around. Open source and backed by Supabase.

## Eight Votes

Each participant gets eight votes to distribute among the available topics.

Votes on a card simply add up and whoever has the most votes floats to the top when sorting by votes.

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Developer Guide

Reference: https://supabase.com/docs/guides/cli/local-development

- Clone repo and enter folder
- Install dependencies: `npm install`
- Start local supabase: `npx supabase start`, note the URLs and keys output.
- Reset database to apply `/supabase/migrations`: `npx supabase db reset`
- Copy `/env.dist` to `/.env.local`, replace in `API URL` and `anon key`
- Start edge functions service: `npx supabase functions serve --env-file ./supabase/env.local.dist`
- Start app in second terminal: `npm run dev`