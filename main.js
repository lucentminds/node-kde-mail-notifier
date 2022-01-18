/** List jshint ignore directives here. **/
/* jshint undef: true, unused: true */
/* jslint node: true */
/* jshint esversion:8 */
/* eslint-env es8 */

'use strict';
process.chdir( __dirname );
require('dotenv').config();
const path = require( 'path' );
// const Q = require( 'q' );
const logger = require( './lib/logger' );
const read = require( 'promise-file-read' );
const fsp = require( 'fs' ).promises;
// const write = require( 'promise-file-write' );
const write = fsp.writeFile;
const notify = require( './lib/kde-notify' );
const Gmail = require( './lib/gmail' );
const PATH_CREDENTIALS = path.join( __dirname, 'credentials.json' );
const PATH_LAST_DATE = path.join( __dirname, 'last_date.txt' );
logger( 'info', 'PATH_CREDENTIALS:', PATH_CREDENTIALS );
logger( 'info', 'PATH_LAST_DATE:', PATH_LAST_DATE );
logger( 'info', 'process.env.REDIRECT_URIS', process.env.REDIRECT_URIS );
main();

async function main(){
   const gmailer = Gmail({
      path_credentials: PATH_CREDENTIALS,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uris: JSON.parse( process.env.REDIRECT_URIS )
   });

   if (module === require.main) {
      await gmailer.authorize();      
      const a_idlist = await gmailer.fetch_message_ids();
      const a_results = await Promise.all([
         read( PATH_LAST_DATE ),
         gmailer.fetch_messages( a_idlist ),
      ]);
      const c_last_date = a_results[0];
      const a_messages = a_results[1];
      logger( 'info', `There are ${a_messages.length} messages fetched.` );

      // Determines the last datetime of the last message we notified the user of.
      const t_last_date = new Date( c_last_date );
      logger( 'info', `Last notification date: ${t_last_date}.` );

      // Filter out any messages that are not greater than the last time.
      const a_filtered = a_messages.filter(function( m ){
         const t_msg_date = new Date( m.date );
         logger( 'info', `Message date: ${t_msg_date}.` );
         return new Date( m.date ) > t_last_date;
      });

      // Sort by newest messages on top.
      a_filtered.sort(function( a, b ){
         return new Date( b.date ) - new Date( a.date );
      });

      var c_last_time;
      logger( 'info', `Waiting for ${a_filtered.length} new messages to be notified...` );

      if( a_filtered.length > 0 ) {
         const a_promises = a_filtered.map(function( o_msg ){
            return notify( o_msg.subject );
         });

         await Promise.all( a_promises );

         c_last_time = new Date( a_filtered[ 0 ].date ).toString();
         await write( PATH_LAST_DATE, c_last_time, 'utf8' );
      }

      logger( 'info', `Done.` );
   }// /if()
}// /main()