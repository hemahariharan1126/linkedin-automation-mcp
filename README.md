<div align="center">
  
# 🚀 LinkedIn Automation MCP Server

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000)](https://github.com/hemahariharan1126/linkedin-automation-mcp)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Render Deploy](https://img.shields.io/badge/Deploy%20to-Render-46E3B7.svg)](https://render.com)

An advanced **Model Context Protocol (MCP)** server for automating LinkedIn tasks using the official LinkedIn Developer API. Connect AI agents seamlessly to your professional network. Supports both **local STDIO mode** (Claude Desktop, Cursor) and **cloud 24/7 SSE mode** (Render, Railway, Docker).

</div>

---

## ✨ Features

- ✉️ **Send Messages:** Automate sending personalized messages.
- 🤝 **Manage Connections:** List connections and send new connection requests.
- 📝 **Post Content:** Create and fetch LinkedIn posts automatically with images and presentations.
- 🔍 **Search Capabilities:** Search for companies and people across the platform.
- 📊 **Analytics:** Fetch profile performance and network reach.
- 🌐 **Dual Transport:** Run locally over standard I/O (`stdio`) or deploy to the cloud over HTTP Server-Sent Events (`SSE`).

## 🛠 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A **LinkedIn Developer Access Token** with appropriate member permissions (`w_member_social`, `openid`, `profile`, `email`).

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hemahariharan1126/linkedin-automation-mcp.git
   cd linkedin-automation-mcp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   LINKEDIN_ACCESS_TOKEN=your_linkedin_developer_token_here
   ```

---

## 💻 Local Usage (Claude Desktop & IDEs)

Run the server locally using standard I/O:

```bash
npm start
```

### Integrating with Claude Desktop
Add this to your Claude Desktop configuration (`%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "linkedin-automation": {
      "command": "node",
      "args": [
        "C:/path/to/linkedin-automation-mcp/src/index.mjs"
      ],
      "env": {
        "LINKEDIN_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

---

## ☁️ Cloud Deployment (Deploy to Render)

This server includes built-in support for **Server-Sent Events (SSE)** and health checks, making it ready for 24/7 cloud hosting on [Render](https://render.com).

### Quick Setup on Render

1. Sign up or log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Select your GitHub repository: `hemahariharan1126/linkedin-automation-mcp`.
4. Configure service details:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start:sse`
   - **Health Check Path**: `/health`
5. Under **Environment Variables**, add:
   - `LINKEDIN_ACCESS_TOKEN`: *(Your LinkedIn access token)*
6. Click **Create Web Service**.

Once deployed, Render gives you a public URL (e.g. `https://linkedin-automation-mcp.onrender.com`).

### 🛡️ Automatic Free-Tier Keep-Alive
Render's free tier spins down services after 15 minutes of inactivity. This server includes an **autonomous self-pinger** that detects Render's `RENDER_EXTERNAL_URL` and automatically sends a lightweight ping to `/health` every 13 minutes. This keeps your MCP server awake 24/7 without needing external cron jobs.

### Connecting AI Clients to your Cloud MCP Server
Point any SSE-compatible MCP client to your remote URL:
- **SSE URL**: `https://<your-service>.onrender.com/sse`
- **Health Check**: `https://<your-service>.onrender.com/health`

---

## 📚 Built With
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) - Core Model Context Protocol SDK.
- [zod](https://zod.dev/) - Schema validation.

## 📄 License
This project is licensed under the **ISC License**.

---

<div align="center">
  <i>Built with ❤️ for AI agents and automation enthusiasts.</i>
</div>
