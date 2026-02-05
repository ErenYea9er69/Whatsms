# 🚀 WhatsSMS Plesk Deployment Guide

Complete guide for deploying WhatsSMS to your Plesk server at **iconflow.tn**.

---

## Prerequisites

- [x] Plesk hosting with Node.js support
- [x] SSH access enabled
- [x] PostgreSQL database (you're using Neon - keep using it!)

---

## Step 1: Build the Client Locally

Open a terminal in your project folder and run:

```powershell
cd client
npm install
npm run build
```

This creates the built React app in `server/public/`.

---

## Step 2: Prepare Files for Upload

You need to upload the `server/` folder. It now contains:
- All server code
- `public/` folder with built React app
- `prisma/` folder with schema

**Files to upload:**
```
server/
├── config/
├── middleware/
├── prisma/
├── public/          ← Built React app
├── routes/
├── services/
├── utils/
├── index.js
├── package.json
├── package-lock.json
└── .env             ← You'll create this from .env.plesk
```

---

## Step 3: Upload to Plesk

### Option A: Using FTP
1. Go to Plesk → **FTP** → Get credentials
2. Connect with FileZilla or similar
3. Navigate to `/httpdocs/`
4. Upload the entire `server/` folder contents (not the folder itself)

### Option B: Using Plesk File Manager
1. Go to Plesk → **Files**
2. Navigate to `/httpdocs/`
3. Upload and extract a ZIP of the server folder

---

## Step 4: Configure Environment Variables

1. In Plesk File Manager, navigate to `/httpdocs/`
2. Create a new file called `.env`
3. Copy contents from `.env.plesk` and fill in your actual values:
   - `DATABASE_URL` - **(Required)** Connection string.
     - **Option A (Recommended):** Continue using Neon (easiest, no changes needed).
     - **Option B (Plesk DB):** If your Plesk supports **PostgreSQL**, create a DB there and use its URL.
     - *Note: This app usually requires PostgreSQL. If your Plesk only has MySQL, let me know, as we'll need to update the code.*
   - `JWT_SECRET` - **(Required)** Your secret key for user sessions
   - `WHATSAPP_*` - **(Optional)** You can leave these blank! Your users will provide their own credentials inside the app.

---

## Step 5: Install Dependencies via SSH

1. Go to Plesk → **SSH Terminal** (or use PuTTY/Terminal)
2. Navigate to httpdocs:
   ```bash
   cd ~/httpdocs
   ```
3. Install dependencies:
   ```bash
   npm install --production
   ```
4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

---

## Step 6: Configure Node.js in Plesk

### Option A: Using Plesk Node.js Extension (if available)
1. Go to Plesk → **Node.js**
2. Set Node.js version to **18** or **20**
3. Set Application root to `/httpdocs`
4. Set Application startup file to `index.js`
5. Click **Enable Node.js**

### Option B: Using PM2 (via SSH)
If Plesk doesn't have Node.js extension, you likely cannot install packages globally. Install PM2 locally instead:

```bash
cd ~/httpdocs
npm install pm2
npx pm2 start index.js --name "whatsms"
npx pm2 save
```

---

## Step 7: Configure Web Server (Missing Nginx Settings?)

If you **cannot see** the "Additional nginx directives" box in Plesk, don't worry! We can use an `.htaccess` file instead.

1.  In Plesk File Manager, go to `/httpdocs/`.
2.  Create a new file named `.htaccess` (or edit existing one).
3.  Paste this code:

    ```apache
    DirectoryIndex disabled
    RewriteEngine On
    RewriteRule ^$ http://127.0.0.1:3000/ [P,L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
    ```

4.  Save the file.


---

## Step 8: SSL Certificate

1. Go to Plesk → **SSL/TLS Certificates**
2. Click **Install** or **Get it Free** (Let's Encrypt)
3. Select your domain and install

---

## Step 9: Test the Deployment

1. Visit: `https://iconflow.tn/api/health`
   - Should return: `{"status":"ok","timestamp":"...","version":"1.0.0"}`

2. Visit: `https://iconflow.tn/`
   - Should show your login page

3. Try logging in with your credentials

---

## Troubleshooting

### App not starting?
```bash
cd ~/httpdocs
node index.js
```
Check for error messages.

### Check PM2 logs:
```bash
pm2 logs whatsms
```

### Database connection issues?
- Verify `DATABASE_URL` in `.env` is correct
- Ensure Neon database allows connections from Plesk IP

### 502 Bad Gateway?
- Node.js app isn't running - start it with PM2
- Check nginx proxy configuration

---

## Updating the App

When you make changes:

1. Build client locally: `cd client && npm run build`
2. Upload updated `server/` contents via FTP
3. SSH into server and restart:
   ```bash
   cd ~/httpdocs
   pm2 restart whatsms
   ```

---

## Remove Vercel (Optional)

Once Plesk is working:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your project
3. Go to Settings → Delete Project

You can also delete `vercel.json` from your local project if you want.
