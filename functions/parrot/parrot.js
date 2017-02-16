var alexa = require('alexa-app');

var app = new alexa.app('parrot');

app.launch(function(req, res) {
  res.say('I am a parrot.');
});

app.intent('RepeatIntent', {
    'slots': {
      'VALUE': 'AMAZON.NUMBER'
    },
    'utterances': [
      'repeat {-|VALUE}'
    ]
  },
  function(req, res) {
    var value = req.slot('VALUE');
    res.say(`You said ${value}.`);
    for (var i = 0; i < value; i++) {
      res.say(`I repeat, you said ${value}.`);
    }
  }
);

module.exports = app;
