<div align="center">

# 🎫 Code 3 Response Supply — Tickets Bot

### A sleek, production-ready Discord ticketing system
*“Your vision, our builds.”* — ELS · Imports · Buildings

**Dropdown support panel · private per-type channels · claim & close controls · saved transcripts**

<br/>

![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)
![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-E03131)

<br/>

> **Built by Buildable Labs Studio** — in affiliation with **Midland County**.

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Ticket Types](#-ticket-types)
- [Quick Start](#-quick-start)
- [Deploy on Railway](#%EF%B8%8F-deploy-on-railway)
- [Configuration](#%EF%B8%8F-configuration-reference)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [License](#-license)

---

## 🔭 Overview

A self-contained Discord bot that turns support into a clean, one-click flow: a member
picks a category from a dropdown panel, a **private channel** is created just for them and
the right team, and on close a **full transcript** is archived automatically.

No monorepo, no clutter — one bot, deploy-anywhere, built for Railway.

---

## ✨ Features

| | |
| --- | --- |
| 🎛️ **Dropdown panel** | Members choose a category; a private ticket channel opens instantly. |
| 🔒 **Private by type** | Each ticket is visible only to the opener and that type's staff team. |
| 🙋 **One per type** | Prevents duplicate-ticket spam per member. |
| ✅ **Claim & Close** | Staff claim a ticket; opener or staff close it with a confirm step. |
| 📄 **Transcripts** | A full text transcript + summary embed is posted to your log channel on close. |
| 🛠️ **Staff commands** | Hidden in-ticket `*close`, `*rename`, `*add`, `*remove`. |
| ⚡ **Slash commands** | `/ticketpanel`, `/add`, `/remove`. |
| 🎨 **Fully themeable** | Community name, brand colour, categories & staff roles — all configurable. |

---

## 🎟️ Ticket Types

| Option | What it opens | Team |
| --- | --- | --- |
| **Moderation Support** | A moderation support ticket | Moderation Team |
| **Customer Support** | A public relations ticket | Public Relations Team |
| **Custom Order** | A custom order ticket | Orders Team |
| **High Rank Support** | A line to the HR Department | HR Department |
| **2026 Expo Enrollment** | An enrollment for the 2026 Expo | Events Team |

> Labels, icons, descriptions, intros, staff roles and categories all live in
> **[`src/config.js`](src/config.js)** — retune the entire panel from one file.

---

## 🚀 Quick Start

### 1 · Create the Discord application
1. [Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. **Bot** → **Reset Token** → copy it (your `DISCORD_TOKEN`).
3. **Privileged Gateway Intents** → enable **Message Content Intent** (needed for the `*` staff commands).
4. **OAuth2 → URL Generator** → scopes `bot` + `applications.commands`; permissions: **Manage Channels**, **Manage Roles**, **Manage Messages**, **Read Message History**, **Send Messages**, **Embed Links**, **Attach Files**. Invite with the generated URL.

### 2 · Configure
```bash
cp .env.example .env
# fill in DISCORD_TOKEN, GUILD_ID, COMMUNITY_NAME, category & role IDs…
```

### 3 · Run
```bash
npm install
npm start
```

You'll see `✅ Online as <bot>`. Run **`/ticketpanel`** in your support channel and you're live.

---

## ☁️ Deploy on Railway

This repo ships Railway-ready (`railway.json` + `npm start`).

1. **New Project → Deploy from GitHub repo** → select this repository.
2. Add the **Variables** from `.env.example` (at minimum `DISCORD_TOKEN`; plus `GUILD_ID`, `COMMUNITY_NAME`, category IDs).
3. *(Optional)* Mount a **Volume** at `/data` and set `TICKETS_COUNTER_PATH=/data/ticket-counter.json` so ticket numbers survive redeploys.
4. Watch **Deploy Logs** for `✅ Online`.

> ℹ️ Railway only auto-redeploys when the GitHub trigger is connected — otherwise ship with the dashboard or `railway up`.

---

## ⚙️ Configuration Reference

| Variable | Required | Description |
| --- | :---: | --- |
| `DISCORD_TOKEN` | ✅ | Bot token from the Developer Portal. |
| `GUILD_ID` | – | Server ID — registers slash commands instantly (blank = global). |
| `COMMUNITY_NAME` | – | Name shown in the panel title & embed footers. |
| `BRAND_COLOR` | – | Embed accent as hex, e.g. `0xDC2626`. |
| `TICKETS_TRANSCRIPT_CHANNEL_ID` | – | Channel for closed-ticket transcripts. |
| `TICKETS_COUNTER_PATH` | – | Volume path so ticket numbers persist. |
| `TICKETS_<TYPE>_CATEGORY_ID` | – | Category each ticket type opens under. |
| `TICKETS_<TYPE>_ROLE_ID` | – | Staff role granted access to each type. |

`<TYPE>` ∈ `MODERATION` · `CUSTOMER` · `ORDER` · `HIGHRANK` · `EXPO`

---

## 🧭 Usage

| Action | Who | How |
| --- | --- | --- |
| Post the panel | Manage Server | `/ticketpanel` |
| Open a ticket | Anyone | Pick an option in the dropdown |
| Claim a ticket | Ticket team | **Claim** button |
| Close a ticket | Opener / team | **Close** button or `*close` |
| Rename a ticket | Team | `*rename <new name>` |
| Add / remove a member | Team | `/add` · `/remove` · `*add` · `*remove <id>` |

---

## 📁 Project Structure

```
src/
├── index.js     entry point — wires the bot, commands & handlers
├── bot.js       self-contained Discord client factory
├── config.js    community branding + the 5 ticket types   ← edit me
├── panel.js     the panel embed + dropdown
├── tickets.js   open / claim / close / transcript engine + * commands
├── commands.js  /ticketpanel, /add, /remove
└── counter.js   persistent ticket numbering
```

---

<div align="center">

### 📄 License

MIT © 2026 **Buildable Labs Studio** — built in affiliation with **Midland County**.
See [LICENSE](LICENSE).

<br/>

**Made with ⚡ by [Buildable Labs Studio](https://buildablelabs.dev)**

</div>
