const dice =()=>{
    return Math.floor(Math.random()*6 + 1);
}

const mobList = {
    rat:{
        name: "Giant Rat",
        attack: [1,2,3],
        hitpoints: 3,
        loot: [1,2]
    },
    boar:{
        name: "Wild Boar",
        attack: [2,3,4],
        hitpoints: 5,
        loot: [1,2,3]
    },
    wolf:{
        name: "Wolf",
        attack: [3,4,5],
        hitpoints: 7,
        loot: [2,3,4]
    },
    bear:{
        name: "Bear",
        attack: [4,5,6],
        hitpoints: 9,
        loot: [3,4]
    },
    free:{
        name: "Clear Path"
    },
    // TEST FOR GAME BALANCE //
    bandit:{
        name: "Thieving Bandit",
        attack: [5,6,7],
        hitpoints: 3,
        loot: [1,2]
    },
    werewolf:{
        name: "Werewolf",
        attack: [6,7,8],
        hitpoints: 5,
        loot: [1,2,3]
    },
    golem:{
        name: "Golem",
        attack: [7,8,9],
        hitpoints: 7,
        loot: [2,3,4]
    },
    wraith:{
        name: "Fire Wraith",
        attack: [8,9,10],
        hitpoints: 3,
        loot: [1,2]
    },
    guardian:{
        name: "Dungeon Guardian",
        attack: [9,10,11],
        hitpoints: 5,
        loot: [1,2,3]
    },
    sorcerer:{
        name: "Chaos Sorcerer",
        attack: [10,11,12],
        hitpoints: 7,
        loot: [2,3,4]
    }
}

const shopItems = {
    "wooden sword": {
        cost: 2,
        addedDamage: 1,
        description: `word`
    },
    "wooden armor": {
        cost: 2,
        addedDefense: 1,
        description: `word`
    },
    "iron sword": {
        cost: 5,
        addedDamage: 2,
        description: `word`
    },
    "iron armor": {
        cost: 5,
        addedDefense: 2,
        description: `word`
    },
    "steel sword": {
        cost: 10,
        addedDamage: 10,
        description: `word`
    },
    "steel armor": {
        cost: 1,
        addedDefense: 1,
        description: `word`
    },
    "potion": {
        cost: 6,
        addedDamage: 1,
        description: `word`
    },
    "super potion": {
        cost: 10,
        addedDamage: 1,
        description: `word`
    }
}

const rungRatios = {
    stage1: {   
        first: {
            rat: 40,
            boar: 30,
            wolf: 0,
            bear: 0,
            free: 30
        },
        second: {
            rat: 15,
            boar: 40,
            wolf: 25,
            bear: 5,
            free: 15
        },
        third: {
            rat: 5,
            boar: 25,
            wolf: 40,
            bear: 22,
            free: 8
        },
        fourth: {
            rat: 0,
            boar: 15,
            wolf: 45,
            bear: 40,
            free: 0
        }
    },
    stage2: {   
        first: {
            rat: 40,
            boar: 30,
            wolf: 0,
            bear: 0,
            free: 30
        },
        second: {
            rat: 15,
            boar: 40,
            wolf: 25,
            bear: 5,
            free: 15
        },
        third: {
            rat: 5,
            boar: 25,
            wolf: 40,
            bear: 22,
            free: 8
        },
        fourth: {
            rat: 0,
            boar: 15,
            wolf: 45,
            bear: 40,
            free: 0
        }
    },
    stage3: {   
        first: {
            rat: 40,
            boar: 30,
            wolf: 0,
            bear: 0,
            free: 30
        },
        second: {
            rat: 15,
            boar: 40,
            wolf: 25,
            bear: 5,
            free: 15
        },
        third: {
            rat: 5,
            boar: 25,
            wolf: 40,
            bear: 22,
            free: 8
        },
        fourth: {
            rat: 0,
            boar: 15,
            wolf: 45,
            bear: 40,
            free: 0
        }
    }
}
const bossMobs = {
    boss01:{
        name: "Wooden Dungeon Guardian",
        attack: [1,2,3,4],
        hitpoints: 15,
        loot: [5,6,7]
    },
    boss02:{
        name: "Stone Dungeon Guardian",
        attack: [2,3,4,5,6],
        hitpoints: 20,
        loot: [7,8,9]
    },
    boss03:{
        name: "Iron Dungeon Guardian",
        attack: [4,5,6,7],
        hitpoints: 25,
        loot: [9,10,11]
    }
}
const finalBosses = {
    fBoss01:{
        name: "Crystal Giant",
        attack: [0,4,5,6,7,8], //special numbers for special moves?
        hitpoints: 35,
        loot: [12,15,18]
    },
    fBoss02:{
        name: "Lava Beast",
        attack: [0,6,7,8,9,10],
        hitpoints: 45,
        loot: [15,18,21]
    },
    fBoss03:{
        name: "Earthbound Dragon",
        attack: [0,8,9,10,11,12],
        hitpoints: 60,
        loot: [16,24,30]
    }
}

const startDefault = { //For Solo
    position: 0,
    userStats: {
        hitpoints: 10,
        attack: 1,
        defense: 0
    },
    numberOfMoves: 0,
    stage: 1,
    levelRung: {
        first: true,
        second: false,
        third: false,
        fourth: false,
    },
    inBattle: false,
    coinPouch: 0,
    equipted: {
        sword: false,
        armor: false,
        shield: false
    },
    inventory: [],
    ongoingBattle: { //BossBattle
        battleSequenceComplete: false,
        opponentStats: null,
        userStats: null
    },
    healingCost: 0
};

function initiateEncounter(level, stage){
    console.log('Inside the intiateEncounter. Argument passed: ', level);
    let queryStage = "stage" + `${stage}`;
    const targetRung = rungRatios[queryStage][level];
    const pick = Math.floor(Math.random()*100 + 1);
    let animal;
    let remainder = pick;
    for (const [key, value] of Object.entries(targetRung)) {
        remainder -= value;
        if (remainder > 0) {
            continue;
        } else {
            animal = key;
            break;
        }
    }
    let mobPick = mobList[`${animal}`];
    return mobPick;
}

function checkRungOn(step) {
    console.log("inside checkRungOn")
    if (step > 0 && step < 25) {
        return "first";
    } else if (step > 24 && step < 50) {
        return "second";
    } else if (step > 49 && step < 75) {
        return "third";
    } else if (step > 74 && step < 100) {
        return "fourth";
    } else {
        return "final";
    }
}


module.exports = {
    dice,
    mobList,
    shopItems,
    initiateEncounter,
    checkRungOn,
    startDefault,
    bossMobs,
    finalBosses
}