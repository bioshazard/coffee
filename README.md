# Coffee

The cleanest lean coffee solution around. Open source and backed by Supabase.

## Inifinite Votes

Standard lean coffee gives participants 6 votes to distribute one or more to the available topics.

This solution uses infinite voting which gives every participant 1.0 vote to spread fractionally as they please.

A few benefits:

- No need to set vote max per board
- The first vote delivers the full voting weight so "unused votes" don't reduce impact

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