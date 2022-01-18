/** List jshint ignore directives here. **/
const readline = require( 'readline' );

const prompt = function( cPromptMsg ){
   return new Promise(function( resolve ){
      var rl = readline.createInterface({
         input: process.stdin,
         output: process.stdout
      });

      rl.question( cPromptMsg, function(code) {
         rl.close();
         resolve( code );
      });
   });
};// /prompt()

module.exports = prompt;
