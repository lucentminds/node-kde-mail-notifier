

/** List jshint ignore directives here. **/
/* jslint node: true */

// https://developers.google.com/gmail/api/quickstart/nodejs
var child_process = require( 'child_process' );
var fs = require( 'fs' );
var path = require( 'path' );
var Q = require( 'q' );
var fse = require( 'fs-extra' );
var readline = require( 'readline' );
var google = require( 'googleapis' );
var googleAuth = require( 'google-auth-library' );
var DIR_APP = __dirname;


// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/gmail-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
var APP_USER_DIR = (process.env.HOME || process.env.HOMEPATH ||
	process.env.USERPROFILE) + '/.nkmn-credentials/';
var TOKEN_PATH = APP_USER_DIR + 'nkmn.json';
var PATH_NOTIFIED = path.resolve( DIR_APP, './notified.json' );
var PATH_CLIENT_SECRET = path.resolve( DIR_APP, './client_secret.json' );
var PATH_LOG = path.resolve( DIR_APP, './log.txt' );
var PATH_SCRIPT = path.resolve( DIR_APP, './notify.sh' );


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
		return gmail.filterOutNotified( aIdList );
	})
	.then(function( oMsgList ){
		var i, aProm = [];

		for( i in oMsgList ) {
			aProm.push( gmail.getMessage( i ) );
		}// /for()

		return Q.all( aProm );
	})
	.then(function( aMessages ){
		var i, l;
		console.log( aMessages );

		for( i = 0, l = aMessages.length; i < l; i++ ) {
			notify( aMessages[ i ].subject );
		}// /for()

		return gmail.addMessages( aMessages );
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

var Gmail = function( auth ) {
    // https://developers.google.com/gmail/api/v1/reference/
	var gmail = google.gmail( 'v1' );
	var notified = Notified();


    var self = {
        filterOutNotified: function( aIdList ){
			return notified.get()
			.then(function( oNotified ){
				var i, l = aIdList.length, cId;
				var oNot = {};

				for( i = 0; i < l; i++ ) {
					cId = aIdList[ i ].id;
					if( typeof oNotified[ cId ] == 'undefined' ) {
						oNot[ cId ] = null;
					}
				}// /for()

				// Return a new object with the un-notified ids in the list.
				return oNot;
			});

        },// /filterOutNotified()

        getMessageIds: function(){
            var deferred = Q.defer();

            gmail.users.messages.list({
                auth: auth,
                userId: 'me',
				labelIds: 'INBOX',
				maxResults: 10
            }, function( err, response ) {
                if ( err ) {
                    return deferred.reject( err );
                }

                deferred.resolve( response.messages );
                
            });

            return deferred.promise;
        },// /getMessageIds()

        getMessage: function( cId ){
            var deferred = Q.defer();
			var oMsg = null;

            gmail.users.messages.get({
                auth: auth,
                userId: 'me',
                id: cId,
				format: 'metadata',
				metadataHeaders: 'Subject'
            }, function( err, response ) {
                if ( err ) {
                    return deferred.reject( err );
                }

				oMsg = {
					id: cId,
					subject: response.payload.headers[0].value
				};

                deferred.resolve( oMsg );
                
            });

            return deferred.promise;
        },// /getMessage()


		
		addMessages: function( aAppend ){

			return notified.get()
			.then(function( oNotified ){
				var cId, i, l = aAppend.length;

				for( i = 0; i < l; i++ ) {
					cId = aAppend[ i ].id;
					oNotified[ cId ] = aAppend[ i ].subject;
				}// /for()

				return notified.set( oNotified );
			});

		}// /addMessages()
    };// /self{}

    return self;
};// /Gmail()


var Notified = function(){

	var fetch = function(){
		return ensureFile( PATH_NOTIFIED )
		.then(function( cPath ){
			return readFile( cPath );
		})
		.then(function( cContents ){
			return parseJson( cContents, {} );
		});
		// .then(function( aNotified ){
		// 	return parseJson( cContents, [] );
		// })
		// .done();

	};// /fetch()

	var self = {
		get: fetch,
		
		set: function( aNotified ){
    		var deferred = Q.defer();
			var cJson = JSON.stringify( aNotified ).concat( '\n' );

			fs.writeFile( PATH_NOTIFIED, cJson, 'utf8', function( err ){
				if( err ) {
					return deferred.reject( err );
				}
				
				deferred.resolve( aNotified );

			});

    		return deferred.promise;
		}// /set()
	};// /self()

	return self;
};// /Notified()

var ensureFile = function( cPath ){
    var deferred = Q.defer();

	fse.ensureFile( cPath, function( err ){
		if( err ) {
			return deferred.reject( err );
		}
		
		// file has now been created, including the directory it is to be placed in
		deferred.resolve( cPath );
	});

    return deferred.promise;
};// /ensureFile()

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

var parseJson = function( cJson, defaultValue ){
    var deferred = Q.defer();
	var jsonResult = defaultValue;

	try {
		jsonResult = JSON.parse( cJson );
	} catch( e ){}
	
	deferred.resolve( jsonResult );

    return deferred.promise;
};// /parseJson()


var notify = function( cSubject ) {
	//var cmd;
	//86400 seconds = 24hrs
	//86400000 ms = 24hrs

	notify.messages.push( cSubject.substr( 0, 40 ).concat( '...' ) );

	clearTimeout( notify.timeout );

	notify.timeout = setTimeout( notify.send, 10 );

	

	// //cmd = ''.concat( 'export DISPLAY=:0; export XAUTHORITY=~/.Xauthority; notify-send ',cSubject,' -t 86400 | at now &' );
	// cmd = ''.concat( ''.concat( 'DISPLAY=:0.0 XAUTHORITY=~/.Xauthority notify-send "',cSubject,'\na\na" -t 86400' ) );

	// //child_process.exec( '' );
	// child_process.exec( cmd );
};// /addToDialog()

notify.timeout = 0;

notify.messages = [];

notify.send = function(){
	var cMessage = notify.messages.join( '\n' ); //.replace( /"/g, '\"' );

	// Does not work in a non-x environment like crontab.
	// http://www.commandlinefu.com/commands/view/6167/i-finally-found-out-how-to-use-notify-send-with-at-or-cron
	// cmd = ''.concat( 'kdialog --title "New E-mails" --passivepopup "',cSubject,'..." 86400' );

	// DISPLAY=:0.0 XAUTHORITY=~/.Xauthority notify-send "This is my test." -t 86400000
	child_process.execFile( PATH_SCRIPT, [cMessage] );
};// /send()

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


main();