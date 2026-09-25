# How to put Research Helper online (step by step)

This guide takes you from the zip file to a live website with your own link, like
`https://research-helper-yourname.vercel.app`. Everything here is **free**.

It takes about **30 to 45 minutes** the first time. Go slowly and do the steps in order.

**You will use three free services:**

| Service | What it does for you |
|---|---|
| **GitHub** | Stores your code online |
| **Neon** | Gives you a free Postgres database (stores users, libraries, notes) |
| **Vercel** | Runs your website and gives you a public link |

**Two optional extras** (the site works without them):

| Extra | What you get |
|---|---|
| **OpenAlex API key** (free) | Better search results, more abstracts, and the "free to read only" filter |
| **Anthropic API key** (paid, small cost) | Summaries written by AI instead of the built-in key-sentence summary |

---

## Part 1. Install the tools on your computer

You only do this once.

### 1.1 Install Node.js

1. Go to **https://nodejs.org**
2. Download the **LTS** version and install it (click Next, Next, Finish).
3. Check it worked. Open a terminal:
   - **Windows:** press the Windows key, type `cmd`, press Enter.
   - **Mac:** press Cmd + Space, type `Terminal`, press Enter.
4. Type this and press Enter:
   ```
   node -v
   ```
   You should see a version like `v22.x.x`. Any version **18.18 or newer** is fine.

### 1.2 Install Git

1. Go to **https://git-scm.com/downloads**
2. Download and install it. On Windows, the default options are fine.
3. Close the terminal, open a new one, and check:
   ```
   git --version
   ```
4. Tell Git your name and email (use the same email you'll use on GitHub):
   ```
   git config --global user.name "Your Name"
   git config --global user.email "you@example.com"
   ```

### 1.3 Install VS Code (recommended)

Download it from **https://code.visualstudio.com**. It's the easiest way to open the project and use a terminal inside it.

---

## Part 2. Open the project

1. Unzip `research-helper.zip`. You get a folder called `research-helper`.
2. Open VS Code, click **File, Open Folder**, and choose the `research-helper` folder.
3. Open a terminal inside VS Code: **Terminal, New Terminal**.
4. Install the project's packages:
   ```
   npm install
   ```
   Wait until it finishes (1 to 2 minutes). A warning like "2 vulnerabilities" is normal: it's inside a build tool of Next.js, not in your website.

---

## Part 3. Put your code on GitHub

### 3.1 Create a GitHub account and an empty repository

1. Go to **https://github.com** and sign up (free).
2. Click the **+** at the top right, then **New repository**.
3. Repository name: `research-helper`
4. Choose **Public** or **Private** (both work with Vercel).
5. **Don't** tick "Add a README", ".gitignore" or "license". The repository must be empty.
6. Click **Create repository**. Keep this page open.

### 3.2 Upload your code

In the VS Code terminal (inside the `research-helper` folder), run these commands one at a time.
Replace `YOUR-USERNAME` with your GitHub username.

```
git init
git add .
git commit -m "First version of Research Helper"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/research-helper.git
git push -u origin main
```

The first time you push, a window asks you to log in to GitHub. Log in and allow access.

Refresh the GitHub page. You should see all the project files.

> **Safety check:** you should **not** see a file called `.env.local` on GitHub. It holds your secrets, and the `.gitignore` file keeps it private. Never upload passwords or keys.

---

## Part 4. Create the free database on Neon

1. Go to **https://neon.tech** and click **Sign up**. Signing up with GitHub is the easiest.
2. Create a project:
   - **Project name:** `research-helper`
   - **Postgres version:** leave the default
   - **Region:** choose **AWS US East (N. Virginia)**. Vercel runs your site in the same area by default, so the site stays fast. (For a faster site in Asia, see "Make it faster for users in Asia" at the end.)
3. Click **Create project**.
4. On the project dashboard, click **Connect**.
5. Make sure **Connection pooling** is turned **on**, then copy the connection string. It looks like this:
   ```
   postgresql://neondb_owner:AbC123xyz@ep-cool-name-123456-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
6. Paste it into a Notepad file for now. This is your **DATABASE_URL**.

> This string contains your database password. Don't share it or post it anywhere.

You don't need to create any tables. The website creates them by itself every time it is deployed.

---

## Part 5. Make a secret key for logins

The site needs a long random password to protect login sessions. In the VS Code terminal, run:

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

It prints something like `q8Zb3kR1...`. Copy it into your Notepad file. This is your **NEXTAUTH_SECRET**.

(Or open **https://generate-secret.vercel.app/32** and copy the text it shows.)

---

## Part 6 (optional). Get the extra keys

### 6.1 OpenAlex key (free, recommended)

1. Go to **https://openalex.org** and create a free account.
2. Open **https://openalex.org/settings/api** and copy your API key.
3. Save it in Notepad as **OPENALEX_API_KEY**.

Without this key, search uses Crossref instead. It still works, but fewer papers have abstracts and the "free to read only" filter is ignored.

### 6.2 Anthropic key (optional, costs a little)

1. Go to **https://console.anthropic.com**, sign up, and add a small amount of credit.
2. Create an API key and save it as **ANTHROPIC_API_KEY**.

Without this key, the "Summarize abstract" button still works. It picks the most important sentences from the abstract instead of writing a new summary.

---

## Part 7. Put the website online with Vercel

1. Go to **https://vercel.com** and click **Sign Up**.
2. Choose the **Hobby** plan (free) and **Continue with GitHub**.
3. On your Vercel dashboard, click **Add New…**, then **Project**.
4. Find `research-helper` in the list and click **Import**.
   - Don't see it? Click **Adjust GitHub App Permissions** and give Vercel access to the repository.
5. On the **Configure Project** page:
   - **Framework Preset:** Next.js (Vercel detects it by itself)
   - **Root Directory:** leave as `./`
   - **Build and Output Settings:** leave everything as it is
6. Open **Environment Variables** and add these one by one (type the **Key**, paste the **Value**, click **Add**):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Your Neon connection string from Part 4 |
   | `NEXTAUTH_SECRET` | Your secret from Part 5 |
   | `ADMIN_EMAIL` | **Your** email. You will sign up with this to become admin |
   | `CONTACT_EMAIL` | Your email again |
   | `OPENALEX_API_KEY` | Your OpenAlex key (skip if you don't have one) |
   | `ANTHROPIC_API_KEY` | Your Anthropic key (skip if you don't have one) |

   > **Don't add `NEXTAUTH_URL` on Vercel, not even with an empty value.** It's only for running on your own computer. Vercel works out the address by itself. Also skip the optional keys you don't have instead of adding them empty.

7. Click **Deploy**.
8. Wait 1 to 3 minutes. If you open the build log, you should see:
   ```
   ✓ Settings look good.
   ✓ Database tables are ready.
   ```
   That means your site connected to Neon and created the tables.
9. When you see the "Congratulations" screen, click **Continue to Dashboard**, then click **Visit**.

🎉 Your website is live. Copy the link at the top of the dashboard (it ends in `.vercel.app`) and share it.

---

## Part 8. Make yourself the admin

1. Open your website and click **Sign up**.
2. Sign up with **exactly the same email** you put in `ADMIN_EMAIL`.
3. You'll see the message "Account created. You are the admin."
4. Click your name at the top right. You'll see **Admin panel**.

### Try each role (good for showing your teacher)

| Role | How to see it |
|---|---|
| **Visitor** | Log out, or open the site in a private (incognito) window. You can search and cite, but "Save to library" asks you to log in. |
| **User** | Sign up with a **different** email. You get Dashboard, Library and Compare, but no Admin link. Typing `/admin` in the address bar sends you back to the dashboard. |
| **Admin** | Your `ADMIN_EMAIL` account. Open **Admin panel** to see statistics, users, featured papers and announcements. |

### Things to try as admin

- **Feature a paper:** search for a topic, open a paper, and click **Feature on home page** in the Admin box. It appears on the home page under "Picked by the editors".
- **Post an announcement:** Admin panel, **Announcements**. It shows at the top of the home page and on everyone's dashboard.
- **Manage users:** Admin panel, **Users**. Make someone an admin, suspend them (they can't log in), or delete them.

---

## Part 9. Update your website later

Every time you push code to GitHub, Vercel rebuilds your site automatically.

After you change some code, run:

```
git add .
git commit -m "Describe what you changed"
git push
```

Wait about 2 minutes and refresh your site.

**Changed an environment variable on Vercel?** It only takes effect after a new deployment:
go to your project, **Deployments**, click the **⋯** next to the newest one, and choose **Redeploy**.

---

## Part 10 (optional). Use your own domain name

If you own a domain (for example `myresearch.com`):

1. In Vercel, open your project, then **Settings, Domains**.
2. Type your domain and click **Add**.
3. Vercel shows the DNS records to add at the company where you bought the domain. Add them and wait (from a few minutes up to a day).

The free `.vercel.app` link keeps working too.

---

## Part 11 (optional). Run the site on your own computer

Useful when you want to change the code and see the result before uploading.

1. Make a copy of `.env.example` and name it `.env.local`:
   - **Mac / Linux:** `cp .env.example .env.local`
   - **Windows:** `copy .env.example .env.local`
2. Open `.env.local` and fill in:
   - `DATABASE_URL`: your Neon string. Tip: in Neon you can create a **branch** called `dev` and use its connection string, so testing doesn't touch your real users.
   - `NEXTAUTH_SECRET`: any long random text
   - `NEXTAUTH_URL`: keep it as `http://localhost:3000`
   - `ADMIN_EMAIL`: your email
3. Create the tables and start the site:
   ```
   npm run db:migrate
   npm run dev
   ```
4. Open **http://localhost:3000** in your browser. Stop the site with **Ctrl + C** in the terminal.
5. Optional: create demo accounts to show the project quickly:
   ```
   npm run seed
   ```
   This makes `admin@demo.com` and `user@demo.com`, both with the password `demo1234`.
   **Delete these accounts** (Admin, Users) before you share a live site, because anyone who reads this guide knows the password.

---

## Troubleshooting

**The build fails with "Error occurred prerendering page" and "TypeError: Invalid URL" (with `input: ''`).**
Your Vercel project has a `NEXTAUTH_URL` variable with an **empty** value. Vercel doesn't need `NEXTAUTH_URL` at all.
1. Open your project on Vercel, then **Settings, Environment Variables**.
2. Find `NEXTAUTH_URL`, click the **⋯** next to it, and choose **Remove** (or **Delete**).
3. Go to **Deployments**, click the **⋯** next to the newest deployment, and choose **Redeploy**.

Newer versions of this project check for this before building and print "Settings problem found before building" with the fix.

**The build fails with "Settings problem found before building".**
Read the numbered lines under it. Each one says which variable is wrong and what to do. Fix it in **Settings, Environment Variables**, then **Redeploy**.

**The Vercel build fails with "DATABASE_URL is not set".**
You didn't add `DATABASE_URL`, or there's a typo in the name. Add it in **Settings, Environment Variables**, then **Redeploy**.

**The build fails with "Database setup failed: password authentication failed".**
The connection string is wrong or incomplete. Copy it again from Neon (click **Connect**) and replace the old value. Make sure you copied the whole line.

**The build fails with a timeout or "connect ETIMEDOUT".**
Neon may have paused your database. Open the Neon dashboard (this wakes it up) and redeploy.

**A page says "Something went wrong on this page".**
In Vercel, open your project and click **Logs**. The red lines tell you what failed. Most often it's a database setting.

**I log in, but I'm sent back to the login page.**
Check that `NEXTAUTH_SECRET` is set on Vercel, and that you did **not** add `NEXTAUTH_URL` there. Redeploy after fixing. (Using your own domain and still stuck? Add `NEXTAUTH_URL` with your full domain, like `https://myresearch.com`, then redeploy.)

**I signed up but I'm not admin.**
The email didn't match `ADMIN_EMAIL` exactly (check for typos or spaces), or you signed up before adding it. Fix it in the database:
1. Open your project on **neon.tech** and click **SQL Editor**.
2. Run this (with your email):
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
   ```
3. On your site, log out and log in again.

**Search says "The paper databases didn't answer".**
The free databases are sometimes busy. Wait a minute and try again. Adding `OPENALEX_API_KEY` and `CONTACT_EMAIL` makes search much more reliable.

**Search results have few abstracts, and "free to read only" is ignored.**
You're using Crossref because there's no OpenAlex key. Add `OPENALEX_API_KEY` (Part 6.1) and redeploy.

**`git push` asks for a password and rejects it.**
GitHub doesn't accept your account password there. Let the login window open in the browser, or install **GitHub Desktop** (https://desktop.github.com) and publish the folder from there.

**Someone forgot their password.**
This version has no "forgot password" email. The person can create a new account, or you can delete the old account in **Admin, Users** so they can sign up again with the same email.

---

## Make it faster for users in Asia (optional)

By default both Neon (US East) and Vercel run in the USA. If most of your users are in South or Southeast Asia, you can move both to **Singapore**:

1. Create a new Neon project in the region **AWS Asia Pacific (Singapore)** and use its connection string as `DATABASE_URL`.
2. Create a file called `vercel.json` in the project folder with this content:
   ```json
   {
     "regions": ["sin1"]
   }
   ```
3. Push it to GitHub. Vercel will run your site in Singapore from the next deployment.

Always keep the database and the website in the **same** region. If they're far apart, every page has to wait for the data to cross the world.

---

## Summary checklist

- [ ] Node.js and Git installed
- [ ] `npm install` done
- [ ] Code pushed to GitHub (without `.env.local`)
- [ ] Neon database created, pooled connection string copied
- [ ] `NEXTAUTH_SECRET` generated
- [ ] Vercel project imported with `DATABASE_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, `CONTACT_EMAIL` (plus optional keys)
- [ ] Build log shows "✓ Database tables are ready."
- [ ] Signed up with `ADMIN_EMAIL` and can see the Admin panel
- [ ] Tested as visitor, user and admin
