const stateVUI = {
    "Lobby": true,
    "Soloplay": false,
    "Multiplay": false,
    "Leaderboard": false,
    "Premium": false,
    "Tutorial": false
};

const state = Object.keys(stateVUI)
const active = state.filter(function(id) {
    return stateVUI[id]
})

console.log(active[0])
console.log(typeof active[0])

let obj = {}; 
obj.foo? console.log(true): console.log(obj)