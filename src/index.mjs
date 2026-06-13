/**
 * LinkedIn MCP Server
 * Uses official LinkedIn API with access token
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import linkedin from './linkedin-api.js';

// Environment
const ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

// MCP Server
class LinkedInMCPServer extends Server {
  constructor() {
    super({
      name: 'linkedin-automation',
      version: '1.0.0',
    }, {
      capabilities: { tools: {} },
    });
    this.setupHandlers();
  }

  setupHandlers() {
    // List tools
    this.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'linkedin_post_create',
          description: 'Create a LinkedIn post, optionally with an attached image or document',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Post content' },
              mediaUrls: { type: 'array', items: { type: 'string' }, description: 'Media URLs (optional)' },
              filePath: {
                type: 'string',
                description: 'Absolute local file path of an image or document to attach. ' +
                  'Supported: .jpg, .jpeg, .png, .gif, .webp (images) and .pdf, .doc, .docx, .ppt, .pptx (documents). Max 100 MB.'
              },
            },
            required: ['text'],
          },
        },
        {
          name: 'linkedin_post_fetch',
          description: 'Get a LinkedIn post',
          inputSchema: {
            type: 'object',
            properties: {
              postId: { type: 'string', description: 'Post ID' },
            },
            required: ['postId'],
          },
        },
        {
          name: 'linkedin_message_send',
          description: 'Send connection request with message',
          inputSchema: {
            type: 'object',
            properties: {
              profileId: { type: 'string', description: 'Profile ID (urn:li:person:XXX)' },
              message: { type: 'string', description: 'Message' },
            },
            required: ['profileId'],
          },
        },
        {
          name: 'linkedin_person_fetch',
          description: 'Get LinkedIn profile',
          inputSchema: {
            type: 'object',
            properties: {
              personId: { type: 'string', description: 'Person ID' },
            },
          },
        },
        {
          name: 'linkedin_connection_send',
          description: 'Send connection request',
          inputSchema: {
            type: 'object',
            properties: {
              profileId: { type: 'string', description: 'Profile ID' },
              message: { type: 'string', description: 'Optional message' },
            },
            required: ['profileId'],
          },
        },
        {
          name: 'linkedin_connection_list',
          description: 'List connections',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Max results', default: 10 },
            },
          },
        },
        {
          name: 'linkedin_stats_performance',
          description: 'Get profile stats',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'linkedin_company_search',
          description: 'Search companies',
          inputSchema: {
            type: 'object',
            properties: {
              term: { type: 'string', description: 'Search term' },
              limit: { type: 'number', description: 'Max results', default: 10 },
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
              company: { type: 'string', description: 'Current company filter' },
              limit: { type: 'number', description: 'Max results', default: 10 },
            },
            required: ['term'],
          },
        },
        {
          name: 'linkedin_my_posts',
          description: 'Get my recent posts',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Max posts', default: 10 },
            },
          },
        },
      ],
    }));

    // Call tool
    this.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      if (!ACCESS_TOKEN) {
        return { content: [{ type: 'text', text: 'Error: LINKEDIN_ACCESS_TOKEN not set' }], isError: true };
      }
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
            return await this.handleStats(args);
          case 'linkedin_company_search':
            return await this.handleCompanySearch(args);
          case 'linkedin_person_search':
            return await this.handlePersonSearch(args);
          case 'linkedin_my_posts':
            return await this.handleMyPosts(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
      }
    });
  }

  async handlePostCreate(args) {
    const result = await linkedin.createPost(args.text, args.mediaUrls, args.filePath);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  async handlePostFetch(args) {
    const result = await linkedin.getPost(args.postId);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  async handleMessageSend(args) {
    const result = await linkedin.sendConnection(args.profileId, args.message);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  async handlePersonFetch(args) {
    const result = args.personId 
      ? await linkedin.getProfileById(args.personId)
      : await linkedin.getProfile();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  async handleConnectionSend(args) {
    const result = await linkedin.sendConnection(args.profileId, args.message);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  async handleConnectionList(args) {
    const result = await linkedin.getConnections(0, args.limit || 10);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  async handleStats(args) {
    const result = await linkedin.getProfileStats();
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  async handleCompanySearch(args) {
    const result = await linkedin.searchCompanies(args.term, args.limit || 10);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  async handlePersonSearch(args) {
    const result = await linkedin.searchPeople(args.term, args.company, args.limit || 10);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }

  async handleMyPosts(args) {
    const result = await linkedin.getUserPosts(args.limit || 10);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  }
}

// Run
async function main() {
  const server = new LinkedInMCPServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);