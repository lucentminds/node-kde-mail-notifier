/** List jshint ignore directives here. **/
/* jshint undef: true, unused: true */
/* jslint node: true */
/* jshint esversion:8 */
/* eslint-env es8 */

// const Q = require( 'q' );
const logger = require( './logger' );
const SampleClient = require('./sample-client');
const {google} = require('googleapis');
const resolve_path = require( 'promise-resolve-path' );
const read = require( 'promise-file-read' );
const fsp = require( 'fs' ).promises;
// const write = require( 'promise-file-write' );
const write = fsp.writeFile;

const Gmail = function( o_options ){
   const o_settings = Object.assign({
      path_credentials: null,
      client_id: null,
      client_secret: null,
      redirect_uris: null
   }, o_options );

   const gmail_client = new SampleClient({
      client_id: o_settings.client_id,
      client_secret: o_settings.client_secret,
      redirect_uris: o_settings.redirect_uris
   });

   const gmail = google.gmail({
      version: 'v1',
      auth: gmail_client.oAuth2Client,
   });
   const self = {};

   self.authorize = function(){
      return resolve_path( o_settings.path_credentials, true )
      .catch(function( /* err */ ){
         const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

         console.log( `Authenticating for new tokens...\n` );

         return gmail_client.authenticate(scopes)
         .then( async function( oAuth2Client ){
            const o_credentials = oAuth2Client.credentials;
            const c_credentials = JSON.stringify( o_credentials, null, '   ' );

            console.log( `Writing credentials file "${o_settings.path_credentials}"...\n` );
            return write( o_settings.path_credentials, c_credentials, { encoding: 'utf-8'} );
         });
      })
      .then(function(){
         const c_resolved_path = o_settings.path_credentials;
         logger( 'info', `Reading credentials file "${c_resolved_path}"...` );
         return read( c_resolved_path, 'utf-8' );
      })
      .then(function( c_credentials_json ){
         logger( 'info', `Credentials file read.` );
         const o_credentials = JSON.parse( c_credentials_json );
         gmail_client.oAuth2Client.credentials = o_credentials;
      })
      .catch(function( err ){
         console.error( err );
         process.exit( 1 );
      });

   };// /authorize()

   self.fetch_message_ids = function(){
      return gmail.users.messages.list({
         userId: 'me',
         maxResults: 10,
         labelIds: 'INBOX'
      })
      .then(function( res ){
         return res.data.messages;

      });
      //console.log('res.data', res.data);
   };// /fetch_message_ids()

   self.fetch_messages = function( a_idlist ){
         var i, l, cId, a_queue = [];

         // Loop over each message and fetch it.
         for( i = 0, l = a_idlist.length; i < l; i++ ) {
            cId = a_idlist[ i ].id;
            a_queue.push( self.fetch_message( cId ) );
         }// /for()

         return Promise.all( a_queue );

   };// /fetch_messages()

   self.fetch_message = function( c_message_id ){
      // var deferred = Q.defer();

      return gmail.users.messages.get({
         userId: 'me',
         id: c_message_id,
         format: 'metadata',
         metadataHeaders: [ 'Subject', 'Date' ]
      })
      .then(function( o_response_resource ){
         // console.log( 'o_response_resource', o_response_resource );
         var o_message = null;
         var i, l, a_headers, o_header, c_header_name;

         a_headers = o_response_resource.data.payload.headers;

         o_message = {
            id: c_message_id,
            date: null,
            subject: null
         };

         for( i = 0, l = a_headers.length; i < l; i++ ) {
            o_header = a_headers[ i ];
            c_header_name = o_header.name.toLowerCase();
            o_message[ c_header_name ] = o_header.value;

            if( c_header_name == 'date' ) {
               o_message[ c_header_name ] = new Date( o_header.value ).toString();
            }
         }// /for()

         return o_message;

         // deferred.resolve( oMsg );

      })
      .catch(function( err ){
         logger( 'error', err );
         process.exit( 1 );
      });

      // return deferred.promise;

   };// /fetch_message()

   return self;
};// /Gmail()

module.exports = Gmail;