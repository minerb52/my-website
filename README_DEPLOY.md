Deploying MTVHOOPS order tracker (Render / Fly / Replit)

Overview
- This project is a small Node.js + SQLite app that serves a public tracking page and an admin UI (/admin).
- Admin routes and APIs are protected with HTTP Basic Auth when ADMIN_USER and ADMIN_PASS environment variables are set.

Prepare before deploy
1. Ensure code is pushed to a Git repository (GitHub, GitLab, etc.).
2. Add environment variables in your host (ADMIN_USER, ADMIN_PASS) for admin access.

Render (recommended for simple deploy)
1. Create a new Web Service on Render and connect your repo.
2. Build command: npm install
3. Start command: npm start
4. In Render's dashboard, set environment variables ADMIN_USER and ADMIN_PASS.
5. Deploy. Render will persist files (orders.db) by default for the service.

Fly.io (Docker recommended)
1. Install Fly CLI and create an app: flyctl launch
2. Add a Dockerfile (if not using the Fly buildpacks) and set config to expose PORT.
3. Set secrets: fly secrets set ADMIN_USER=you ADMIN_PASS=secret
4. Deploy with: fly deploy

Replit
1. Import the GitHub repo to Replit or upload files.
2. Set the environment variables in Replit Secrets (ADMIN_USER, ADMIN_PASS).
3. Start the app using npm start in the Replit Run configuration.

Local testing
1. Install dependencies: npm install
2. Start: npm start
3. Set ADMIN_USER/ADMIN_PASS in your shell when testing protection:
   ADMIN_USER=admin ADMIN_PASS=secret npm start

Notes
- SQLite persistence: orders.db is stored in project root. On some ephemeral hosts (serverless), the file system is not persistent — prefer Render, Fly with volumes, or use Postgres for production.
- For production-level deployment, consider migrating to Postgres (e.g., Supabase) and using serverless functions.

If you'd like, I can:
- Add a Dockerfile tailored for Fly/Replit/Render.
- Add simple README with exact Render steps and screenshots.
- Implement migration to Postgres (Supabase) for better scalability.

Tell me which follow-up to implement.