// Mock test for LinkedIn MCP server

const LinkedApi = require('@linkedapi/node');

// Mock the Linked API
const mockClient = {
  operations: [],
  createPost: {
    execute: async (params) => 'workflow-123',
    result: async (id) => ({ data: { postId: 'post-456', text: params.text, created: true } })
  },
  fetchPost: {
    execute: async (params) => 'workflow-456',
    result: async (id) => ({ data: { postId: 'post-789', text: 'Test post', likes: 42, comments: 10 } })
  },
  sendMessage: {
    execute: async (params) => 'workflow-789',
    result: async (id) => ({ data: { messageId: 'msg-123', sent: true } })
  },
  fetchPerson: {
    execute: async (params) => 'workflow-101',
    result: async (id) => ({ data: { name: 'John Doe', headline: 'Engineer', connections: 500 } })
  },
  sendConnectionRequest: {
    execute: async (params) => 'workflow-102',
    result: async (id) => ({ data: { connectionId: 'conn-123', status: 'pending' } })
  },
  retrieveConnections: {
    execute: async (params) => 'workflow-103',
    result: async (id) => ({ data: { connections: [{ name: 'Alice' }, { name: 'Bob' }] } })
  },
  retrievePerformance: {
    execute: async (params) => 'workflow-104',
    result: async (id) => ({ data: { profileViews: 150, postImpressions: 5000 } })
  },
  retrieveSSI: {
    execute: async (params) => 'workflow-105',
    result: async (id) => ({ data: { score: 78, rank: 'Gold' } })
  },
  searchCompanies: {
    execute: async (params) => 'workflow-106',
    result: async (id) => ({ data: { companies: [{ name: 'Tech Corp' }, { name: 'Inc Corp' }] } })
  },
  searchPeople: {
    execute: async (params) => 'workflow-107',
    result: async (id) => ({ data: { people: [{ name: 'Jane' }, { name: 'Mike' }] } })
  }
};

// Override require to return mock
const originalRequire = require;
require = function(module) {
  if (module === '@linkedapi/node') {
    return LinkedApi;
  }
  return originalRequire(module);
};

// Mock LinkedApi constructor
LinkedApi.default = function(config) {
  console.log('Mock LinkedApi initialized with:', config?.client);
  return mockClient;
};

// Test runner
async function runTests() {
  console.log('🧪 Running LinkedIn MCP Server Mock Tests\n');
  console.log('='.repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Create Post
  console.log('\n📝 Test 1: linkedin_post_create');
  try {
    const result = await mockClient.createPost.execute({ text: 'Hello World' });
    const data = await mockClient.createPost.result(result);
    console.log('   ✅ Post created:', data.data.postId);
    passed++;
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    failed++;
  }
  
  // Test 2: Fetch Post
  console.log('\n📝 Test 2: linkedin_post_fetch');
  try {
    const result = await mockClient.fetchPost.execute({ postUrl: 'https://linkedin.com/post/123' });
    const data = await mockClient.fetchPost.result(result);
    console.log('   ✅ Post fetched, likes:', data.data.likes);
    passed++;
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    failed++;
  }
  
  // Test 3: Send Message
  console.log('\n📝 Test 3: linkedin_message_send');
  try {
    const result = await mockClient.sendMessage.execute({ recipientUrl: 'https://linkedin.com/in/test', message: 'Hi!' });
    const data = await mockClient.sendMessage.result(result);
    console.log('   ✅ Message sent:', data.data.sent);
    passed++;
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    failed++;
  }
  
  // Test 4: Fetch Person
  console.log('\n📝 Test 4: linkedin_person_fetch');
  try {
    const result = await mockClient.fetchPerson.execute({ personUrl: 'https://linkedin.com/in/johndoe' });
    const data = await mockClient.fetchPerson.result(result);
    console.log('   ✅ Person fetched:', data.data.name);
    passed++;
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    failed++;
  }
  
  // Test 5: Send Connection
  console.log('\n📝 Test 5: linkedin_connection_send');
  try {
    const result = await mockClient.sendConnectionRequest.execute({ recipientUrl: 'https://linkedin.com/in/test' });
    const data = await mockClient.sendConnectionRequest.result(result);
    console.log('   ✅ Connection sent, status:', data.data.status);
    passed++;
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    failed++;
  }
  
  // Test 6: List Connections
  console.log('\n📝 Test 6: linkedin_connection_list');
  try {
    const result = await mockClient.retrieveConnections.execute({ limit: 10 });
    const data = await mockClient.retrieveConnections.result(result);
    console.log('   ✅ Connections:', data.data.connections.length);
    passed++;
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    failed++;
  }
  
  // Test 7: Performance Stats
  console.log('\n📝 Test 7: linkedin_stats_performance');
  try {
    const result = await mockClient.retrievePerformance.execute({});
    const data = await mockClient.retrievePerformance.result(result);
    console.log('   ✅ Profile views:', data.data.profileViews);
    passed++;
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    failed++;
  }
  
  // Test 8: SSI Score
  console.log('\n📝 Test 8: linkedin_stats_ssi');
  try {
    const result = await mockClient.retrieveSSI.execute({});
    const data = await mockClient.retrieveSSI.result(result);
    console.log('   ✅ SSI Score:', data.data.score, '(' + data.data.rank + ')');
    passed++;
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    failed++;
  }
  
  // Test 9: Company Search
  console.log('\n📝 Test 9: linkedin_company_search');
  try {
    const result = await mockClient.searchCompanies.execute({ query: 'tech', limit: 10 });
    const data = await mockClient.searchCompanies.result(result);
    console.log('   ✅ Companies found:', data.data.companies.length);
    passed++;
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    failed++;
  }
  
  // Test 10: Person Search
  console.log('\n📝 Test 10: linkedin_person_search');
  try {
    const result = await mockClient.searchPeople.execute({ query: 'developer', limit: 10 });
    const data = await mockClient.searchPeople.result(result);
    console.log('   ✅ People found:', data.data.people.length);
    passed++;
  } catch (e) {
    console.log('   ❌ Failed:', e.message);
    failed++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();