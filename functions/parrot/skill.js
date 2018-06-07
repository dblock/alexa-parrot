const parrot = require('./parrot');
const schema = JSON.parse(parrot.schema());
const utterances = parrot.utterances().split('\n');

Array.prototype.clean = function (deleteValue) {
  for (let i = 0; i < this.length; i++) {
    if (this[i] === deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }

  return this;
};

for (let i = 0; i < schema.intents.length; ++i) {
  const slots = [];
  const samples = [];

  schema.intents[0].slots.forEach((slot) => {
    slots.push({
      name: slot.name,
      type: slot.type
    });
  });

  utterances.clean('').forEach((utter) => {
    const splitUtter = utter.split(' '); // eslint-disable-line newline-after-var
    samples.push(`${splitUtter[1]} ${splitUtter[2]}`);
  });

  console.dir({
    name: schema.intents[i].intent,
    slots: [slots],
    samples: [samples]
  }, {
    showHidden: true,
    depth: null,
    colors: true
  });
  console.log();
}