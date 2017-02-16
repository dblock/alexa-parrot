var alexa = require("alexa-app");

var app = new alexa.app('parrot');

app.launch(function(req, res) {
  res.say("I am a parrot.");
});

module.exports = app;
