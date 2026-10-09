# AWS test app

A tiny Node.js + PostgreSQL app for testing AWS hosting (Lightsail).
The page shows whether the web server and the database are working,
and lets you save and delete notes in the database.

## Files

- `server.js` – web server, API, and database connection
- `public/index.html` – the web page
- `.env.example` – database settings template (copy to `.env` on the server)

## Run on a Lightsail Ubuntu server

```bash
# 1. Install Node.js and git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

# 2. Get the code
git clone https://github.com/YOUR-USERNAME/aws-test-app.git
cd aws-test-app
npm install

# 3. Add database settings
cp .env.example .env
nano .env        # fill in DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

# 4. Run it permanently with pm2
sudo npm install -g pm2
pm2 start server.js --name aws-test-app
pm2 save
pm2 startup      # run the command it prints, so the app restarts after reboot
```

Open `http://YOUR-STATIC-IP:3000` in a browser.

## Updating after code changes

```bash
cd aws-test-app
git pull
npm install
pm2 restart aws-test-app
```

## Useful commands

```bash
pm2 logs aws-test-app     # see errors
pm2 status                # is it running?
```
