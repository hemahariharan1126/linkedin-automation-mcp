/**
 * LinkedIn MCP Server using official LinkedIn API
 * Uses LinkedIn Developer Access Token directly
 */

import { readFileSync } from 'fs';
import { extname, basename } from 'path';

// Environment variables
const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_BASE_URL = 'https://api.linkedin.com/v2';
const LINKEDIN_REST_URL = 'https://api.linkedin.com/rest';

// Lazily resolved member ID (fetched from /v2/userinfo on first use, then cached)
let cachedMemberId = null;

async function resolveMemberId() {
  if (cachedMemberId) return cachedMemberId;
  if (!LINKEDIN_ACCESS_TOKEN) {
    throw new Error('LinkedIn connector not authenticated: re-run the OAuth flow');
  }

  // Try OpenID userinfo first (needs openid/profile scope)
  const userinfoResp = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      'LinkedIn-Version': '202601'
    }
  });
  if (userinfoResp.ok) {
    const data = await userinfoResp.json();
    if (data.sub) {
      cachedMemberId = data.sub;
      return cachedMemberId;
    }
  }

  // Fall back to /v2/me without version header (legacy r_liteprofile scope path)
  const meResp = await fetch('https://api.linkedin.com/v2/me', {
    headers: {
      'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      'X-Restli-Protocol-Version': '2.0.0'
    }
  });
  if (!meResp.ok) {
    const meBody = await meResp.text();
    // Also report what userinfo returned for diagnostics
    const userinfoStatus = userinfoResp.status;
    throw new Error(
      `LinkedIn connector not authenticated — could not resolve member ID.\n` +
      `  /v2/userinfo → ${userinfoStatus}\n` +
      `  /v2/me       → ${meResp.status} ${meBody}\n` +
      `Token needs r_liteprofile (or openid+profile) scope. Re-generate the token in the LinkedIn Developer Portal with those scopes checked.`
    );
  }
  const meData = await meResp.json();
  if (!meData.id) {
    throw new Error('LinkedIn connector not authenticated: could not resolve member ID — re-run the OAuth flow');
  }
  cachedMemberId = meData.id;
  return cachedMemberId;
}

// LinkedIn API helper — targets /v2 base URL
async function linkedInRequest(endpoint, method = 'GET', body = null) {
  if (!LINKEDIN_ACCESS_TOKEN) {
    throw new Error('LINKEDIN_ACCESS_TOKEN environment variable is required');
  }

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202601'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${LINKEDIN_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn API error: ${response.status} - ${error}`);
  }

  const text = await response.text();
  if (!text || !text.trim()) {
    // LinkedIn's versioned Posts API (201 Created) returns an empty body;
    // surface the post ID from the response header if present.
    const postId = response.headers.get('x-linkedin-id') || response.headers.get('x-restli-id');
    return { success: true, id: postId || null, status: response.status };
  }
  return JSON.parse(text);
}

// LinkedIn API helper — targets /rest base URL (media upload APIs)
async function linkedInRestRequest(endpoint, method = 'GET', body = null) {
  if (!LINKEDIN_ACCESS_TOKEN) {
    throw new Error('LINKEDIN_ACCESS_TOKEN environment variable is required');
  }

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202601'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${LINKEDIN_REST_URL}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LinkedIn REST API error: ${response.status} - ${error}`);
  }

  const text = await response.text();
  if (!text || !text.trim()) {
    return { success: true, status: response.status };
  }
  return JSON.parse(text);
}

// MIME type map for supported file attachments
const MIME_MAP = {
  '.jpg':  { mediaType: 'image',    mime: 'image/jpeg' },
  '.jpeg': { mediaType: 'image',    mime: 'image/jpeg' },
  '.png':  { mediaType: 'image',    mime: 'image/png' },
  '.gif':  { mediaType: 'image',    mime: 'image/gif' },
  '.webp': { mediaType: 'image',    mime: 'image/webp' },
  '.pdf':  { mediaType: 'document', mime: 'application/pdf' },
  '.doc':  { mediaType: 'document', mime: 'application/msword' },
  '.docx': { mediaType: 'document', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  '.ppt':  { mediaType: 'document', mime: 'application/vnd.ms-powerpoint' },
  '.pptx': { mediaType: 'document', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
};

/**
 * Detect whether a file path is an image or document attachment,
 * and return the correct MIME type for the binary upload PUT request.
 */
function detectFileType(filePath) {
  const ext = extname(filePath).toLowerCase();
  const info = MIME_MAP[ext];
  if (!info) {
    const supported = Object.keys(MIME_MAP).join(', ');
    throw new Error(
      `Unsupported file type "${ext}". Supported extensions: ${supported}`
    );
  }
  return info; // { mediaType: 'image'|'document', mime: string }
}

/**
 * Upload a local image file to LinkedIn (3-step flow).
 * Returns the LinkedIn image asset URN (e.g. "urn:li:image:C5622...").
 */
async function uploadImage(filePath, memberId) {
  // Step 1 — initialize
  const initResp = await linkedInRestRequest(
    '/images?action=initializeUpload',
    'POST',
    { initializeUploadRequest: { owner: `urn:li:person:${memberId}` } }
  );
  const { uploadUrl, image: imageUrn } = initResp.value;
  if (!uploadUrl || !imageUrn) {
    throw new Error('LinkedIn image initializeUpload did not return uploadUrl or image URN');
  }

  // Step 2 — upload binary
  const { mime } = detectFileType(filePath);
  const fileBuffer = readFileSync(filePath);
  const uploadResp = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      'Content-Type': mime,
    },
    body: fileBuffer,
  });
  if (!uploadResp.ok) {
    const errText = await uploadResp.text();
    throw new Error(`Image binary upload failed: ${uploadResp.status} - ${errText}`);
  }

  return imageUrn;
}

/**
 * Upload a local document file (PDF, DOCX, PPTX…) to LinkedIn (3-step flow).
 * Returns the LinkedIn document asset URN.
 */
async function uploadDocument(filePath, memberId) {
  // Step 1 — initialize
  const initResp = await linkedInRestRequest(
    '/documents?action=initializeUpload',
    'POST',
    { initializeUploadRequest: { owner: `urn:li:person:${memberId}` } }
  );
  const { uploadUrl, document: documentUrn } = initResp.value;
  if (!uploadUrl || !documentUrn) {
    throw new Error('LinkedIn document initializeUpload did not return uploadUrl or document URN');
  }

  // Step 2 — upload binary
  const { mime } = detectFileType(filePath);
  const fileBuffer = readFileSync(filePath);
  const uploadResp = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
      'Content-Type': mime,
    },
    body: fileBuffer,
  });
  if (!uploadResp.ok) {
    const errText = await uploadResp.text();
    throw new Error(`Document binary upload failed: ${uploadResp.status} - ${errText}`);
  }

  return documentUrn;
}

// MCP Server tools implementation

// 1. Create Post  (uses versioned Posts API — compatible with LinkedIn-Version: 202401)
// filePath: optional absolute local path to an image or document to attach
async function createPost(text, mediaUrls = [], filePath = null) {
  const memberId = await resolveMemberId();
  const postData = {
    author: `urn:li:person:${memberId}`,
    commentary: text,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED',
      targetEntities: [],
      thirdPartyDistributionChannels: []
    },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false
  };

  // Attach a local file if provided
  if (filePath) {
    const { mediaType } = detectFileType(filePath);

    if (mediaType === 'image') {
      const imageUrn = await uploadImage(filePath, memberId);
      postData.content = {
        media: {
          id: imageUrn,
          altText: basename(filePath),
        }
      };
    } else if (mediaType === 'document') {
      const documentUrn = await uploadDocument(filePath, memberId);
      postData.content = {
        media: {
          id: documentUrn,
          title: basename(filePath),
        }
      };
    }
  }

  return linkedInRequest('/posts', 'POST', postData);
}

// 2. Get Profile
async function getProfile() {
  return linkedInRequest('/me');
}

// 3. Get Profile by ID
async function getProfileById(personId) {
  return linkedInRequest(`/people/${personId}`);
}

// 4. Get Post by ID
async function getPost(postId) {
  return linkedInRequest(`/ugcPosts/${postId}`);
}

// 5. Send Connection Request
async function sendConnection(profileId, message = null) {
  const body = {
    'invitationType': 'CONNECTION',
    'targetProfile': profileId
  };

  if (message) {
    body.invitationMessage = message;
  }

  return linkedInRequest('/invitation', 'POST', body);
}

// 6. Get Connections
// Requires r_network scope; may return 403 on apps without partner access
async function getConnections(start = 0, count = 10) {
  return linkedInRequest(`/connections?q=viewer&start=${start}&count=${count}`);
}

// 7. Get Network Updates — returns caller's recent posts as a proxy
async function getNetworkUpdates(count = 10) {
  const memberId = await resolveMemberId();
  const authorUrn = encodeURIComponent(`urn:li:person:${memberId}`);
  return linkedInRequest(`/ugcPosts?q=authors&authors=List(${authorUrn})&count=${count}`);
}

// 8. Get Profile Statistics
// Returns network size; detailed profile-view analytics require Marketing API access
async function getProfileStats() {
  const memberId = await resolveMemberId();
  const networkSize = await linkedInRequest(
    `/networkSizes/urn:li:person:${memberId}?edgeType=CompanyFollowedByMember`
  );
  return {
    networkSize: networkSize.firstDegreeSize || networkSize
  };
}

// 9. Search Companies
// Full keyword search requires Marketing API; this looks up by vanity name
async function searchCompanies(query, count = 10) {
  return linkedInRequest(`/organizations?q=vanityName&vanityName=${encodeURIComponent(query)}&count=${count}`);
}

// 10. Search People
// Keyword people search requires partner access; looks up by profile URL slug
async function searchPeople(query, currentCompany = null, count = 10) {
  throw new Error(
    'linkedin_person_search requires LinkedIn Partner API access (not available with a standard developer token). ' +
    'Use linkedin_person_fetch with a known profile ID instead.'
  );
}

// 11. Get User's Posts
// Reading posts requires r_member_social scope which LinkedIn restricts to partner apps.
// Standard developer tokens (w_member_social only) cannot list posts via the API.
async function getUserPosts(count = 10) {
  await resolveMemberId(); // validate auth first
  throw new Error(
    'linkedin_my_posts requires the r_member_social scope, which LinkedIn only grants to partner-level apps. ' +
    'Your token can create posts (linkedin_post_create) but cannot read them back via the API. ' +
    'To view your posts, visit https://www.linkedin.com/in/me/recent-activity/shares/'
  );
}

// 12. React to Post
async function reactToPost(postId, reactionType = 'LIKE') {
  const memberId = await resolveMemberId();
  const reactionData = {
    'actor': `urn:li:member:${memberId}`,
    'object': `urn:li:ugcPost:${postId}`,
    'reactionType': reactionType
  };

  return linkedInRequest('/socialActions', 'POST', reactionData);
}

// Export for MCP server
export default {
  createPost,
  getProfile,
  getProfileById,
  getPost,
  sendConnection,
  getConnections,
  getNetworkUpdates,
  getProfileStats,
  searchCompanies,
  searchPeople,
  getUserPosts,
  reactToPost,
  // Media upload helpers (exported for testing)
  detectFileType,
  uploadImage,
  uploadDocument,
};

// CLI test
if (process.argv[1]?.includes('linkedin-api')) {
  console.log('🔗 LinkedIn MCP Server - CLI Mode\n');

  if (!LINKEDIN_ACCESS_TOKEN) {
    console.log('❌ LINKEDIN_ACCESS_TOKEN not set');
    console.log('\nSet your token:');
    console.log('  export LINKEDIN_ACCESS_TOKEN="your_token"');
    process.exit(1);
  }

  // Quick CLI test
  (async () => {
    try {
      console.log('📋 Testing LinkedIn API...\n');

      const profile = await getProfile();
      console.log('✅ Connected as:', profile.id);
      console.log('   First name:', profile.firstName);
      console.log('   Last name:', profile.lastName);

      const posts = await getUserPosts(3);
      console.log('\n✅ Recent posts:', posts.elements?.length || 0);

    } catch (err) {
      console.log('❌ Error:', err.message);
    }
  })();
}
