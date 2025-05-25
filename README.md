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
## Supabase manual push

Follow these steps when you need to apply changes to the hosted database without the CI pipeline.

1. Start the local stack with `npx supabase start` (uses Docker Compose).
2. Apply migrations locally and verify everything still works:
   ```bash
   npx supabase db reset
   npm run build
   ```
3. Export a backup of the remote database before modifying it:
   ```bash
   npx supabase db dump --db-url <remote-db-url> > supabase/backup.sql
   ```
4. Generate a new migration from your local schema:
   ```bash
   npx supabase db diff --schema public --file supabase/migrations/$(date +%Y%m%d%H%M%S)_manual.sql
   ```
5. Test the migration locally with `npx supabase db reset`.
6. Push the migration to production:
   ```bash
   npx supabase db push --db-url <remote-db-url>
   ```
7. Optionally pull down the remote schema afterwards so local and remote stay in sync:
   ```bash
   npx supabase db pull --db-url <remote-db-url>
   ```

