const path = require('path');
const { Server } = require('@modelcontextprotocol/sdk/dist/cjs/server');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/dist/cjs/server/stdio');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/dist/cjs/types');
const LinkedApi = require('@linkedapi/node');
const z = require('zod');

// Environment variables
const LINKED_API_TOKEN = process.env.LINKED_API_TOKEN;
const IDENTIFICATION_TOKEN = process.env.IDENTIFICATION_TOKEN;
const LINKED_API_BASE_URL = process.env.LINKED_API_BASE_URL;

// Create LinkedIn client
function getClient() {
  if (!LINKED_API_TOKEN || !IDENTIFICATION_TOKEN) {
    throw new Error('LINKED_API_TOKEN and IDENTIFICATION_TOKEN environment variables are required');
  }
  return new LinkedApi({
    linkedApiToken: LINKED_API_TOKEN,
    identificationToken: IDENTIFICATION_TOKEN,
    client: 'mcp-server',
    baseUrl: LINKED_API_BASE_URL,
  });
}

// Helper to run workflow
async function runWorkflow(operation, params) {
  const workflowId = await operation.execute(params);
  return await operation.result(workflowId);
}

// MCP Server
class LinkedInMCPServer extends Server {
  constructor() {
    super({
      name: 'linkedin-automation',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });

    this.setupHandlers();
  }

  setupHandlers() {
    // List tools handler
    this.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'linkedin_post_create',
            description: 'Create a new LinkedIn post',
            inputSchema: {
              type: 'object',
              properties: {
                text: { type: 'string', description: 'Post text content' },
                mediaUrls: { type: 'array', items: { type: 'string' }, description: 'Optional array of media URLs' },
              },
              required: ['text'],
            },
          },
          {
            name: 'linkedin_post_fetch',
            description: 'Fetch a LinkedIn post with metrics',
            inputSchema: {
              type: 'object',
              properties: {
                postUrl: { type: 'string', description: 'LinkedIn post URL' },
                comments: { type: 'boolean', description: 'Include comments' },
                reactions: { type: 'boolean', description: 'Include reactions' },
              },
              required: ['postUrl'],
            },
          },
          {
            name: 'linkedin_message_send',
            description: 'Send a message to a LinkedIn connection',
            inputSchema: {
              type: 'object',
              properties: {
                profileUrl: { type: 'string', description: 'LinkedIn profile URL' },
                message: { type: 'string', description: 'Message text' },
              },
              required: ['profileUrl', 'message'],
            },
          },
          {
            name: 'linkedin_person_fetch',
            description: 'Fetch a LinkedIn person profile',
            inputSchema: {
              type: 'object',
              properties: {
                profileUrl: { type: 'string', description: 'LinkedIn profile URL' },
                experience: { type: 'boolean', description: 'Include work experience' },
                education: { type: 'boolean', description: 'Include education' },
                skills: { type: 'boolean', description: 'Include skills' },
              },
              required: ['profileUrl'],
            },
          },
          {
            name: 'linkedin_connection_send',
            description: 'Send a connection request',
            inputSchema: {
              type: 'object',
              properties: {
                profileUrl: { type: 'string', description: 'LinkedIn profile URL' },
                message: { type: 'string', description: 'Optional message' },
              },
              required: ['profileUrl'],
            },
          },
          {
            name: 'linkedin_connection_list',
            description: 'List your LinkedIn connections',
            inputSchema: {
              type: 'object',
              properties: {
                limit: { type: 'number', description: 'Max connections' },
              },
            },
          },
          {
            name: 'linkedin_stats_performance',
            description: 'Get profile performance stats',
            inputSchema: { type: 'object', properties: {} },
          },
          {
            name: 'linkedin_stats_ssi',
            description: 'Get SSI score',
            inputSchema: { type: 'object', properties: {} },
          },
          {
            name: 'linkedin_company_search',
            description: 'Search companies',
            inputSchema: {
              type: 'object',
              properties: {
                term: { type: 'string', description: 'Search term' },
                limit: { type: 'number', description: 'Max results' },
              },
              required: ['term'],
            },
          },
          {
            name: 'linkedin_person_search',
            description: 'Search people',
            inputSchema: {
              type: 'object',
              properties: {
                term: { type: 'string', description: 'Search term' },
                currentCompanies: { type: 'array', items: { type: 'string' }, description: 'Filter by company' },
                limit: { type: 'number', description: 'Max results' },
              },
              required: ['term'],
            },
          },
        ],
      };
    });

    // Call tool handler
    this.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        switch (name) {
          case 'linkedin_post_create':
            return await this.handlePostCreate(args);
          case 'linkedin_post_fetch':
            return await this.handlePostFetch(args);
          case 'linkedin_message_send':
            return await this.handleMessageSend(args);
          case 'linkedin_person_fetch':
            return await this.handlePersonFetch(args);
          case 'linkedin_connection_send':
            return await this.handleConnectionSend(args);
          case 'linkedin_connection_list':
            return await this.handleConnectionList(args);
          case 'linkedin_stats_performance':
            return await this.handleStatsPerformance();
          case 'linkedin_stats_ssi':
            return await this.handleStatsSSI();
          case 'linkedin_company_search':
            return await this.handleCompanySearch(args);
          case 'linkedin_person_search':
            return await this.handlePersonSearch(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });
  }

  async handlePostCreate(args) {
    const client = getClient();
    const result = await runWorkflow(client.createPost, { text: args.text, mediaUrls: args.mediaUrls });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  async handlePostFetch(args) {
    const client = getClient();
    const params = { postUrl: args.postUrl };
    if (args.comments) params.retrieveComments = true;
    if (args.reactions) params.retrieveReactions = true;
    const result = await runWorkflow(client.fetchPost, params);
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  async handleMessageSend(args) {
    const client = getClient();
    const result = await runWorkflow(client.sendMessage, { recipientUrl: args.profileUrl, message: args.message });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  async handlePersonFetch(args) {
    const client = getClient();
    const params = { personUrl: args.profileUrl };
    if (args.experience) params.retrieveExperience = true;
    if (args.education) params.retrieveEducation = true;
    if (args.skills) params.retrieveSkills = true;
    const result = await runWorkflow(client.fetchPerson, params);
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  async handleConnectionSend(args) {
    const client = getClient();
    const result = await runWorkflow(client.sendConnectionRequest, { recipientUrl: args.profileUrl, message: args.message });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  async handleConnectionList(args) {
    const client = getClient();
    const result = await runWorkflow(client.retrieveConnections, { limit: args.limit || 10 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  async handleStatsPerformance() {
    const client = getClient();
    const result = await runWorkflow(client.retrievePerformance, {});
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  async handleStatsSSI() {
    const client = getClient();
    const result = await runWorkflow(client.retrieveSSI, {});
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  async handleCompanySearch(args) {
    const client = getClient();
    const result = await runWorkflow(client.searchCompanies, { query: args.term, limit: args.limit || 10 });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }

  async handlePersonSearch(args) {
    const client = getClient();
    const params = { query: args.term, limit: args.limit || 10 };
    if (args.currentCompanies) params.currentCompanies = args.currentCompanies;
    const result = await runWorkflow(client.searchPeople, params);
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  }
}

// Run the server
async function main() {
  const server = new LinkedInMCPServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);