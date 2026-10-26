import fs from 'fs';

// Read .env
const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/LINKEDIN_ACCESS_TOKEN=(.+)/);
if (!match) {
  console.error('❌ No LINKEDIN_ACCESS_TOKEN found in .env');
  process.exit(1);
}
const token = match[1].trim();

async function runTest() {
  console.log('====================================================');
  console.log('🤖 JARVIS Diagnostics: LinkedIn Token & Jobs Support');
  console.log('====================================================\n');

  // 1. Verify Authentication & Identity
  console.log('[1] Testing Token Validity (/v2/userinfo)...');
  try {
    const userinfoResp = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(`HTTP Status: ${userinfoResp.status} ${userinfoResp.statusText}`);
    const userInfo = await userinfoResp.json();
    if (userinfoResp.ok) {
      console.log(`✅ Authenticated User: ${userInfo.name} (${userInfo.email || userInfo.sub})`);
      console.log(`   Sub / Member ID: ${userInfo.sub}`);
    } else {
      console.log(`❌ Auth check failed:`, userInfo);
    }
  } catch (err) {
    console.error('❌ Error checking userinfo:', err.message);
  }

  // 2. Querying Job related endpoints
  console.log('\n[2] Probing LinkedIn Job Endpoints with Developer Access Token...');
  const testEndpoints = [
    { name: 'Job Postings (v2)', url: 'https://api.linkedin.com/v2/jobPostings' },
    { name: 'Job Search (v2)', url: 'https://api.linkedin.com/v2/jobs' },
    { name: 'Job Applications (v2)', url: 'https://api.linkedin.com/v2/jobApplications' },
    { name: 'Job Applications (REST)', url: 'https://api.linkedin.com/rest/jobApplications' },
    { name: 'Apply Connect (REST)', url: 'https://api.linkedin.com/rest/applyConnectApplications' },
    { name: 'Jobs (REST)', url: 'https://api.linkedin.com/rest/jobs' }
  ];

  for (const ep of testEndpoints) {
    try {
      const resp = await fetch(ep.url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'LinkedIn-Version': '202601',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      const body = await resp.text();
      console.log(`- ${ep.name}: HTTP ${resp.status} ${resp.statusText}`);
      try {
        const parsed = JSON.parse(body);
        console.log(`  Details: ${parsed.message || JSON.stringify(parsed)}`);
      } catch {
        console.log(`  Details: ${body.trim().slice(0, 100)}`);
      }
    } catch (e) {
      console.log(`- ${ep.name}: Request error (${e.message})`);
    }
  }

  // 3. Inspect MCP Tools defined in codebase
  console.log('\n[3] Auditing MCP Server Registered Tools (src/index.mjs)...');
  const indexSrc = fs.readFileSync('src/index.mjs', 'utf-8');
  const toolMatches = [...indexSrc.matchAll(/name:\s*'([^']+)'/g)].map(m => m[1]);
  console.log('Registered MCP Tools:', toolMatches);

  const jobTools = toolMatches.filter(t => t.toLowerCase().includes('job'));
  if (jobTools.length === 0) {
    console.log('⚠️ Result: 0 job application or job search tools exist in this MCP server.');
  } else {
    console.log('Found job tools:', jobTools);
  }
}

runTest();
