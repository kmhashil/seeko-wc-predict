# Seeko WC Predict (World Cup 2026 Prediction Pool)

A responsive web application designed for a WhatsApp group prediction pool. It enables members of the group to submit predictions, view the leaderboard, and allows admins to review submissions and log the final results.

## Shared Data Persistence (Shim)

This project has been modified to run as a fully static web page that requires no server-side database. It persists its shared state (submissions, confirmation status, and results) using a zero-config key-value storage service (`keyvalue.immanuel.co`) under the unique identifier `seekopredictwc_hashil_7fda7e`.
* The client-side database calls serialize the state into hex to pass safely via HTTP requests.
* Anyone loading the page (both users and admin) will interact with this shared global state.

## Running Locally

Since the project is a single, self-contained HTML page, you can run it locally by:
1. Opening `index.html` in your web browser.
2. Or serving it with any simple local HTTP server (e.g., running `python3 -m http.server` in this directory).

## Deployment (Vercel)

This application is ready to deploy to Vercel as a static site.
1. Create a repository on GitHub named `seeko-wc-predict`.
2. Push this local directory to your GitHub repository.
3. Import the repository in your [Vercel Dashboard](https://vercel.com/new).
4. Vercel will auto-deploy the site and provide a public URL. Every future push to GitHub will automatically update the live site.
