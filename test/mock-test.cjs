// Mock test for LinkedIn MCP server with official API structure

console.log('🧪 LinkedIn MCP Server Mock Tests (Official API)\n');
console.log('='.repeat(50));

let passed = 0;
let failed = 0;

// Mock LinkedIn API functions
const mockAPI = {
  async createPost(text, mediaUrls) {
    return { id: 'post-123', text, created: true };
  },
  async getPost(postId) {
    return { id: postId, text: 'Test post', likes: 42, comments: 10 };
  },
  async getProfile() {
    return { id: 'me', firstName: 'John', lastName: 'Doe', headline: 'Developer' };
  },
  async getProfileById(id) {
    return { id, firstName: 'Jane', lastName: 'Smith' };
  },
  async sendConnection(profileId, message) {
    return { profileId, message, sent: true };
  },
  async getConnections(start, count) {
    return { elements: [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }], length: 2 };
  },
  async getProfileStats() {
    return { profileViews: 150, postImpressions: 5000 };
  },
  async searchCompanies(query, count) {
    return { elements: [{ name: 'Tech Corp' }, { name: 'Inc Corp' }] };
  },
  async searchPeople(query, company, count) {
    return { elements: [{ name: 'Jane' }, { name: 'Mike' }] };
  },
  async getUserPosts(count) {
    return { elements: [{ id: '1', text: 'Post 1' }, { id: '2', text: 'Post 2' }] };
  }
};

// Test functions
async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}: ${e.message}`);
    failed++;
  }
}

async function runTests() {
  // Test 1: Create Post
  await test('linkedin_post_create', async () => {
    const result = await mockAPI.createPost('Hello World');
    if (!result.id) throw new Error('No post ID');
  });

  // Test 2: Fetch Post
  await test('linkedin_post_fetch', async () => {
    const result = await mockAPI.getPost('post-123');
    if (result.likes !== 42) throw new Error('Wrong likes');
  });

  // Test 3: Send Connection
  await test('linkedin_message_send', async () => {
    const result = await mockAPI.sendConnection('urn:li:person:123', 'Hi!');
    if (!result.sent) throw new Error('Not sent');
  });

  // Test 4: Get Profile
  await test('linkedin_person_fetch', async () => {
    const result = await mockAPI.getProfile();
    if (result.firstName !== 'John') throw new Error('Wrong name');
  });

  // Test 5: Get Profile by ID
  await test('linkedin_person_fetch (by ID)', async () => {
    const result = await mockAPI.getProfileById('urn:li:person:456');
    if (result.firstName !== 'Jane') throw new Error('Wrong name');
  });

  // Test 6: List Connections
  await test('linkedin_connection_list', async () => {
    const result = await mockAPI.getConnections(0, 10);
    if (result.elements?.length !== 2) throw new Error('Wrong count');
  });

  // Test 7: Stats
  await test('linkedin_stats_performance', async () => {
    const result = await mockAPI.getProfileStats();
    if (result.profileViews !== 150) throw new Error('Wrong stats');
  });

  // Test 8: Company Search
  await test('linkedin_company_search', async () => {
    const result = await mockAPI.searchCompanies('tech', 10);
    if (!result.elements) throw new Error('No results');
  });

  // Test 9: Person Search
  await test('linkedin_person_search', async () => {
    const result = await mockAPI.searchPeople('developer', null, 10);
    if (!result.elements) throw new Error('No results');
  });

  // Test 10: My Posts
  await test('linkedin_my_posts', async () => {
    const result = await mockAPI.getUserPosts(5);
    if (!result.elements) throw new Error('No posts');
  });

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${passed}/${passed + failed} passed`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests();