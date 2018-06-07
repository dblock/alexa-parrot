const parrot = require('./parrot');
const schema = JSON.parse(parrot.schema());
const utterances = parrot.utterances().split('\n');

Array.prototype.clean = function (deleteValue) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == deleteValue) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
};

for (let i = 0; i < schema.intents.length; ++i) {
    let slots = [];
    let samples = [];

    schema.intents[0].slots.forEach((slot) => {
        slots.push({
            name: slot.name,
            type: slot.type
        })
    });

    utterances.clean('').forEach((utter) => {
        splitUtter = utter.split(' ');
        samples.push(`${splitUtter[1]} ${splitUtter[2]}`);
    })

    console.dir({
        name: schema.intents[i].intent,
        slots: [slots],
        samples: [samples]
    }, {
        showHidden: true,
        depth: null,
        colors: true
    })
    console.log();
}