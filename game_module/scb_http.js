var ARR_WARLOCK_LOGIN = process.argv[2].split(',');
var WARLOCK_IDX       = 0;
var WARLOCK_LOGIN     = ARR_WARLOCK_LOGIN[WARLOCK_IDX];
var WARLOCK_PASSWORD  = process.argv[3];

const SITE_LOGIN_URL = 'https://games.ravenblack.net/login';
const SITE_STATUS_URL = 'https://games.ravenblack.net/player';
const SITE_CHALLENGES_URL = 'https://games.ravenblack.net/challenges';
const SITE_NEW_CHALLENGES_URL = 'https://games.ravenblack.net/newchallenge';
const SITE_ACCEPT_CHALLENGE_URL = 'https://games.ravenblack.net/accept?back=challenges&num=';
const SITE_BATTLE_URL = 'https://games.ravenblack.net/warlocks?num=';
const SITE_WARLOCK_SUBMIT = 'https://games.ravenblack.net/warlocksubmit';
var request = require('request');
var fs = require('fs');

const CHALLENGE_ADD_CONDITION = 2;
const CHALLENGE_ACCEPT_CONDITION = 5;

const CYCLE_TIMEMOUT = 20 * 1000;// 20 sec * 3 

var warlock_logined = false;
var fatal_error = false;
var battles_in_process = [];
var battles_in_ready = [];
var battles_in_wait = [];

var idx = 0;
function Cycle() {
  console.log('Cycle ' + (++idx));
  if (warlock_logined) {
    console.log('logined = true');
    checkActiveBattle();
  } else {
    login();
  }
  
  /*
  if (!fatal_error) {
    setTimeout(Cycle, 5000);
  }*/
}

function nextCycle(force) {
  console.log('nextCycle', force, CYCLE_TIMEMOUT);
  if (!force) {// change login
    if (++WARLOCK_IDX >= ARR_WARLOCK_LOGIN.length) {
      WARLOCK_IDX = 0;
    }
    WARLOCK_LOGIN = ARR_WARLOCK_LOGIN[WARLOCK_IDX];
    warlock_logined = false;
    console.log('Change login', WARLOCK_LOGIN);
  }
  setTimeout(Cycle, force ? 1000 : CYCLE_TIMEMOUT);
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
          nextCycle();
          return;
        }
        console.log('login', 'statusCode:', httpResponse.statusCode, httpResponse.headers);
        //console.log('body:', body); // Print the HTML for the Google homepage.
        if ((httpResponse.statusCode === 302) && (httpResponse.headers['location'] === 'player')) {
          warlock_logined = true;
          nextCycle(true);
        } else if (httpResponse.statusCode === 200) {
          fatal_error = true;
        } else {
          nextCycle();
        }
  });
}

function checkActiveBattle() {
  console.log('checkActiveBattle');
  request.get({
      url:SITE_STATUS_URL, 
      jar: true,
      followRedirect: true
     }, function(err,httpResponse,body) {
    if (err) {
      console.log('error:', err); // Print the error if one occurred
      nextCycle();
      return;
    }
    console.log('checkActiveBattle', 'statusCode:', httpResponse.statusCode);//, httpResponse.headers);
    //console.log('body:', body); // Print the HTML for the Google homepage.
    battles_in_ready = parseBattles(body, 'Ready in battles');
    battles_in_wait = parseBattles(body, 'Waiting in battles');
    console.log(battles_in_ready, battles_in_wait);
    for(var i = 0, Ln = battles_in_wait.length; i < Ln; ++i) {
      checkIsBattlePossibleCloseForce(battles_in_wait[i]);
    }
    if (battles_in_ready.length + battles_in_wait.length < CHALLENGE_ACCEPT_CONDITION) {
      checkChallenges();
    } else {
      nextCycle();
    }
  });
}

function checkIsBattlePossibleCloseForce(battle_id) {
  request.get({
      url:SITE_BATTLE_URL + battle_id,
      jar: true,
      followRedirect: true
     }, function(err,httpResponse,body) {
    if (err) {
      console.log('error:', err); // Print the error if one occurred
      nextCycle();
      return;
    }
    console.log('checkIsBattlePossibleCloseForce', 'statusCode:', httpResponse.statusCode, httpResponse.headers);
    //console.log('body:', body);
    
    var battle = parseBattle(body);
    battle.battle_id = battle_id;
    var frm = {
            force: 1,
            turn: battle.turn,
            num: battle.battle_id
            };
    console.log(battle_id, battle, JSON.stringify(frm));
    if (battle.force) {
      console.log('Try close battle force');
      request.post({
          url:SITE_WARLOCK_SUBMIT, 
          //proxy: 'http://localhost:4128',
          jar: true,
          followRedirect: false,
          form: frm
         }, function(err,httpResponse,body) {
            if (err) {
              console.log('error:', err); // Print the error if one occurred
              nextCycle();
              return;
            }
            console.log('checkIsBattlePossibleCloseForce', 'try close', httpResponse.statusCode, httpResponse.headers);
      });
    }
  });
  //SITE_WARLOCK_SUBMIT
}

function parseBattleTurn(body, battle) {
  battle.turn = getInt(getFieldValue(body, '<INPUT TYPE=HIDDEN NAME=turn VALUE=', '"', '"'));
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

function parseBattleForce(body, battle) {
  battle.force = body.indexOf('<INPUT TYPE=SUBMIT VALUE="Force Surrender Attempt">') !== -1;
}

function parseBattle(body) {
  var battle = {turn:0,enemy:{},self:{}};
  parseBattleTurn(body, battle);
  parseBattleForce(body, battle);
  //parseBattleWarlocks(body, battle);
  //console.log('parseBattle', 'after', battle);
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
      nextCycle();
      return;
    }
    console.log('startBattleProcessing', 'statusCode:', httpResponse.statusCode, httpResponse.headers);
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
  battle.is_bot = description.indexOf('Training Battle with AI Player') !== -1;
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

var total_ai_challenges = 0;
const max_ai_challenges = 3;

function parseChallenges(body) {
  var res = [];
  var idx1 = body.indexOf('<TD CLASS=darkbg>Description</TD>');
  if (idx1 === -1) {
    return [-1];
  }
  idx1 = body.indexOf('<TR><TD>', idx1);
  var idx2 = body.indexOf('</TABLE>', idx1);
  var arr_table = body.substr(idx1, idx2 - idx1).split('</TR>');
  for (var i = 0, Ln = arr_table.length; i < Ln; ++i) {
    if (arr_table[i].indexOf('<TD>') === -1) {
      continue;
    }
    var challenge = parseChallenge(arr_table[i].replace('<TR>', ''));
    if (challenge.is_bot) {
      ++total_ai_challenges;
    }
    if (!challenge.bot_allowed || (challenge.battle_id === 0) || (challenge.level > 0) || (challenge.count > 2)) {
      continue;
    }
    res.push(challenge.battle_id);
  }
  
  return res;
}

//

function checkChallenges() {
  console.log('checkChallenges');
  request.get({
      url:SITE_CHALLENGES_URL, 
      jar: true,
      followRedirect: true
     }, function(err,httpResponse,body) {
    if (err) {
      console.log('error:', httpResponse.statusCode, err); // Print the error if one occurred
      nextCycle();
      return;
    }
    console.log('checkChallenges', 'statusCode:', httpResponse.statusCode, httpResponse.headers);
    if (httpResponse.statusCode !== 200) {
      nextCycle();
      return;
    }
    //console.log('body:', body); // Print the HTML for the Google homepage.
    total_ai_challenges = 0;
    var accepted_cnt = 0;
    var battles_to_accept = parseChallenges(body);
    
    for (var i = 0, Ln = battles_to_accept.length; i < Ln; ++i) {
      if ((i === 0) && (battles_to_accept[i] === -1)) {
        // something goes wrong, perhapse 
        nextCycle();
        return;
      }
      if (accepted_cnt + battles_in_ready.length + battles_in_wait.length < CHALLENGE_ACCEPT_CONDITION) {
        acceptChallenge(battles_to_accept[i]);
        ++accepted_cnt;
      }
    }
    if ((accepted_cnt + battles_in_ready.length + battles_in_wait.length < CHALLENGE_ADD_CONDITION) && (total_ai_challenges < max_ai_challenges)) {
      addChallenges(Math.min(CHALLENGE_ADD_CONDITION - (accepted_cnt + battles_in_ready.length + battles_in_wait.length), Math.max(0, max_ai_challenges - total_ai_challenges)));
    } else {
      nextCycle();
    }
  });
}

function addChallenges(add_cnt) {
  while(--add_cnt >= 0) {
    request.post({
        url:SITE_NEW_CHALLENGES_URL, 
        jar: true,
        followRedirect: true,
        form: { 
           fast: 1,
           players: 2,
           friendly: 2,
           game: 1,
           blurb: "ParaFC Maladroit Training Battle with AI Player, NO BOT allowed ;) join to community https://fb.com/WarlocksDuel/"
           }
       }, function(err,httpResponse,body) {
      if (err) {
        console.log('error:', err); // Print the error if one occurred
        nextCycle();
        return;
      }
      console.log('addChallenges', 'statusCode:', httpResponse.statusCode, httpResponse.headers);
    });
  }
  nextCycle();
}

function acceptChallenge(battle_id) {
  console.log('acceptChallenge');
  request.get({
      url:SITE_ACCEPT_CHALLENGE_URL + battle_id, 
      jar: true,
      followRedirect: true
     }, function(err,httpResponse,body) {
    if (err) {
      console.log('error:', err); // Print the error if one occurred
      nextCycle();
      return;
    }
    console.log('acceptChallenge', 'statusCode:', httpResponse.statusCode, httpResponse.headers);
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