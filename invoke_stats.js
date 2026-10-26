import fs from 'fs';

async function main() {
  console.log('--- LinkedIn Stats Performance Invoker ---');
  
  // 1. Read the token from the .env file in the Documents directory
  const envPath = 'C:\\Users\\harih\\Documents\\linkedin-mcp\\.env';
  let token = '';
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/LINKEDIN_ACCESS_TOKEN\s*=\s*(.*)/);
    if (match && match[1]) {
      token = match[1].trim();
    }
  } catch (err) {
    console.error('Error reading .env file:', err.message);
    process.exit(1);
  }

  if (!token) {
    console.error('LINKEDIN_ACCESS_TOKEN not found in .env file.');
    process.exit(1);
  }

  console.log('Successfully loaded access token (length: ' + token.length + ')');

  // Helper function for LinkedIn API request
  async function apiRequest(url, headers = {}) {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202601',
        ...headers
      }
    });

    const bodyText = await response.text();
    if (!response.ok) {
      throw new Error(`API error (${response.status}): ${bodyText}`);
    }

    try {
      return JSON.parse(bodyText);
    } catch {
      return bodyText;
    }
  }

  try {
    // 2. Resolve Member ID
    console.log('\nResolving Member ID...');
    let memberId = '';
    try {
      const userInfo = await apiRequest('https://api.linkedin.com/v2/userinfo');
      if (userInfo && userInfo.sub) {
        memberId = userInfo.sub;
        console.log('✅ Resolved from /v2/userinfo:', memberId);
      }
    } catch (e) {
      console.log('⚠️ /v2/userinfo failed:', e.message);
    }

    if (!memberId) {
      // Fallback to /v2/me
      const me = await apiRequest('https://api.linkedin.com/v2/me', {
        'LinkedIn-Version': undefined // remove version for legacy endpoint
      });
      if (me && me.id) {
        memberId = me.id;
        console.log('✅ Resolved from /v2/me:', memberId);
      }
    }

    if (!memberId) {
      throw new Error('Failed to resolve member ID from both userinfo and me endpoints.');
    }

    // 3. Fetch Network Size - CompanyFollowedByMember
    console.log('\nFetching CompanyFollowedByMember network size...');
    try {
      const companyFollowed = await apiRequest(
        `https://api.linkedin.com/v2/networkSizes/urn:li:person:${memberId}?edgeType=CompanyFollowedByMember`
      );
      console.log('CompanyFollowedByMember:', JSON.stringify(companyFollowed, null, 2));
    } catch (e) {
      console.log('❌ CompanyFollowedByMember failed:', e.message);
    }

    // 4. Fetch Network Size - MemberToMember (connection count)
    console.log('\nFetching MemberToMember network size...');
    try {
      const memberToMember = await apiRequest(
        `https://api.linkedin.com/v2/networkSizes/urn:li:person:${memberId}?edgeType=MemberToMember`
      );
      console.log('MemberToMember:', JSON.stringify(memberToMember, null, 2));
    } catch (e) {
      console.log('❌ MemberToMember failed:', e.message);
    }

    // 5. Fetch Profile
    console.log('\nFetching Profile details...');
    try {
      const profile = await apiRequest('https://api.linkedin.com/v2/userinfo');
      console.log('Profile Details:', JSON.stringify(profile, null, 2));
    } catch (e) {
      console.log('❌ Profile fetch failed:', e.message);
    }

  } catch (err) {
    console.error('\n❌ Fatal error in script:', err.message);
  }
}

main();
