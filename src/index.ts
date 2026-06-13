import { McpServer, StdioServerTransport } from '@modelcontextprotocol/sdk';
import LinkedApi from '@linkedapi/node';
import * as z from 'zod';
const { zod } = z;

// Environment variables
const LINKED_API_TOKEN = process.env.LINKED_API_TOKEN;
const IDENTIFICATION_TOKEN = process.env.IDENTIFICATION_TOKEN;
const LINKED_API_BASE_URL = process.env.LINKED_API_BASE_URL;

// Create LinkedIn client
function getClient() {
  if (!LINKED_API_TOKEN || !IDENTIFICATION_TOKEN) {
    throw new Error('LINKED_API_TOKEN and IDENTIFICATION_TOKEN environment variables are required');
  }
  return new LinkedInClient({
    linkedApiToken: LINKED_API_TOKEN,
    identificationToken: IDENTIFICATION_TOKEN,
    client: 'mcp-server',
    baseUrl: LINKED_API_BASE_URL,
  });
}

// Helper to run workflow
async function runWorkflow(operation: any, params: any) {
  const workflowId = await operation.execute(params);
  return await operation.result(workflowId);
}

// Create MCP Server
const server = new McpServer({
  name: 'linkedin-automation',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Register tools
server.tool(
  'linkedin_post_create',
  'Create a new LinkedIn post',
  {
    text: zod.string().describe('Post text content'),
    mediaUrls: zod.array(zod.string()).optional().describe('Optional array of media URLs to attach'),
  },
  async ({ text, mediaUrls }) => {
    try {
      const client = getClient();
      const result = await runWorkflow(client.createPost, { text, mediaUrls });
      return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  }
);

server.tool(
  'linkedin_post_fetch',
  'Fetch a LinkedIn post with metrics',
  {
    postUrl: zod.string().describe('LinkedIn post URL'),
    comments: zod.boolean().optional().describe('Include comments'),
    reactions: zod.boolean().optional().describe('Include reactions'),
  },
  async ({ postUrl, comments, reactions }) => {
    try {
      const client = getClient();
      const params: any = { postUrl };
      if (comments) params.retrieveComments = true;
      if (reactions) params.retrieveReactions = true;
      const result = await runWorkflow(client.fetchPost, params);
      return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  }
);

server.tool(
  'linkedin_message_send',
  'Send a message to a LinkedIn connection',
  {
    profileUrl: zod.string().describe('LinkedIn profile URL of the connection'),
    message: zod.string().describe('Message text to send'),
  },
  async ({ profileUrl, message }) => {
    try {
      const client = getClient();
      const result = await runWorkflow(client.sendMessage, { recipientUrl: profileUrl, message });
      return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  }
);

server.tool(
  'linkedin_person_fetch',
  'Fetch a LinkedIn person profile',
  {
    profileUrl: zod.string().describe('LinkedIn profile URL'),
    experience: zod.boolean().optional().describe('Include work experience'),
    education: zod.boolean().optional().describe('Include education history'),
    skills: zod.boolean().optional().describe('Include skills'),
  },
  async ({ profileUrl, experience, education, skills }) => {
    try {
      const client = getClient();
      const params: any = { personUrl: profileUrl };
      if (experience) params.retrieveExperience = true;
      if (education) params.retrieveEducation = true;
      if (skills) params.retrieveSkills = true;
      const result = await runWorkflow(client.fetchPerson, params);
      return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  }
);

server.tool(
  'linkedin_connection_send',
  'Send a connection request to a LinkedIn profile',
  {
    profileUrl: zod.string().describe('LinkedIn profile URL'),
    message: zod.string().optional().describe('Optional personalized message'),
  },
  async ({ profileUrl, message }) => {
    try {
      const client = getClient();
      const result = await runWorkflow(client.sendConnectionRequest, { recipientUrl: profileUrl, message });
      return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  }
);

server.tool(
  'linkedin_connection_list',
  'List your LinkedIn connections',
  {
    limit: zod.number().optional().describe('Maximum number of connections to return'),
  },
  async ({ limit = 10 }) => {
    try {
      const client = getClient();
      const result = await runWorkflow(client.retrieveConnections, { limit });
      return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  }
);

server.tool(
  'linkedin_stats_performance',
  'Get profile performance statistics',
  {},
  async () => {
    try {
      const client = getClient();
      const result = await runWorkflow(client.retrievePerformance, {});
      return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  }
);

server.tool(
  'linkedin_stats_ssi',
  'Get Social Selling Index (SSI) score',
  {},
  async () => {
    try {
      const client = getClient();
      const result = await runWorkflow(client.retrieveSSI, {});
      return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  }
);

server.tool(
  'linkedin_company_search',
  'Search for companies on LinkedIn',
  {
    term: zod.string().describe('Search term'),
    limit: zod.number().optional().describe('Maximum results'),
  },
  async ({ term, limit = 10 }) => {
    try {
      const client = getClient();
      const result = await runWorkflow(client.searchCompanies, { query: term, limit });
      return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  }
);

server.tool(
  'linkedin_person_search',
  'Search for people on LinkedIn',
  {
    term: zod.string().describe('Search term'),
    currentCompanies: zod.array(zod.string()).optional().describe('Filter by current companies'),
    limit: zod.number().optional().describe('Maximum results'),
  },
  async ({ term, currentCompanies, limit = 10 }) => {
    try {
      const client = getClient();
      const params: any = { query: term, limit };
      if (currentCompanies) params.currentCompanies = currentCompanies;
      const result = await runWorkflow(client.searchPeople, params);
      return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
    } catch (error: any) {
      return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
    }
  }
);

// Run the server
async function main() {
  const transport = new StdioServerTransport();
  await server.run(transport);
}

main().catch(console.error);