# Set up Pure Conscious Healing on your own PC

This guide gets both websites and the Admin Panel running **on your computer** in Docker, as a project separate from your other containers (such as Indigram).

You need about 20 minutes and an internet connection for the first build.

---

## Step 0. What you need installed

| Tool | Why | Download |
|---|---|---|
| **Docker Desktop** | Runs the website and its database | You already have it (Indigram runs in it) |
| **Git** (optional) | Easiest way to get updates later | https://git-scm.com/downloads |
| **VS Code** or **Claude Code** (optional) | To open and edit the project folder | https://code.visualstudio.com · https://claude.com/claude-code |

You do **not** need Node.js or PostgreSQL. Docker provides both.

---

## Step 1. Put the project in a folder on your PC

Pick **one** of these:

### Option A: Download the zip (no Git needed)
1. Download `PCH_AI_Agent.zip` from the chat.
2. Create a folder, for example `C:\Projects\` on Windows or `~/Projects/` on Mac.
3. Right-click the zip and choose **Extract All**, into that folder.
4. You should now have `C:\Projects\PCH_AI_Agent\` containing `compose.yaml`, `Dockerfile`, `README.md`, `src\` and so on.

### Option B: Clone from GitHub (best for updates)
Open **PowerShell** on Windows or **Terminal** on Mac:
```bash
cd C:\Projects            # or: cd ~/Projects
git clone https://github.com/Priyanshu-306/PCH_AI_Agent.git
cd PCH_AI_Agent
git checkout build/v1
```

---

## Step 2. Open a terminal *inside* the project folder

- **Windows:** open the `PCH_AI_Agent` folder in File Explorer. Click the address bar, type `powershell` and press Enter.
- **Mac:** in Terminal, type `cd ` (with a space), drag the folder onto the window, then press Enter.

Check that you're in the right place:
```bash
dir        # Windows   (or: ls  on Mac)
```
The list should include `compose.yaml`.

---

## Step 3. Build and start (one command)

Make sure Docker Desktop is open, then run:
```bash
docker compose up -d --build
```

- The first time takes about **5–10 minutes**: it downloads Node.js and Postgres and builds the site.
- When it finishes, Docker Desktop shows a new group, **pure-conscious-healing**, with two containers:
  - `web`: the websites and admin
  - `db`: its own private database, not shared with Indigram
- Wait until both show a **green** dot, about 30 seconds after the build.

---

## Step 4. Open the websites (use Chrome or Edge)

| What | Address |
|---|---|
| Pure Conscious Healing | http://localhost:3005 |
| Pure Crystal Hub (shop) | http://shop.localhost:3005 |
| Admin Panel | http://localhost:3005/admin |

**Admin login:** `owner@pch.local` / `ChangeMe@123`. Change the password in Admin › Staff & roles.

Things to try:
- Book a session. Payment uses a **simulated Razorpay** window, so no real money is involved.
- Add crystals to the cart and check out with cash on delivery.
- In the Admin, look at Dashboard, Analytics, and the Content editor (change a headline and refresh the site).
- Upload photos and videos in Admin › Media library.
- Import products from `templates/PCH_Import_Template.xlsx` in Admin › Products › Import Excel.

---

## Everyday use

| I want to… | Do this |
|---|---|
| Stop it | Click ■ next to **pure-conscious-healing** in Docker Desktop, or run `docker compose stop` |
| Start it again | Click ▶ in Docker Desktop, or run `docker compose start` |
| Get the latest version (Git) | `git pull` then `docker compose up -d --build` |
| Get the latest version (zip) | Extract the new zip **over** the old folder, then `docker compose up -d --build` |
| See what's happening | `docker compose logs -f web` (Ctrl+C to exit) |

Stopping and restarting **keeps** your data: products, bookings, uploads and admin edits.

> ⚠️ Never run `docker compose down -v` unless you want to **delete** the database and all uploaded media.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `port is already allocated` | Another app uses 3005. PowerShell: `$env:APP_PORT=4000; docker compose up -d`. Mac: `APP_PORT=4000 docker compose up -d`. Then use port 4000 in the addresses. |
| `no configuration file provided` | You're not inside the project folder. Repeat Step 2. |
| `shop.localhost` doesn't open | Use Chrome or Edge. For Safari, add `127.0.0.1 shop.localhost` to your hosts file. |
| Page shows an error right after starting | Wait until `web` is green (healthy), then refresh. |
| Build fails while downloading | Check your internet connection and run `docker compose up -d --build` again. |
| Anything else | Run `docker compose logs web`, copy the output and paste it to Claude. |

---

## Working on it with Claude on your PC

1. Install **Claude Code** (desktop app or terminal).
2. Open the `PCH_AI_Agent` folder as the project. In the desktop app, choose **Local** and select the folder.
3. Claude reads `CLAUDE.md` in the folder automatically. It contains the full project memory: decisions, architecture, status and next steps.
4. Ask for what you want, for example: *"Replace the hero video with media/studio.mp4"* or *"Change the shop colours"*.

To edit code with live reload instead of Docker, see `README.md` › *Option B: Node.js directly*.
