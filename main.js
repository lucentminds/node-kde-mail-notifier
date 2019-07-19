/** List jshint ignore directives here. **/
/* jshint undef: true, unused: true */
/* jslint node: true */
/* jshint esversion:8 */
/* eslint-env es8 */

'use strict';
require('dotenv').config();
const path = require( 'path' );
const Q = require( 'q' );
const read = require( 'promise-file-read' );
const write = require( 'promise-file-write' );
const notify = require( 'kde-notify' );
const Gmail = require( 'gmail' );
const PATH_CREDENTIALS = path.resolve( './.credentials.json' );
const PATH_LAST_DATE = path.resolve( './last_date.txt' );

const gmailer = Gmail({
   path_credentials: PATH_CREDENTIALS,
   client_id: process.env.CLIENT_ID,
   client_secret: process.env.CLIENT_SECRET,
   redirect_uris: JSON.parse( process.env.REDIRECT_URIS )
});

if (module === require.main) {
   gmailer.authorize()
   .then(function(  ){
      return gmailer.fetch_message_ids();

   })
   .then(function( a_idlist ){
      return Q.all([
         read( PATH_LAST_DATE ),
         gmailer.fetch_messages( a_idlist )
      ]);

   })
   .then( function( a_results ){
      const c_last_date = a_results[0];
      const a_messages = a_results[1];

      // Determines the last datetime of the last message we notified the user of.
      const t_last_date = new Date( c_last_date );

      // Filter out any messages that are not greater than the last time.
      const a_filtered = a_messages.filter(function( m ){
         return new Date( m.date ) > t_last_date;
      });

      // Sort by newest messages on top.
      a_filtered.sort(function( a, b ){
         return new Date( b.date ) - new Date( a.date );
      });

      return a_filtered;
   })

   .then(function( a_messages ){
      var i, l;
      var c_last_time;

      if( a_messages.length > 0 ) {

         for( i = 0, l = a_messages.length; i < l; i++ ) {
            notify( a_messages[ i ].subject );
         }// /for()

         c_last_time = new Date( a_messages[ 0 ].date ).toString();

         return write( PATH_LAST_DATE, c_last_time, 'utf8' );

      }

      return Promise.resolve();
   }).done();
}// /if()
