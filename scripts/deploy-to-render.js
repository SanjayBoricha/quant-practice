#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}\n`),
};

const runCommand = (command, args = [], options = {}) => {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit', ...options });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
      }
    });
  });
};

const fileExists = (filePath) => fs.existsSync(filePath);

async function checkPrerequisites() {
  log.title('📋 Checking Prerequisites');

  // Check for .env file
  if (!fileExists('.env')) {
    log.warn('.env file not found. Creating from .env.example...');
    if (fileExists('.env.example')) {
      fs.copyFileSync('.env.example', '.env');
      log.success('.env created from .env.example');
      log.info('Please edit .env with your MongoDB URI and other settings.');
    } else {
      log.error('.env.example not found!');
    }
  } else {
    log.success('.env file exists');
  }

  // Check for git
  try {
    await runCommand('git', ['--version']);
  } catch (e) {
    log.error('Git is not installed or not in PATH');
    process.exit(1);
  }
}

async function setupGitHub() {
  log.title('🐙 GitHub Setup');

  // Check if git is initialized
  if (!fileExists('.git')) {
    log.info('Git repository not found. Initializing...');
    await runCommand('git', ['init']);
    await runCommand('git', ['add', '.']);
    await runCommand('git', ['commit', '-m', 'Initial commit - MongoDB + Express migration']);
    log.success('Git repository initialized and committed');
  } else {
    log.success('Git repository already initialized');
  }

  log.info('Next steps:');
  console.log(`
  1. Create a new repository on GitHub (https://github.com/new)
  2. Run these commands to push your code:
  
     ${colors.yellow}git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git${colors.reset}
     ${colors.yellow}git branch -M main${colors.reset}
     ${colors.yellow}git push -u origin main${colors.reset}
  
  3. Return here once your code is pushed to GitHub.
  `);
}

async function displayRenderDeployment() {
  log.title('🚀 Render Deployment Guide');

  console.log(`
${colors.bright}Automatic Deployment (Recommended):${colors.reset}
1. Go to ${colors.blue}https://render.com/dashboard${colors.reset}
2. Click ${colors.bright}"New +"${colors.reset} → ${colors.bright}"Web Service"${colors.reset}
3. Select ${colors.bright}"Connect a repository"${colors.reset}
4. Choose your GitHub repository (quant-practice)
5. Fill in the deployment settings:

   ${colors.yellow}Name:${colors.reset} quant-practice-api
   ${colors.yellow}Environment:${colors.reset} Node
   ${colors.yellow}Region:${colors.reset} Oregon (or your preference)
   ${colors.yellow}Branch:${colors.reset} main
   ${colors.yellow}Build Command:${colors.reset} npm install
   ${colors.yellow}Start Command:${colors.reset} npm run server:start

6. Click ${colors.bright}"Advanced"${colors.reset} and add environment variables:

   ${colors.yellow}MONGODB_URI${colors.reset} = mongodb+srv://...
   ${colors.yellow}PORT${colors.reset} = 3001
   ${colors.yellow}NODE_ENV${colors.reset} = production

7. Click ${colors.bright}"Create Web Service"${colors.reset}}
8. Wait for deployment to complete
9. Copy your Render URL (e.g., https://quant-practice-api.onrender.com)

${colors.bright}Deploy Frontend to GitHub Pages:${colors.reset}
1. Update your .env with the Render backend URL:
   
   ${colors.yellow}VITE_API_BASE=https://your-render-app.onrender.com${colors.reset}

2. Add GitHub Action secret in repo settings:
   Settings → Secrets and variables → Actions → New repository secret:
   
   ${colors.yellow}Name:${colors.reset} VITE_API_BASE
   ${colors.yellow}Value:${colors.reset} https://your-render-app.onrender.com

3. Push to main branch:
   
   ${colors.yellow}git push origin main${colors.reset}

4. GitHub Actions will automatically build and deploy to Pages
5. Your site will be available at:
   ${colors.blue}https://your-username.github.io/quant-practice${colors.reset}

${colors.bright}Troubleshooting:${colors.reset}
- If backend won't start, check logs in Render dashboard
- Make sure MongoDB URI is correct and whitelisted
- For GitHub Pages custom domain, see repo Settings → Pages

  `);
}

async function createRenderYaml() {
  log.title('📝 Creating render.yaml');

  const renderYaml = `services:
  - type: web
    name: quant-practice-api
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm run server:start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false  # Set this manually in Render dashboard
      - key: PORT
        value: 3001
`;

  fs.writeFileSync('render.yaml', renderYaml);
  log.success('Created render.yaml - this file helps with Render deployments');
}

async function main() {
  console.log(`
${colors.bright}${colors.blue}
╔════════════════════════════════════════╗
║     Render Deployment for Quant        ║
║           Practice Tracker             ║
╚════════════════════════════════════════╝
${colors.reset}
  `);

  try {
    await checkPrerequisites();
    await setupGitHub();
    await createRenderYaml();
    await displayRenderDeployment();

    log.success('Setup complete! Follow the steps above to deploy to Render.');
    console.log(`
${colors.bright}Need help?${colors.reset}
- Render Docs: https://render.com/docs
- GitHub Pages: https://pages.github.com
- Report issues: Check your repository's GitHub Actions logs
    `);
  } catch (error) {
    log.error(error.message);
    process.exit(1);
  }
}

main();
