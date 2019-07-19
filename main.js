/** List jshint ignore directives here. **/
/* jshint undef: true, unused: true */
/* jslint node: true */
/* jshint esversion:8 */
/* eslint-env es8 */

'use strict';
require('dotenv').config();
const {google} = require('googleapis');
const SampleClient = require('sample-client');
const sample_client = new SampleClient({
   client_id: process.env.CLIENT_ID,
   client_secret: process.env.CLIENT_SECRET,
   redirect_uris: JSON.parse( process.env.REDIRECT_URIS )
});
const gmail = google.gmail({
  version: 'v1',
  auth: sample_client.oAuth2Client,
});

async function runSample() {
  const res = await gmail.users.messages.list({userId: 'me'});
  console.log('res.data', res.data);
  return res.data;
}

if (module === require.main) {
  const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
  sample_client
    .authenticate(scopes)
    .then(runSample)
    .catch(console.error);
}

module.exports = {
  runSample,
  client: sample_client.oAuth2Client,
};