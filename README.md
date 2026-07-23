# Pixel Hutch Website and Business Hub

This repository contains the complete Pixel Hutch public website, employee
Business Hub, and client portal.

## Included

- Public marketing website
- Employee login and role-based Business Hub
- Client portal
- Leads, customers, projects, tasks, schedules, and timecards
- Estimates, invoices, payments, and reports
- Messaging and project files
- Settings, service pricing, access management, and test mode
- Privacy Policy and Terms pages

## Technology

- React 19
- Next.js 16
- Vinext/Vite
- TypeScript
- Cloudflare D1 with Drizzle ORM
- Cloudflare R2-compatible file storage
- Optional Resend email delivery

## Upload to GitHub

1. Extract the ZIP.
2. Create a new empty repository on GitHub.
3. Open the extracted folder in VS Code.
4. In the VS Code terminal, run:

```bash
git init
git add .
git commit -m "Initial Pixel Hutch website and Business Hub"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Do not add a README, license, or `.gitignore` when creating the empty GitHub
repository, because this project already includes them where needed.

## Run locally

Requirements:

- Node.js 22.13 or newer
- npm

Install and start the development server:

```bash
npm install
npm run dev
```

The application will use locally simulated database and storage bindings during
development.

## Environment variables

Copy `.env.example` to `.env.local` only when email delivery is needed:

```bash
cp .env.example .env.local
```

Add the Resend API key to `.env.local`. Environment files are excluded from
Git, so secrets are not uploaded to GitHub.

## Database

The schema is in `db/schema.ts`, and database migrations are in `drizzle/`.
The application expects a D1 binding named `DB`.

## File storage

Uploads expect an R2-compatible storage binding named `BUCKET`.

## Deployment note

This project is currently configured for the ChatGPT Sites/Cloudflare runtime.
Uploading it to GitHub preserves the full source and gives you version control,
but GitHub itself does not run the application.

The public pages could be converted for Netlify, but the Business Hub also
needs a production database, object storage, authentication headers, and server
routes. Keep the current hosted version online until those services are
intentionally migrated.

## Useful commands

```bash
npm run dev
npm run lint
npm run build
npm test
npm run db:generate
```
