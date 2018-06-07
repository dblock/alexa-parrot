const alexa = require('alexa-app');

const app = new alexa.app('parrot');

app.launch((req, res) => {
  res.say('I am a parrot.');
});

app.intent('RepeatIntent', {
  slots: {VALUE: 'AMAZON.NUMBER'},
  utterances: ['repeat {-|VALUE}']
}, (req, res) => {
  const slot = req.slot('VALUE') || 2;

  res.say(`You said ${slot}.`);
  for (let i = 0; i < slot; i++) {
    res.say(`I repeat, you said ${slot}.`);
  }
});

module.exports = app;