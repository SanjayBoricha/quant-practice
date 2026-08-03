# Math Chapter Tracker

A single-page app for tracking how many questions you've completed in each math (quant) chapter, and for bookmarking specific question numbers you found hard so you can revisit them later.

## Features

- Pre-loaded with 20 common quant chapters (Percentage, Ratio & Proportion, Time & Work, Geometry, etc.)
- Add your own custom chapters at any time
- Increment/decrement or directly type the number of questions completed per chapter, with a progress ring
- Flag specific question numbers as "hard" per chapter, with an optional note, mark them resolved once revised, or remove them
- Data persists in MongoDB — safe across refreshes and devices
- Run locally or deploy to any platform (no vendor lock-in)
- Easily deploy frontend to GitHub Pages

## Tech Stack

- **Frontend:** [Vue 3](https://vuejs.org/) (Composition API) + [Vite](https://vitejs.dev/)
- **Styling:** [Bootstrap 5](https://getbootstrap.com/) + Bootstrap Icons with custom CSS
- **Backend:** [Express.js](https://expressjs.com/) (Node.js) for REST API
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) ORM
- **Deployment:** Frontend to [GitHub Pages](https://pages.github.com/) + Backend to any Node.js host

## 🚀 Quick Deploy to Render

```bash
npm run deploy:render
```

This interactive script will guide you through:
- Setting up GitHub repository
- Configuring Render deployment
- Setting environment variables
- Deploying to GitHub Pages

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Setup

### 1. Install dependencies and configure environment

```bash
npm install
cp .env.example .env
```

### 2. Set MongoDB connection string

Edit `.env` and add your MongoDB URI:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.r0ftut4.mongodb.net/quant-practice?retryWrites=true&w=majority
PORT=3001
```

### 3. Run locally

```bash
npm run dev
```

This starts:
- Express backend on `http://localhost:3001`
- Vite frontend on `http://localhost:5173`
- API requests proxied automatically

Or run separately:
```bash
npm run server:dev   # Terminal 1
npm run client:dev   # Terminal 2
```

## Project Structure

```
├── server.js                    # Express.js backend API  
├── db/
│   ├── index.ts                # MongoDB connection
│   └── schema.ts               # Mongoose models
├── src/
│   ├── App.vue                 # Root component
│   ├── components/ChapterCard.vue
│   ├── style.css
│   └── main.js
├── .github/workflows/
│   └── deploy.yml              # GitHub Pages deployment
├── .env.example                # Environment template
├── package.json
├── vite.config.js
└── README.md
```

## API Endpoints

### Chapters
- `GET /api/chapters` — List all
- `POST /api/chapters` — Create
- `PATCH /api/chapters` — Update
- `DELETE /api/chapters?id={id}` — Delete

### Hard Questions  
- `GET /api/hard-questions` — List all (filter: `?chapterId={id}`)
- `POST /api/hard-questions` — Create
- `PATCH /api/hard-questions` — Update
- `DELETE /api/hard-questions?id={id}` — Delete

## Deployment

### GitHub Pages (Frontend)

Set a GitHub repository secret named `VITE_API_BASE` to the deployed backend URL before pushing.

Push to `main` and it auto-deploys via GitHub Actions:
```bash
git push origin main
```

Site will be at `https://<username>.github.io/<repo>`

### Backend

Deploy to any Node.js platform:

**Render (Easiest):**
1. Go to [render.com](https://render.com)
2. New Web Service → Connect GitHub repo
3. Set `MONGODB_URI` env var
4. Deploy

**Railway, Heroku, AWS, others:** Follow their docs for Express.js deployment.

After deploying backend, connect frontend by updating `.env`:
```
VITE_API_BASE=https://your-backend-url.com
```

Then rebuild and redeploy frontend.
