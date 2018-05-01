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

var child_process = require( 'child_process' );
var path = require( 'path' );
//var Q = require( 'q' );
//var deferred = Q.defer();
var PATH_SCRIPT = path.resolve( __dirname, './notify.sh' );
var notify = module.exports = function( cSubject ) {
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