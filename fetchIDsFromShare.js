// fetchIdsFromShare.js
require('dotenv').config({ path: __dirname + '/server/.env' });
const { ConfidentialClientApplication } = require('@azure/msal-node');
const fetch = global.fetch || require('node-fetch');

const msalConfig = {
  auth: {
    clientId:     process.env.CLIENT_ID,
    authority:    `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
    clientSecret: process.env.CLIENT_SECRET
  }
};
const cca = new ConfidentialClientApplication(msalConfig);

async function getToken() {
  const r = await cca.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default']
  });
  return r.accessToken;
}

async function main() {
  const token = await getToken();
  const headers = { Authorization: `Bearer ${token}` };

  const shareEncoded = process.env.SHARE_ENCODED;
  if (!shareEncoded) {
    console.error('▶️  Please set SHARE_ENCODED in server/.env');
    process.exit(1);
  }

  // 1) Fetch the driveItem resource via the share link
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/shares/u!${shareEncoded}/driveItem`,
    { headers }
  );
  const j = await res.json();
  console.log('📦 driveItem resource:', JSON.stringify(j, null, 2));
  console.log('🗂️ mimeType:', j.file?.mimeType);

  // 2) Extract both IDs
  const driveId = j.parentReference?.driveId;
  const itemId  = j.id;
  if (!driveId || !itemId) {
    console.error('❌ Could not find parentReference.driveId or id in response');
    process.exit(1);
  }

  console.log(`\n✅ DRIVE_ID     = ${driveId}`);
  console.log(`✅ DRIVE_ITEM_ID= ${itemId}`);
}

main().catch(e => {
  console.error('❌ Error fetching IDs:', e);
  process.exit(1);
});
