# B.A.B.S. Deployment Guide

## Quick Start: Deploy to GitHub Pages (Recommended - FREE)

### Prerequisites
- A GitHub account (create one at https://github.com/signup if you don't have one)
- Git installed on your computer (check by running `git --version` in terminal)

### Step 1: Initialize Git Repository (Already done!)
Your files are ready to go!

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `babs-dice-roller` (or any name you prefer)
3. Description: "Balanced Algorithmic Blocking System - Intelligent Dice Roller"
4. Choose **Public** (required for free GitHub Pages)
5. **DO NOT** check "Add a README file" (we already have one)
6. Click "Create repository"

### Step 3: Push Your Code to GitHub

Run these commands in your terminal (in the dice-counter folder):

```bash
# Initialize git
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - B.A.B.S. dice roller"

# Add your GitHub repository as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/babs-dice-roller.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Click "Pages" in the left sidebar
4. Under "Source", select "main" branch
5. Click "Save"
6. Wait 1-2 minutes for deployment

Your site will be live at: `https://YOUR_USERNAME.github.io/babs-dice-roller/`

---

## Option 2: Deploy to Netlify (Easiest - Drag & Drop)

### Steps:
1. Go to https://app.netlify.com/drop
2. Drag your entire `dice-counter` folder onto the page
3. Done! You'll get a URL like `https://random-name-12345.netlify.app`

### To add a custom domain on Netlify:
1. Click "Domain settings"
2. Click "Add custom domain"
3. Follow the DNS configuration instructions

---

## Option 3: Deploy to Vercel

### Steps:
1. Go to https://vercel.com/new
2. Import your GitHub repository (or drag & drop files)
3. Click "Deploy"
4. Done! You'll get a URL like `https://babs-dice-roller.vercel.app`

---

## Adding a Custom Domain (e.g., babs-dice.com)

### Step 1: Buy a Domain
Popular registrars:
- **Namecheap** (https://www.namecheap.com) - ~$10-15/year
- **Google Domains** (https://domains.google) - ~$12/year
- **Cloudflare** (https://www.cloudflare.com/products/registrar/) - At-cost pricing (~$8-10/year)
- **GoDaddy** (https://www.godaddy.com) - ~$12-20/year

### Step 2: Configure DNS

#### For GitHub Pages:
1. In your domain registrar's DNS settings, add these records:
   - Type: `A`, Name: `@`, Value: `185.199.108.153`
   - Type: `A`, Name: `@`, Value: `185.199.109.153`
   - Type: `A`, Name: `@`, Value: `185.199.110.153`
   - Type: `A`, Name: `@`, Value: `185.199.111.153`
   - Type: `CNAME`, Name: `www`, Value: `YOUR_USERNAME.github.io`

2. In GitHub repository settings → Pages:
   - Enter your custom domain (e.g., `babs-dice.com`)
   - Check "Enforce HTTPS" (after DNS propagates)

#### For Netlify:
1. In Netlify dashboard → Domain settings
2. Click "Add custom domain"
3. Follow the instructions to update your DNS records

#### For Vercel:
1. In Vercel dashboard → Settings → Domains
2. Add your domain
3. Follow the DNS configuration instructions

### Step 3: Wait for DNS Propagation
- Usually takes 5 minutes to 48 hours
- Check status at: https://www.whatsmydns.net

---

## Recommended Domain Names

Here are some available domain suggestions:
- `babs-dice.com`
- `balanced-dice.com`
- `smartdice.app`
- `babs-roller.com`
- `dice-babs.com`

Check availability at: https://www.namecheap.com/domains/domain-name-search/

---

## Need Help?

If you run into any issues, let me know and I'll help you troubleshoot!

