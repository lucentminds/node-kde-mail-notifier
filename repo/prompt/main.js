/** List jshint ignore directives here. **/
/* jshint undef: true, unused: true */
/* jslint node: true */
/* jshint esversion:8 */
/* eslint-env es8 */

const readline = require( 'readline' );
const Q = require( 'q' );

const prompt = module.exports = function( cPromptMsg ){
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