const { ConfidentialClientApplication } = require('@azure/msal-node');

const cca = new ConfidentialClientApplication({
  auth: {
    clientId:     process.env.CLIENT_ID,
    authority:    `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
    clientSecret: process.env.CLIENT_SECRET,
  }
});

   async function getToken() {
     const result = await cca.acquireTokenByClientCredential({
       scopes: ['https://graph.microsoft.com/.default']
     });
     if (!result || !result.accessToken) {
      throw new Error(
        'Failed to acquire access token; MSAL result: ' +
        JSON.stringify(result, null, 2)
      );
     }
     return result.accessToken;
   }

   module.exports = { getToken };
