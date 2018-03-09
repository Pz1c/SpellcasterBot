const WARLOCK_LOGIN    = process.argv[2];
const WARLOCK_PASSWORD = process.argv[3];

const SITE_LOGIN_URL = 'https://games.ravenblack.net/login';
const SITE_STATUS_URL = 'https://games.ravenblack.net/player';
const SITE_CHALLENGES_URL = 'https://games.ravenblack.net/challenges';
const SITE_ACCEPT_CHALLENGE_URL = 'https://games.ravenblack.net/accept?back=challenges&num=';
const SITE_BATTLE_URL = 'https://games.ravenblack.net/warlocks?num=';

var request = require('request');
var fs = require('fs');
var AI = require('./scb_ai.js');

var warlock_logined = false;
var fatal_error = false;
var battles_in_process = [];
var battles_in_ready = [];
var battles_in_wait = [];

function Cycle() {
  if (warlock_logined) {
    console.log('logined = true');
    checkReadyBattle();
    /*if (battles_in_process.length < 3) {
      checkChallenges();
    }*/
  } else {
    login();
  }
  
  /*
  if (!fatal_error) {
    setTimeout(Cycle, 5000);
  }*/
}

function nextCycle() {
  setTimeout(Cycle, 5000);
}

function login() {
  request.post({
      url:SITE_LOGIN_URL, 
      //proxy: 'http://localhost:4128',
      jar: true,
      followRedirect: false,
      form: {
        name: WARLOCK_LOGIN,
        password: WARLOCK_PASSWORD
        }
     }, function(err,httpResponse,body) {
        if (err) {
          console.log('error:', err); // Print the error if one occurred
          return;
        }
        console.log('statusCode:', httpResponse.statusCode, httpResponse.headers);
        console.log('body:', body); // Print the HTML for the Google homepage.
        if ((httpResponse.statusCode === 302) && (httpResponse.headers['location'] === 'player')) {
          warlock_logined = true;
          nextCycle();
        } else {
          fatal_error = true;
        }
  });
}

function checkReadyBattle() {
  request.get({
      url:SITE_STATUS_URL, 
      jar: true,
      followRedirect: true
     }, function(err,httpResponse,body) {
    if (err) {
      console.log('error:', err); // Print the error if one occurred
      return;
    }
    console.log('statusCode:', httpResponse.statusCode, httpResponse.headers);
    //console.log('body:', body); // Print the HTML for the Google homepage.
    battles_in_ready = parseBattles(body, 'Ready in battles');
    for (var i = 0, Ln = battles_in_ready.length; i < Ln; ++i) {
      if (battles_in_process.indexOf(battles_in_ready[i]) === -1) {
        battles_in_process.push(battles_in_ready[i]);
        startBattleProcessing(battles_in_ready[i]);
      }
    }
    battles_in_wait = parseBattles(body, 'Ready in battles');
    if (battles_in_ready.length + battles_in_wait.length < 5) {
      checkChallenges();
    } else {
      nextCycle();
    }
  });
}

function parseBattleTurn(body, battle) {
  battle.turn = getInt(getFieldValue(body, '<H2><U>Turn', ' ', ' '));
}

function parseBattleWarlockStatus(data, warlock) {
  if (data.indexOf('Surrendered') != -1) {
    warlock.hp = 0;  
  } else {
    warlock.hp = getInt(getFieldValue(data, 'Health', ':', [' ', ')']));
  }
}

function parseBattleWarlock(data, battle, warlock_code, login) {
  battle[warlock_code].login = login;
  battle[warlock_code].left = getFieldValue(data, '&nbsp;&nbsp;LH:', '<FONT CLASS=monoturn>', '</FONT>');
  battle[warlock_code].right = getFieldValue(data, '&nbsp;&nbsp;RH:', '<FONT CLASS=monoturn>', '</FONT>');
  parseBattleWarlockStatus(getFieldValue(data, '<TD CLASS=lightbg', '>', '</TD>'), battle[warlock_code]);
}


function parseBattleWarlocks(data, battle) {
  var idx1 = 0, idx2 = 0, idx3 = 0;
  while((idx1 = data.indexOf('href="/player/', idx1)) != -1) {
    idx1 += 14;
    idx3 = data.indexOf('.html', idx1);
    var login = data.substr(idx1, idx3 - idx1);
    idx2 = data.indexOf('</TABLE>', idx1);
    parseBattleWarlock(data.substr(idx1, idx2 - idx1), battle, login.toUpperCase() === WARLOCK_LOGIN.toUpperCase() ? 'self' : 'enemy', login);
  }  
}

function parseBattle(body) {
  var battle = {turn:0,enemy:{},self:{}};
  parseBattleTurn(body, battle);
  parseBattleWarlocks(body, battle);
  console.log('parseBattle', 'after', battle);
  return battle;
}

function storeBattleToFile(battle) {
  fs.writeFile('./data/battle_'+battle.battle_id+'.json', JSON.stringify(battle), 'utf8');
}

function loadBattleFromFile(battle_id) {
  var battle_json = fs.readFileSync('./data/battle_'+battle_id+'.json');
  return JSON.parse(battle_json);
}

function startBattleProcessing(battle_id) {
  request.get({
      url:SITE_BATTLE_URL + battle_id,
      jar: true,
      followRedirect: true
     }, function(err,httpResponse,body) {
    if (err) {
      console.log('error:', err); // Print the error if one occurred
      return;
    }
    console.log('statusCode:', httpResponse.statusCode, httpResponse.headers);
    //console.log('body:', body);
    
    var battle = parseBattle(body);
    battle.battle_id = battle_id;
    storeBattleToFile(battle);
    AI.processBattle(battle);
    process.exit(0);
  });
}

function parseBattles(body, search_key) {
  var res = [];
  var idx1 = body.indexOf(search_key);
  if (idx1 === -1) {
    return res;
  }
  var idx2 = body.indexOf('</TABLE></TD></TR>', idx1);
  var idx3 = idx1;
  while((idx3 = body.indexOf('HREF="/warlocks?num=', idx3)) != -1) {
    idx3 += 20;
    if (idx3 > idx2) {
      break;
    }
    var idx4 = body.indexOf('"', idx3);
    var battle_id = body.substr(idx3, idx4 - idx3);
    res.push(battle_id);
  }
  
  return res;
}

function parseChallengeTitle(title, battle) {
  var idx1 = 0, idx2;
  while ((idx1 = title.indexOf('HREF="/player/', idx1)) != -1) {
    idx1 += 14;
    idx2 = title.indexOf('.html', idx1);
    var warlock = title.substr(idx1, idx2 - idx1);
    battle.warlocks.push(warlock);
    ++battle.count;
  }
  idx1 = title.indexOf('Need ');
  if (idx1 === -1) {
    ++battle.count;
  } else {
    idx1 += 5;
    idx2 = title.indexOf(' ', idx1);
    var cnt = title.substr(idx1, idx2 - idx1) * 1;
    battle.count += cnt;
  }
}

function parseChallengeLevel(level, battle) {
  battle.fast = level.indexOf('Fast') != -1;
  if (level.indexOf('V.Friendly') != -1) {
    battle.level = 0;
  } else if (level.indexOf('Friendly') != -1) {
    battle.level = 1;
  } else {
    battle.level = 2;
  }
}

function parseChallengeDesc(description, battle) {
  battle.bot_allowed = description.indexOf('NO BOT') === -1;
  battle.desc = description;
}

function parseChallengeAccept(accept, battle) {
  battle.battle_id = 0;
  if (accept.indexOf('>Accept</A>') === -1) {
    return;
  }
  var idx1 = accept.indexOf('num=');
  if (idx1 === -1) {
    return;
  }
  idx1 += 4;
  var idx2 = accept.indexOf('"', idx1);
  battle.battle_id = accept.substr(idx1, idx2 - idx1);
}

function parseChallenge(row) {
  console.log('parseChallenge', row);
  var res = {warlocks:[],count:0,level:0,desc:'',fast:false,bot_allowed:true};
  var arr = row.split('</TD>');
  parseChallengeTitle(arr[0].replace('<TD>', ''), res);
  parseChallengeLevel(arr[1].replace('<TD>', ''), res);
  parseChallengeDesc(arr[2].replace('<TD>', ''), res);
  parseChallengeAccept(arr[3].replace('<TD>', ''), res);
  
  console.log('parseChallenge', res);
  return res;
}

function parseChallenges(body) {
  var res = [];
  var idx1 = body.indexOf('<TD CLASS=darkbg>Description</TD>');
  if (idx1 === -1) {
    return res;
  }
  idx1 = body.indexOf('<TR><TD>', idx1);
  var idx2 = body.indexOf('</TABLE>', idx1);
  var arr_table = body.substr(idx1, idx2 - idx1).split('</TR>');
  for (var i = 0, Ln = arr_table.length; i < Ln; ++i) {
    if (arr_table[i].indexOf('<TD>') === -1) {
      continue;
    }
    var challenge = parseChallenge(arr_table[i].replace('<TR>', ''));
    if (!challenge.bot_allowed || (challenge.battle_id === 0) || (challenge.level > 0) || (challenge.count > 2)) {
      continue;
    }
    res.push(challenge.battle_id);
  }
  
  return res;
}

//

function checkChallenges() {
  request.get({
      url:SITE_CHALLENGES_URL, 
      jar: true,
      followRedirect: true
     }, function(err,httpResponse,body) {
    if (err) {
      console.log('error:', err); // Print the error if one occurred
      return;
    }
    console.log('statusCode:', httpResponse.statusCode, httpResponse.headers);
    //console.log('body:', body); // Print the HTML for the Google homepage.
    var battles_to_accept = parseChallenges(body);
    var accepted_cnt = 0;
    for (var i = 0, Ln = battles_to_accept.length; i < Ln; ++i) {
      if (accepted_cnt + battles_in_ready.length + battles_in_wait.length < 5) {
        //acceptChallenge(battles_to_accept[i]);
        ++accepted_cnt;
      }
    }
    nextCycle();
  });
}

function acceptChallenge(battle_id) {
  request.get({
      url:SITE_ACCEPT_CHALLENGE_URL + battle_id, 
      jar: true,
      followRedirect: true
     }, function(err,httpResponse,body) {
    if (err) {
      console.log('error:', err); // Print the error if one occurred
      return;
    }
    console.log('statusCode:', httpResponse.statusCode, httpResponse.headers);
    //console.log('body:', body);
  });
}

function getFieldValue(data, search, value_from, value_to, from_idx) {
  if (!from_idx) {
    from_idx = 0;
  }
  if (!(value_to instanceof Array)) {
    value_to = [value_to];
  }
  var idx1 = data.indexOf(search, from_idx);
  if (idx1 === -1) {
    return '';
  }
  idx1 = data.indexOf(value_from, idx1);
  idx1 += value_from.length;
  
  var idx2 = data.length;
  for (var i = 0, Ln = value_to.length; i < Ln; ++i) {
    var idx = data.indexOf(value_to[i], idx1);
    if ((idx != -1) && (idx < idx2)) {
      idx2 = idx;      
    }
  }
  return data.substr(idx1, idx2 - idx1);
}

function getInt(str, with_sing) {
  return (with_sing === true ? str.replace(/[^0-9\-]/g, '') : str.replace(/[^0-9]/g, '')) * 1;
}

exports.cycle = Cycle;
exports.loadBattleFromFile = loadBattleFromFile;