/**
 * 05-01-2018
 * The best app ever..
 * ~~ Scott Johnson
 */

/** List jshint ignore directives here. **/

const util = require( 'util' );
const exec = util.promisify( require( 'child_process' ).exec );
const notify = async function( cSubject ) {
   //var cmd;
   //86400 seconds = 24hrs
   //86400000 ms = 24hrs

   notify.messages.push( cSubject.substr( 0, 40 ).concat( '...' ) );
   clearTimeout( notify.timeout );
   notify.timeout = setTimeout( notify.send, 10 );
};// /notify()

notify.timeout = 0;
notify.messages = [];

notify.send = async function(){
   const cMessage = notify.messages.join( '\n' ).replace( /"/g, '\"' );
   await exec( `/usr/bin/kdialog --title "New Mail" --passivepopup "${cMessage}" 86400000` );
};// /send()

module.exports = notify;