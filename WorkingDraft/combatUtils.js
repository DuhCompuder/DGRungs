const GAME = require('./gameModUtil.js');

function attackResult(_session, _gameMode) {
    //can only be called if hp greater than 1 externally
    console.log("inside attackResult function")
    let packet;
    let session = _session;
    const damage = GAME.dice();
    let speakOutput = `You rolled a ${damage} for attack.`;
    //update damage to enemy health
    session[_gameMode].USER_SESSION_INFO.ongoingBattle.opponentStats.hitpoints -= damage
    
    let {opponentStats} = session[_gameMode].USER_SESSION_INFO.ongoingBattle;
    if (opponentStats.hitpoints < 1) {
        console.log("inside attackResult function: defeated enemy")
        speakOutput += ` Nice! You defeated the ${opponentStats.name}.`;
        let loot = fetchLoot(opponentStats, session, _gameMode);
        //updates speech and session for loot
        speakOutput += loot.speakOutput;
        session = loot.session;
        //update inBattle status to false after completed battle
        session[_gameMode].USER_SESSION_INFO.inBattle = false;
    } else {
        console.log("inside attackResult function: no defeat enemy")
        speakOutput += ` The ${opponentStats.name} has ${opponentStats.hitpoints} left. What is your next move?`;
    }
    packet = {
        session,
        speakOutput
    }
    return packet;
}
function defendResult(_session) {
    let packet;
    let session = _session;
    const block = GAME.dice();
    let speakOutput = ` You rolled a ${block} for defense.`;
    
    packet = {
        session,
        speakOutput
    }
    return packet;
}
function moveUpdater(_session, gameMode){
    //cannot move forward if in a battle
    console.log("inside moveUpdater")
    let packet;
    let session = _session;
    let speakOutput;
    let moveCount = GAME.dice();
    let { inBattle } = _session[gameMode].USER_SESSION_INFO;
    if (inBattle === true) {
        console.log("inBattle is true")
        speakOutput = "Sorry you cannot move forward until you resolve your current battle. However, you can attempt to escape by saying escape.";
    } else {
        console.log("inBattle is false")
        session[gameMode].USER_SESSION_INFO.position += moveCount; 
        session[gameMode].USER_SESSION_INFO.numberOfMoves++;
        speakOutput = `You rolled a ${moveCount}. You moved to step ${session[gameMode].USER_SESSION_INFO.position}.`; //add sound effect?
        // *const onRung = GAME.checkRungOn(session[gameMode].USER_SESSION_INFO.position);
        // *let updateSession = setLevelRung(session, gameMode, onRung);
        // *session = updateSession;
        //const mobPickStatus = actOnPosition(onRung, 'stage1'); //actOnPosition(rung, stage) //modify stage to variable --create function for this because there is a state variable for this already that i didnt utilize
        let mobPickStatus = actOnPosition(gameMode, session);
        //update session after mobPickStatus
        session = mobPickStatus.session;
        console.log("mobPickStatus is: ", mobPickStatus)
        if (mobPickStatus.name === "Clear Path") {
            //console.log("mobPickStatus resolved with clear path") //debug
            //Change the speak outputs into variables in /speakUtil.js
            speakOutput = 'You encountered a clear path to move forward. What do you like to do next?!';
        } else {
            //console.log("mobPickStatus resolved with a mob") //debug
            //function to update in combat details should session close in midbattle?
            session[gameMode].USER_SESSION_INFO.inBattle = true;
            session[gameMode].USER_SESSION_INFO.ongoingBattle.opponentStats = mobPickStatus.encounter;
            speakOutput += mobPickStatus.speakOutput; //`You encountered a ${mobPickStatus.name}. How do you want to engage in this battle?`;
        }
    }
    packet = {
        session,
        speakOutput
    }
    return packet;
}

function setLevelRung(_session, gameMode, level) {
    // console.log("inside setLevelRung")
    // console.log("gameMode: ", gameMode)
    // console.log("level: ", level)
    // console.log("session: ", _session)

    let session = _session;
    session[gameMode].USER_SESSION_INFO.levelRung[level] = true;
    // console.log(JSON.stringify(session[gameMode].USER_SESSION_INFO.levelRung))
    for (const lvl in session[gameMode].USER_SESSION_INFO.levelRung) {
        // console.log("lvl in session[gameMode].USER_SESSION_INFO.levelRung: ", lvl)
        // console.log(`Does ${lvl} equal ${level}?`)
        if(lvl !== level){
            // console.log(`${lvl} does not equal ${level}.`)
            session[gameMode].USER_SESSION_INFO.levelRung[lvl] = false;
        }
    }
    console.log("completed forLoop")
    switch(level) {
        case "first":
            session[gameMode].USER_SESSION_INFO.levelnum = 1;
            break;
        case "second":
            session[gameMode].USER_SESSION_INFO.levelnum = 2;
            break;
        case "third":
            session[gameMode].USER_SESSION_INFO.levelnum = 3
            break;
        case "fourth":
            session[gameMode].USER_SESSION_INFO.levelnum = 4;
            break;
        case "final":
            session[gameMode].USER_SESSION_INFO.levelnum = 5;
            break;
    }
    return session;
}

function battleSequence() {
    //Load user combat stats
    //Load opponent combat stats


    //As long as opponent is alive, the battle continues...
    //If opponent is alive -> user may initiate attack sequence & ask user what to do next

    //If opponent is dead -> call fetchLoot() & print response & ask what to do next
    //returns session with updated combat details?
}

function setCombat(combatChoice, userEquipments) {
    //If user has a sword

    //calculate new damage detail

    //add to string response to modify if has sword

    //If user has a shield

    //calculate new damage detail

    //add to string response to modify if has shield

    //returns user attack results in an object
}

function fetchLoot(mobDetails, session, gameMode) {
    // speakOutput += ` You defeated the ${opponent.name} and`;
    //                 sessionAttributes.gameInfo.inBattle = false;
    //                 sessionAttributes.gameInfo.ongoingBattle.battleSequenceComplete = true;
    //                 let drop = opponent.loot[Math.floor(Math.random()* opponent.loot.length)];
    //                 sessionAttributes.gameInfo.coinPouch += drop;
    //                 speakOutput += ` found ${drop} coins. You now have a total of ${sessionAttributes.gameInfo.coinPouch} coins in your pouch. What is your next move?`;
    //             }
    gameMode = "SOLO_PLAY"; // rid this once multiplayer
    let drop = mobDetails.loot[Math.floor(Math.random()* mobDetails.loot.length)];
    session[gameMode].USER_SESSION_INFO.coinPouch += drop;
    //updates coin pouch
    //returns loot details in string and coin pouch sum
    const packet = {
        session,
        speakOutput: ` Found ${drop} coins. You now have a total of ${session[gameMode].USER_SESSION_INFO.coinPouch} coins in your pouch. What is your next move?`,
    }
    //returns user attack results in an object
    //returns session with updated loot details?
    return packet;
}

function actOnPosition(gameMode, session) {
    console.log("inside actOnPosition")
    let packet;
    let speakOutput = '';
    //check the rung of current play according to the position after position update --> this is the new rung
    const onRung = GAME.checkRungOn(session[gameMode].USER_SESSION_INFO.position);
    //set the level rung value to true
    let updatedSession = setLevelRung(session, gameMode, onRung);
    console.log("completed setLevelRung()")
    let oldlevel = session[gameMode].USER_SESSION_INFO.levelnum;
    let newlevel = updatedSession[gameMode].USER_SESSION_INFO.levelnum;
    // session = updatedSession;
    let stage = updatedSession[gameMode].USER_SESSION_INFO.stage;
    const encounter = GAME.initiateEncounter(onRung, stage); //initiateEncounter(level, stage)
    console.log("The encounter is: "); //debug
    // Structure: 
    // {
    //     name: "Giant Rat",
    //     attack: [1,2,3],
    //     hitpoints: 3,
    //     loot: [1,2]
    // }
    console.log(encounter); //debug
    // if first encounter new rung, alert user:
    if (oldlevel < newlevel) {
        switch (newlevel) {
            case 1:
                //speakOutput = `You encountered a ${encounter.name}. What would you like to do?`;
                break;
            case 2:
                speakOutput = ` You reached second rung. The difficulty now increases from here.`;
                break;
            case 3:
                speakOutput = ` You reached third rung. The difficulty now increases from here.`;
                break;
            case 4:
                speakOutput = ` You reached fourth rung. The difficulty now increases from here.`;
                break;
            case 5:
                speakOutput = ` You completed the game`;
                break;
        }
    }
    session = updatedSession;
    speakOutput += ` You encountered a ${encounter.name}. What would you like to do?`;
    packet = {
        session,
        encounter,
        speakOutput
    };
    return packet;
    //If user position passes a certain level, return a response congratulating user
    //If user completes the entire stage at max or over max steps, set the position back to 0 if completion is true 
    //(may want to check to see if I want to implement an arguement into the function call)
    //return position responses and how to react at position ---check to initiate encounter..?
}
module.exports = {
    attackResult,
    defendResult,
    moveUpdater,
    battleSequence,
    setCombat,
    fetchLoot,
    actOnPosition
}