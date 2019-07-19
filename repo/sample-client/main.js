/** List jshint ignore directives here. **/
/* jshint undef: true, unused: true */
/* jslint node: true */
/* jshint esversion:8 */
/* eslint-env es8 */

'use strict';

/**
 * This is used by several samples to easily provide an oauth2 workflow.
 */

const {google} = require('googleapis');
const http = require('http');
const url = require('url');
const opn = require('open');
const destroyer = require('server-destroy');
const fs = require('fs');
const path = require('path');
const prompt = require( 'prompt');

const keyPath = path.join(__dirname, 'oauth2.keys.json');
let keys = {
   redirect_uris: ['http://localhost:3000/oauth2callback'],
};
if (fs.existsSync(keyPath)) {
   const keyFile = require(keyPath);
   keys = keyFile.installed || keyFile.web;
}

const invalidRedirectUri = `The provided keyfile does not define a valid
redirect URI. There must be at least one redirect URI defined, and this sample
assumes it redirects to 'http://localhost:3000/oauth2callback'.  Please edit
your keyfile, and add a 'redirect_uris' section.  For example:

"redirect_uris": [
  "http://localhost:3000/oauth2callback"
]
`;

class SampleClient {
   constructor(o_options) {
      this._options = Object.assign( {scopes: []}, o_options );
      // console.log( 'options', this._options );
      // process.exit();

      // validate the redirectUri.  This is a frequent cause of confusion.
      if (!this._options.redirect_uris || this._options.redirect_uris.length === 0) {
         throw new Error(invalidRedirectUri);
      }
      const redirectUri = this._options.redirect_uris[0];

      // create an oAuth client to authorize the API call
      this.oAuth2Client = new google.auth.OAuth2( this._options.client_id, this._options.client_secret, redirectUri
      );
   }

  // Open an http server to accept the oauth callback. In this
  // simple example, the only request to our webserver is to
  // /oauth2callback?code=<code>
   async authenticate(scopes) {
      var self = this;
         return new Promise((resolve, reject) => {
            // grab the url that will be used for authorization
            this.authorizeUrl = this.oAuth2Client.generateAuthUrl({
               access_type: 'offline',
               scope: scopes.join(' '),
            });
            
            console.log( `Authorize this app by visiting this url: \n\n${this.authorizeUrl}\n\n` );

            return prompt( 'Enter the code from that page here: ' )
            .then(function( c_code ){
               // console.log( c_code );
               return self.oAuth2Client.getToken( c_code );
            })
            .then(
            //getToken success
            function( o_response ){
               // console.log( 'c_token', o_response.tokens );
               // process.exit();
               self.oAuth2Client.credentials = o_response.tokens;

               resolve( self.oAuth2Client );
            },

            //getToken error
            function( err ){
               console.log('Error while trying to retrieve access token', err);
               process.exit( 1 );
               return;
            });
            
         });
      }
}

module.exports = SampleClient;