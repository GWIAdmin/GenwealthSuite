const { ConfidentialClientApplication } = require('@azure/msal-node');

const cca = new ConfidentialClientApplication({
  auth: {
    clientId: process.env.CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
    clientSecret: process.env.CLIENT_SECRET
  }
});

module.exports.getToken = () =>
  cca.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default']
  }).then(res => res.accessToken);
