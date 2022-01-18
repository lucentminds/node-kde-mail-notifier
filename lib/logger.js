'use strict';
const path = require( 'path' );
const chalk = require( 'chalk' );
const fs = require( 'fs' );
const PATH_LOG = path.resolve( __dirname, '..', 'output.log' );
const PATH_KALARM_LOG = path.resolve( __dirname, '..', 'output_kalarm.log' );
fs.writeFileSync( PATH_LOG, '', 'utf-8' );
fs.writeFileSync( PATH_KALARM_LOG, '', 'utf-8' );

const logger = function( c_level ){
   var colorize = null;
   const a_args = [].slice.call( arguments, 1 )
   .map(function( value ){
      if( typeof value == 'object' ){
         return JSON.stringify( value );
      }
      return value;
   });
   const a_message = [`[${format_datetime( new Date() )}]`].concat( a_args );
   switch( c_level ){
   case 'error':
      colorize = chalk.bgRed;
      break;
      
   case 'info':
      colorize = chalk.cyan;
      break;
      
   default:
      write( `Invalid log level "${c_level}"` );
      console.log( chalk.bgRedBright( `Invalid log level "${c_level}"` ) );
      process.exit(1);
   }// /switch()
   
   write( a_message.join( ' ' ).concat( '\n' ) );
   console.log( colorize( a_message.join( ' ' ) ) );
};// /logger()

const write = function( c_content ){
   fs.writeFileSync( PATH_LOG, c_content, {
      encoding: 'utf-8',
      flag: 'a',
   } );
};// /write()

const format_datetime = function( o_date ){
   var a_date = [
      ''.concat( o_date.getMonth()+1 ).padStart( 2, '0' ),
      ''.concat( o_date.getDate() ).padStart( 2, '0' ),
      ''.concat( o_date.getFullYear() ).padStart( 2, '0' )
   ];
   var a_time = [
      ''.concat( o_date.getHours() ).padStart( 2, '0' ),
      ''.concat( o_date.getMinutes() ).padStart( 2, '0' ),
      ''.concat( o_date.getSeconds() ).padStart( 2, '0' ),
   ];
   return ''.concat( a_date.join( '/' ), ' ', a_time.join( ':' ) );
};// /format_datetime()

module.exports = logger;
