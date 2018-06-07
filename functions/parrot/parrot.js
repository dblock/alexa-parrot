const alexa = require('alexa-app');

const app = new alexa.app('parrot');

app.launch((req, res) => {
  res.say('I am a parrot.');
});

app.intent('RepeatIntent', {
  slots: {VALUE: 'AMAZON.NUMBER'},
  utterances: ['repeat {-|VALUE}']
}, (req, res) => {
  const value = req.slot('VALUE');

  res.say(`You said ${value}.`);
  for (let i = 0; i < value; i++) {
    res.say(`I repeat, you said ${value}.`);
  }
});

module.exports = app;