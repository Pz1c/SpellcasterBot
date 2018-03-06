const WARLOCK_LOGIN    = process.argv[2];
const WARLOCK_PASSWORD = process.argv[3];

const SITE_LOGIN_URL = 'https://games.ravenblack.net/login';
const SITE_STATUS_URL = 'https://games.ravenblack.net/player';
const SITE_CHALLENGES_URL = 'https://games.ravenblack.net/challenges';
const SITE_ACCEPT_CHALLENGE_URL = 'https://games.ravenblack.net/accept?back=challenges&num=';
const SITE_BATTLE_URL = 'https://games.ravenblack.net/warlocks?num=';

var request = require('request');
//var request = Request.defaults({'proxy': 'https://127.0.0.1:4128'});

var warlock_logined = false;
var fatal_error = false;
var battles_in_process = [];
var battles_in_ready = [];
var battles_in_wait = [];

const idx_l = 0, idx_r = 1;
const arr_warlock = ['enemy', 'self'];
const arr_hand = ['L', 'R'];

const SPELL_TYPE_SUMMON_MONSTER = 0;
const SPELL_TYPE_POISON = 1;
const SPELL_TYPE_CONFUSION = 2;
const SPELL_TYPE_DAMAGE = 3;
const SPELL_TYPE_SHIELD = 4;
const SPELL_TYPE_MAGIC_SHIELD = 5;
const SPELL_TYPE_MASSIVE = 6;
const SPELL_TYPE_HASTLE = 7;
const SPELL_TYPE_CHARM_MONSTER = 8;
const SPELL_TYPE_CURE = 9;
const SPELL_TYPE_SPEC = 10;
const SPELL_TYPE_DEATH = 11;
const SPELL_TYPE_RESIST = 12;
const SPELL_TYPE_ELEMENTAL = 13;
const SPELL_TYPE_STAB = 14;
const arr_spell_type = ['summon_monster', 'poison', 'confusion', 'damage', 'shield', 'magic_shield', 'massive', 
                        'hastle', 'charm_monster', 'cure', 'spec', 'deatch', 'resist', 'elemental'];

const SPELL_DISPEL_MAGIC = 0;
const SPELL_SUMMON_ICE_ELEMENTAL = 1;
const SPELL_SUMMON_FIRE_ELEMENTAL = 2;
const SPELL_MAGIC_MIRROR = 3;
const SPELL_LIGHTNING_BOLT = 4;
const SPELL_CURE_HEAVY_WOUNDS = 5;
const SPELL_CURE_LIGHT_WOUNDS = 6;
const SPELL_BLINDNESS1 = 7;
const SPELL_AMNESIA = 8;
const SPELL_CONFUSION = 9;
const SPELL_DISEASE = 10;
const SPELL_BLINDNESS2 = 11;
const SPELL_DELAY_EFFECT = 12;
const SPELL_POISON = 13;
const SPELL_PARALYSIS = 14;
const SPELL_SUMMON_GIANT = 15;
const SPELL_SUMMON_TROLL = 16;
const SPELL_SUMMON_OGRE = 17;
const SPELL_SUMMON_GOBLIN = 18;
const SPELL_FIREBALL = 19;
const SPELL_SHIELD = 20;
const SPELL_REMOVE_ENCHANTMENT = 21;
const SPELL_INVISIBILITY = 22;
const SPELL_CHARM_MONSTER = 23;
const SPELL_CHARM_PERSON = 24;
const SPELL_FINGER_OF_DEATH = 25;
const SPELL_HASTE = 26;
const SPELL_MAGIC_MISSILE = 27;
const SPELL_ANTI_SPELL = 28;
const SPELL_PERMANENCY = 29;
const SPELL_TIME_STOP1 = 30;
const SPELL_TIME_STOP2 = 31;
const SPELL_RESIST_COLD = 32;
const SPELL_FEAR = 33;
const SPELL_FIRE_STORM = 34;
const SPELL_CLAP_OF_LIGHTNING = 35;
const SPELL_CAUSE_LIGHT_WOUNDS = 36;
const SPELL_CAUSE_HEAVY_WOUNDS = 37;
const SPELL_COUNTER_SPELL1 = 38;
const SPELL_ICE_STORM = 39;
const SPELL_RESIST_HEAT = 40;
const SPELL_PROTECTION = 41;
const SPELL_COUNTER_SPELL2 = 42;
const SPELL_SURRENDER = 43;
const SPELL_STAB = 44;


var arr_spells = [
/* 0 */ {gesture:"cDPW",name:"Dispel Magic",type:SPELL_TYPE_MAGIC_SHIELD,priority:0,level:3,danger:10},
/* 1 */ {gesture:"cSWWS",name:"Summon Ice Elemental",type:SPELL_TYPE_ELEMENTAL,priority:4,level:0,danger:15},
/* 2 */ {gesture:"cWSSW",name:"Summon Fire Elemental",type:SPELL_TYPE_ELEMENTAL,priority:5,level:1,danger:15},
/* 3 */ {gesture:"cw",name:"Magic Mirror",type:SPELL_TYPE_MAGIC_SHIELD,priority:0,level:0,danger:10},
/* 4 */ {gesture:"DFFDD",name:"Lightning Bolt",type:SPELL_TYPE_DAMAGE,priority:3,level:1,danger:16},
/* 5 */ {gesture:"DFPW",name:"Cure Heavy Wounds",type:SPELL_TYPE_CURE,priority:0,level:1,danger:10},
/* 6 */ {gesture:"DFW",name:"Cure Light Wounds",type:SPELL_TYPE_CURE,priority:0,level:0,danger:10},
/* 7 */ {gesture:"DFWFd",name:"Blindness",type:SPELL_TYPE_CONFUSION,priority:4,level:0,danger:15},
/* 8 */ {gesture:"DPP",name:"Amnesia",type:SPELL_TYPE_CONFUSION,priority:6,level:1,danger:12},
/* 9 */ {gesture:"DSF",name:"Confusion/Maladroitness",type:SPELL_TYPE_CONFUSION,priority:6,level:0,danger:12},
/* 10*/ {gesture:"DSFFFc",name:"Disease",type:SPELL_TYPE_POISON,priority:4,level:1,danger:17},
/* 11*/ {gesture:"DWFFd",name:"Blindness",type:SPELL_TYPE_CONFUSION,priority:4,level:0,danger:15},
/* 12*/ {gesture:"DWSSSP",name:"Delay Effect",type:SPELL_TYPE_SPEC,priority:0,level:0,danger:10},
/* 13*/ {gesture:"DWWFWD",name:"Poison",type:SPELL_TYPE_POISON,priority:3,level:1,danger:18},
/* 14*/ {gesture:"FFF",name:"Paralysis",type:SPELL_TYPE_CONFUSION,priority:5,level:0,danger:12},
/* 15*/ {gesture:"WFPSFW",name:"Summon Giant",type:SPELL_TYPE_SUMMON_MONSTER,priority:4,level:4,danger:14},
/* 16*/ {gesture:"FPSFW",name:"Summon Troll",type:SPELL_TYPE_SUMMON_MONSTER,priority:3,level:3,danger:13},
/* 17*/ {gesture:"PSFW",name:"Summon Ogre",type:SPELL_TYPE_SUMMON_MONSTER,priority:2,level:2,danger:12},
/* 18*/ {gesture:"SFW",name:"Summon Goblin",type:SPELL_TYPE_SUMMON_MONSTER,priority:1,level:1,danger:11},
/* 19*/ {gesture:"FSSDD",name:"Fireball",type:SPELL_TYPE_DAMAGE,priority:3,level:1,danger:15},
/* 20*/ {gesture:"P",name:"Shield",type:SPELL_TYPE_SHIELD,priority:0,level:0,danger:10},
/* 21*/ {gesture:"PDWP",name:"Remove Enchantment",type:SPELL_TYPE_MAGIC_SHIELD,priority:0,level:2,danger:13},
/* 22*/ {gesture:"PPws",name:"Invisibility",type:SPELL_TYPE_CONFUSION,priority:3,level:0,danger:0,danger:13},
/* 23*/ {gesture:"PSDD",name:"Charm Monster",type:SPELL_TYPE_CHARM_MONSTER,priority:0,level:0,danger:12},
/* 24*/ {gesture:"PSDF",name:"Charm Person",type:SPELL_TYPE_CONFUSION,priority:4,level:2,danger:13},
/* 25*/ {gesture:"PWPFSSSD",name:"Finger of Death",type:SPELL_TYPE_DAMAGE,priority:1,level:0,danger:20},
/* 26*/ {gesture:"PWPWWc",name:"Haste",type:SPELL_TYPE_HASTLE,priority:2,level:0,danger:10},
/* 27*/ {gesture:"SD",name:"Magic Missile",type:SPELL_TYPE_DAMAGE,priority:0,level:0,danger:10},
/* 28*/ {gesture:"SPFP",name:"Anti-spell",type:SPELL_TYPE_CONFUSION,priority:5,level:0,danger:14},
/* 29*/ {gesture:"SPFPSDW",name:"Permanency",type:SPELL_TYPE_SPEC,priority:3,level:0,danger:16},
/* 30*/ {gesture:"SPPc",name:"Time Stop",type:SPELL_TYPE_HASTLE,priority:3,level:0,danger:10},
/* 31*/ {gesture:"SPPFD",name:"Time Stop",type:SPELL_TYPE_HASTLE,priority:3,level:0,danger:10},
/* 32*/ {gesture:"SSFP",name:"Resist Cold",type:SPELL_TYPE_RESIST,priority:4,level:1,danger:10},
/* 33*/ {gesture:"SWD",name:"Fear (No CFDS)",type:SPELL_TYPE_CONFUSION,priority:5,level:0,danger:12},
/* 34*/ {gesture:"SWWc",name:"Fire Storm",type:SPELL_TYPE_MASSIVE,priority:3,level:0,danger:16},
/* 35*/ {gesture:"WDDc",name:"Clap of Lightning",type:SPELL_TYPE_DAMAGE,priority:4,level:0,danger:15},
/* 36*/ {gesture:"WFP",name:"Cause Light Wounds",type:SPELL_TYPE_DAMAGE,priority:4,level:0,danger:12},
/* 37*/ {gesture:"WPFD",name:"Cause Heavy Wounds",type:SPELL_TYPE_DAMAGE,priority:3,level:0,danger:13},
/* 38*/ {gesture:"WPP",name:"Counter Spell",type:SPELL_TYPE_MAGIC_SHIELD,priority:0,level:0,danger:10},
/* 39*/ {gesture:"WSSc",name:"Ice Storm",type:SPELL_TYPE_MASSIVE,priority:0,level:3,danger:16},
/* 40*/ {gesture:"WWFP",name:"Resist Heat",type:SPELL_TYPE_RESIST,priority:0,level:4,danger:10},
/* 41*/ {gesture:"WWP",name:"Protection",type:SPELL_TYPE_SHIELD,priority:0,level:1,danger:10},
/* 42*/ {gesture:"WWS",name:"Counter Spell",type:SPELL_TYPE_MAGIC_SHIELD,priority:0,level:1,danger:10},
/* 43*/ {gesture:"p",name:"Surrender",type:SPELL_TYPE_SPEC,priority:-10,level:0,danger:0},
/* 44*/ {gesture:">",name:"Stab",type:SPELL_TYPE_STAB,priority:-1,level:0,danger:0}
];



// start main cycle
Cycle();

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

function checkSpellChar(left, right, spell) {
    if (left != spell.toUpperCase()) {
        return false;
    }
    if ((spell.toUpperCase() != spell) && (left != right)) {
        return false;
    }
    return true;
}

function checkSpellPosible(left, right, spell) {
    //console.log('checkSpellPosible', left, right, spell);
    var Ln = spell.length - 1, GLn = left.length < right.length ? left.length : right.length;
    if (Ln == 0) {
        return 0;
    }
    var work_spell = spell.substr(0, Ln);
    //console.log('checkSpellPosible', work_spell, Ln, GLn);
    var perhapse;
    var spell_idx;
    var spell_char;
    for (var i = 0; i < Ln; ++i) {
        perhapse = true;
        spell_idx = -1;
        for (var j = Ln - i; j > 0; --j) {
            spell_char = work_spell.substr(++spell_idx, 1);
            left_char = left.substr(GLn - j, 1);
            right_char = right.substr(GLn - j, 1);
            //console.log(i, spell_idx, 'L=' + left_char, 'R=' + right_char, 'S=' + spell_char);
            if ((GLn - j < 0) || !checkSpellChar(left_char, right_char, spell_char)) {
                perhapse = false;
                break;
            }
        }
        if (perhapse) {
            return i + 1;
        }
    }
    return 0;
}

function checkPossibleSpells(battle) {
  battle.enemy.possible_spell = [];
  battle.self.possible_spell = [];
  for (var i = 0, Ln = arr_spells.length; i < Ln; ++i) {
    //console.log('checkPossibleSpells', i, arr_spells[i].gesture, arr_spells[i].name);
    for (var w = 0; w < 2; ++w) {
      for (var h = 0; h < 2; ++h) {
        var turn_to_cast = checkSpellPosible(h === 0 ? battle[arr_warlock[w]].left : battle[arr_warlock[w]].right, h === 0 ? battle[arr_warlock[w]].right : battle[arr_warlock[w]].left, arr_spells[i].gesture);
        //console.log(arr_warlock[w], arr_hand[h], turn_to_cast);
        if (turn_to_cast > 0) {
          battle[arr_warlock[w]].possible_spell.push({spell_id:i,turn:turn_to_cast,hand:arr_hand[h]});
        }
      }
    }
    /*turn_to_cast = checkSpellPosible(battle.enemy.right, battle.enemy.left, arr_spells[i].gesture);
    //console.log('enemy', 'right', turn_to_cast);
    if (turn_to_cast > 0) {
      battle.enemy.possible_spell.push({spell_id:i,turn:turn_to_cast,hand:'R'});
    }
    turn_to_cast = checkSpellPosible(battle.self.left, battle.self.right, arr_spells[i].gesture);
    //console.log('self', 'left', turn_to_cast);
    if (turn_to_cast > 0) {
      battle.self.possible_spell.push({spell_id:i,turn:turn_to_cast,hand:'L'});
    }
    turn_to_cast = checkSpellPosible(battle.self.right, battle.self.left, arr_spells[i].gesture);
    //console.log('self', 'right', turn_to_cast);
    if (turn_to_cast > 0) {
      battle.self.possible_spell.push({spell_id:i,turn:turn_to_cast,hand:'R'});
    }*/
  }
  //console.log('checkPossibleSpells', battle);
}

function calcSpellPriority(warlock_code, priority, danger, turn) {
  if (warlock_code === arr_warlock[1]) {// self
    return priority - turn;
  } else { // enemy
    return danger - turn;
  }
}

function checkWarlockSpells(warlock_code, battle) {
  battle[warlock_code].priority_max_L = 0;
  battle[warlock_code].priority_max_R = 0;
  for (var i = 0, Ln = arr_spell_type.length; i < Ln; ++i) {
    battle[warlock_code][arr_spell_type[i]] = [{spell_id:0,level:0,turn:0,hand:'L',priority:0,danger:0}, {spell_id:0,level:0,turn:0,hand:'R',priority:0,danger:0}];
  }
  var sps = battle[warlock_code].possible_spell;
  for (var i = 0, Ln = sps.length; i < Ln; ++i) {
    var spell = arr_spells[sps[i].spell_id];
    for (var h = 0; h < 2; ++h) {
      var sspell = battle[warlock_code][arr_spell_type[spell.type]][h];
      var priority = calcSpellPriority(warlock_code, spell.priority, spell.danger, sps[i].turn);
      if (!battle[warlock_code]['priority_max_' + arr_hand[h]] || (battle[warlock_code]['priority_max_' + arr_hand[h]] < priority)) {
        battle[warlock_code]['priority_max_' + arr_hand[h]] = priority;
      }
      if (((spell.type === SPELL_TYPE_SUMMON_MONSTER) && !battle[warlock_code][arr_spell_type[spell.type]][h].level && (arr_hand[h] === sps[i].hand)) ||
          ((spell.type != SPELL_TYPE_SUMMON_MONSTER) && ((sspell.turn === 0) || (sspell.turn > spell.turn)) && (arr_hand[h] === sps[i].hand))) {
        battle[warlock_code][arr_spell_type[spell.type]][h].level = spell.level;
        battle[warlock_code][arr_spell_type[spell.type]][h].turn = sps[i].turn;
        battle[warlock_code][arr_spell_type[spell.type]][h].spell_id = sps[i].spell_id;
        battle[warlock_code][arr_spell_type[spell.type]][h].priority = priority;
      }
    }
  }
}

function checkMostPossibleSpells(warlock_code, battle) {
  battle[warlock_code].spell_L = {};
  battle[warlock_code].spell_R = {};
  for (var i = 0, Ln = arr_spell_type.length; i < Ln; ++i) {
    for (var h = 0; h < 2; ++h) {
      if (battle[warlock_code][arr_spell_type[i]][h].priority === battle[warlock_code]['priority_max_' + arr_hand[h]]) {
        battle[warlock_code]['spell_' + arr_hand[h]] = battle[warlock_code][arr_spell_type[i]][h];
      }
    }
  }
  console.log('checkMostPossibleSpells', warlock_code, battle[warlock_code].spell_L, battle[warlock_code].spell_R);
}

function getAntiSpell(battle, enemy_spell) {
  switch(enemy_spell.type) {
    //case SPELL_TYPE_CHARM_MONSTER:
    case SPELL_TYPE_CONFUSION:
    case SPELL_TYPE_DAMAGE:
    case SPELL_TYPE_POISON:
    case SPELL_TYPE_DEATH:
      var asd = checkIsPossibleDestroySpell(battle, enemy_spell);
      break;
    case SPELL_TYPE_MASSIVE:
      break;
  }
}

function spellDecision(battle) {
  battle.self.gesture_L = '';
  battle.self.gesture_R = '';
  getAntiSpell(battle, battle.enemy.spell_L.turn < battle.enemy.spell_R.turn ? battle.enemy.spell_L : battle.enemy.spell_R);
  getAntiSpell(battle, battle.enemy.spell_L.turn < battle.enemy.spell_R.turn ? battle.enemy.spell_R : battle.enemy.spell_L);
  
  console.log('spellDecision', battle.self.gesture_L, battle.self.gesture_R);
}

function battleDecision(battle) {
  for (i = 0; i < 2; ++i) {
    checkWarlockSpells(arr_warlock[i], battle);
    checkMostPossibleSpells(arr_warlock[i], battle);
  }
  
  spellDecision(battle);
}

function printBattle(battle, short_info) {
  var i = 0, Ln = 0;
  if (!short_info) {
    for (i = 0, Ln = battle.enemy.possible_spell.length; i < Ln; ++i) {
      console.log('enemy', battle.enemy.left, battle.enemy.right, arr_spells[battle.enemy.possible_spell[i].spell_id].gesture, battle.enemy.possible_spell[i]);
    }
    for (i = 0, Ln = battle.self.possible_spell.length; i < Ln; ++i) {
      console.log('self', battle.self.left, battle.self.right, arr_spells[battle.self.possible_spell[i].spell_id].gesture, battle.self.possible_spell[i]);
    }
  }
  for (i = 0; i < 2; ++i) {
    for (var j = 0, Ln = arr_spell_type.length; j < Ln; ++j) {
      if (short_info && (battle[arr_warlock[i]][arr_spell_type[j]][idx_l].turn === 0) && (battle[arr_warlock[i]][arr_spell_type[j]][idx_r] === 0)) {
        continue;
      }
      console.log(arr_warlock[i], arr_spell_type[j], battle[arr_warlock[i]][arr_spell_type[j]][idx_l], battle[arr_warlock[i]][arr_spell_type[j]][idx_r]);
    }
  }
  
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
    checkPossibleSpells(battle);
    battleDecision(battle);
    //printBattle(battle, true);
    process.exit(0);
    //console.log('BattleProcessing', battle.enemy.summon_monster);
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
        acceptChallenge(battles_to_accept[i]);
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