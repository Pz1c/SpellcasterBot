const WebClient = require('./game_module/scb_http.js');
const AI = require('./game_module/scb_ai.js');

// start main cycle
if (process.argv[2] === 'load') {
  var battle = WebClient.loadBattleFromFile(process.argv[3]);
  AI.processBattle(battle);
} else {
  WebClient.cycle(); 
}