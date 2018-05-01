

/** List jshint ignore directives here. **/
/* jslint node: true */

// https://developers.google.com/gmail/api/quickstart/nodejs
var fs = require( 'fs' );
var path = require( 'path' );
var Q = require( 'q' );
var fse = require( 'fs-extra' );
var readline = require( 'readline' );
var google = require( 'googleapis' );
var googleAuth = require( 'google-auth-library' );
var Gmail = require( './lib/gmail' );
var notify = require( './lib/notify' );
var DIR_APP = __dirname;


// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
var APP_USER_DIR = (process.env.HOME || process.env.HOMEPATH ||
   process.env.USERPROFILE) + '/.nkmn-credentials/';
var TOKEN_PATH = APP_USER_DIR + 'nkmn.json';
var PATH_NOTIFIED = path.resolve( DIR_APP, './notified.json' );
var PATH_LAST_DATE = path.resolve( DIR_APP, './last_date.txt' );
var PATH_CLIENT_SECRET = path.resolve( DIR_APP, './client_secret.json' );
var PATH_LOG = path.resolve( DIR_APP, './log.txt' );


fs.writeFileSync( PATH_LOG, new Date().toLocaleString() );

var gapi = (function(){
   var self = {};

   self.loadCredentials = function(){
      
      return readFile( PATH_CLIENT_SECRET )
      .then( function( cContent ) {
         var oClientSecret = JSON.parse( cContent );

         return oClientSecret;
      });

   };// /loadCredentials()

   /**
    * Create an OAuth2 client with the given credentials, and then execute the
    * given callback function.
    *
    * @param {Object} credentials The authorization client credentials.
    * @param {function} callback The callback to call with the authorized client.
    */
   self.authorize = function( credentials ) {
      var clientSecret = credentials.installed.client_secret;
      var clientId = credentials.installed.client_id;
      var redirectUrl = credentials.installed.redirect_uris[0];
      var auth = new googleAuth();
      var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

      // Check if we have previously stored a token.
      return readFile( TOKEN_PATH )
      .then( 

      // Success!
      function( token ){

         oauth2Client.credentials = JSON.parse( token );
         return oauth2Client;

      },
      
      // Fail!
      function(){
         return self.getNewToken( oauth2Client );
      } );
   };// /authorize()

   /**
    * Get and store new token after prompting for user authorization, and then
    * execute the given callback with the authorized OAuth2 client.
    *
    * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
    * @param {getEventsCallback} callback The callback to call with the authorized
    *     client.
    */
   self.getNewToken = function( oauth2Client ) {

      var authUrl = oauth2Client.generateAuthUrl({
         access_type: 'offline',
         scope: SCOPES
      });

      console.log('Authorize this app by visiting this url: \n', authUrl, '\n' );

      return prompt( 'Enter the code from that page here: ' )
      .then( function( cCode ){
         var deferred = Q.defer();

         oauth2Client.getToken( cCode, function( err, cToken ) {
            if (err) {
               console.log('Error while trying to retrieve access token', err);
               process.exit( 1 );
               return;
            }

            oauth2Client.credentials = cToken;

            deferred.resolve( cToken );
         });

         return deferred.promise;
      })
      .then( function( cToken ){
         // storeToken
         // Store token to disk be used in later program executions.

         try {
            fs.mkdirSync( APP_USER_DIR );

         }
         catch ( err ) {
            if ( err.code != 'EEXIST' ) {
               console.log( err );
               process.exit( 1 );
            }
         }

         fs.writeFile( TOKEN_PATH, JSON.stringify( cToken ) );
         console.log( 'Token stored to ' + TOKEN_PATH );
         return oauth2Client;
      });

   };// /getNewToken()

   return self;
}());


function main() {
   var gmail;

   gapi.loadCredentials()
   .then( gapi.authorize )
   .then( function( auth ){
      gmail = Gmail( auth );

      return gmail.getMessageIds();
   } )

   
   .then(function( aIdList ){
      return Q.all([
         readFile( PATH_LAST_DATE ),
         gmail.getMessages( aIdList )
      ]);
   })

   
   .then(function( aResults ){
      var cLastTime = aResults[0].toString( 'utf8' );
      var aMessages = aResults[ 1 ];
      var tLastTime = new Date( cLastTime );
      var aFiltered;

      // Filter out any messages that are not greater than the last time.
      aFiltered = aMessages.filter(function( m ){
         return new Date( m.date ) > tLastTime;
      });

      // Sort by newest messages on top.
      aFiltered.sort(function( a, b ){
         return new Date( b.date ) - new Date( a.date );
      });

      return aFiltered;
   })

   .then(function( aMessages ){
      var i, l;
      var cLastTime;

      if( aMessages.length > 0 ) {

         for( i = 0, l = aMessages.length; i < l; i++ ) {
            notify( aMessages[ i ].subject );
         }// /for()

         cLastTime = new Date( aMessages[ 0 ].date ).toString();

         return writeFile( PATH_LAST_DATE, cLastTime, 'utf8' );

      }

      return Promise.resolve();
   }).done();

   // var gmail = google.gmail( 'v1' );
   // gmail.users.labels.list({
   // 	auth: auth,
   // 	userId: 'me',
   // }, function(err, response) {
   // 	if (err) {
   // 		console.log('The API returned an error: ' + err);
   // 		return;
   // 	}

   //     console.log( response );
   // 	var messages = response.messages;

   // 	if (messages.length == 0) {
   // 		console.log('No messages found.');
   // 	} 
   //     else {
   // 		console.log('messages:');

   // 		for (var i = 0; i < messages.length; i++) {
   // 			var msg = messages[i];
   // 			console.log('- %s', msg.id);
   // 		}// /for()
   // 	}
   // });
}// /main()




var readFile = function( cPath ){
   var deferred = Q.defer();

   fs.readFile( cPath, 'utf8', function( err, cData ){
      if( err ) {
         return deferred.reject( err );
      }
      
      deferred.resolve( cData );
   });

   return deferred.promise;
};// /readFile()

var prompt = function( cPromptMsg ){
   var deferred = Q.defer();

   var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
   });

   rl.question( cPromptMsg, function(code) {
      rl.close();
      
      deferred.resolve( code );
   });

   return deferred.promise;
};// /prompt()

var readFile = Q.denodeify( fs.readFile );
var writeFile = Q.denodeify( fs.writeFile );

main();