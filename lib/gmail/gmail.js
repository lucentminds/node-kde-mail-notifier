/**
 * 05-01-2018
 * The best app ever..
 * ~~ Scott Johnson
 */


/** List jshint ignore directives here. **/
/* jshint undef: true, unused: true */
/* jslint node: true */
/* jshint esversion:6 */
/* eslint-env es6 */

var Q = require( 'q' );
var google = require( 'googleapis' );

var Gmail = module.exports = function( auth ) { // jshint ignore:line
   // https://developers.google.com/gmail/api/v1/reference/
   var gmail = google.gmail( 'v1' );


   var self = {

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

      getMessages: function( aIds ){
         var i, l, cId, aQueue = [];

         // Loop over each message and fetch it.
         for( i = 0, l = aIds.length; i < l; i++ ) {
            cId = aIds[ i ].id;
            aQueue.push( self.getMessage( cId ) );
         }// /for()

         return Q.all( aQueue );
      },// /getMessages()

      getMessage: function( cId ){
         var deferred = Q.defer();

         gmail.users.messages.get({
            auth: auth,
            userId: 'me',
            id: cId,
         format: 'metadata',
         metadataHeaders: [ 'Subject', 'Date' ]
         }, function( err, response ) {
            var oMsg = null;
            var i, l, aHeaders, oHead, cName;

            if ( err ) {
               return deferred.reject( err );
            }

            aHeaders = response.payload.headers;

            oMsg = {
               id: cId,
               date: null,
               subject: null
            };

            for( i = 0, l = aHeaders.length; i < l; i++ ) {
               oHead = aHeaders[ i ];
               cName = oHead.name.toLowerCase();
               oMsg[ cName ] = oHead.value;

               if( cName == 'date' ) {
                  oMsg[ cName ] = new Date( oHead.value ).toString();
               }
            }// /for()

            deferred.resolve( oMsg );
            
         });

         return deferred.promise;
      }// /getMessage()

   };// /self{}

   return self;
};// /Gmail();