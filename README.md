<div align="center">
  
# 🚀 LinkedIn Automation MCP Server

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000)](https://github.com/your-username/linkedin-automation-mcp)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)

An advanced **Model Context Protocol (MCP)** server for automating LinkedIn tasks using the Linked API. Connect AI agents seamlessly to your professional network.

</div>

---

## ✨ Features

- ✉️ **Send Messages:** Automate sending personalized messages.
- 🤝 **Manage Connections:** List connections and send new connection requests.
- 📝 **Post Content:** Create and fetch LinkedIn posts automatically.
- 🔍 **Search Capabilities:** Search for companies and people across the platform.
- 📊 **Analytics:** Fetch performance stats and monitor your reach.

## 🛠 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A **Linked API** account and API key.

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/linkedin-automation-mcp.git
   cd linkedin-automation-mcp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your credentials:
   ```env
   LINKED_API_KEY=your_api_key_here
   ```

## 🚀 Usage

You can run the MCP server directly using Node.js:

```bash
npm start
```

### 🧩 Integrating with Claude Desktop
To integrate this server with Claude Desktop or other MCP clients, add it to your MCP configuration file:

```json
{
  "mcpServers": {
    "linkedin-automation": {
      "command": "node",
      "args": [
        "path/to/linkedin-automation-mcp/src/index.mjs"
      ],
      "env": {
        "LINKED_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

## 📚 Built With
- [@linkedapi/node](https://www.npmjs.com/package/@linkedapi/node) - Wrapper for Linked API.
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) - Core MCP SDK.
- [zod](https://zod.dev/) - TypeScript-first schema validation.

## 📄 License
This project is licensed under the **ISC License**.

---

<div align="center">
  <i>Built with ❤️ for AI agents and automation enthusiasts.</i>
</div>
