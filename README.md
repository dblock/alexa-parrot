## Alexa Parrot

Use Node 4 or better.

### A Parrot Function

#### Package JSON

Require [alexa-app](https://github.com/alexa-js/alexa-app).

```json
{
  "name": "parrot",
  "version": "0.1.0",
  "description": "A parrot skill.",
  "main": "parrot.js",
  "dependencies": {
    "alexa-app": "^3.1.0"
  },
  "author": "Daniel Doubrovkine (db@artsy.net)",
  "license": "MIT"
}
```

#### .gitignore

```
node_modules
```

#### Install

```
npm install
```

#### Parrot Implementation

```js
var alexa = require('alexa-app');

var app = new alexa.app('parrot');

app.launch(function(req, res) {
  res.say('I am a parrot.');
});

module.exports = app;
```

#### A Test

Add `express` and `mocha` to `package.json` and support for `npm test`.

```json
"devDependencies": {
  "mocha": "^2.3.4",
  "express": "^4.14.0",
  "supertest": "^2.0.1",
  "chai": "^3.4.1"
},
"scripts": {
  "test": "mocha test"
}
```

A test in `test/test_parrot.js`.

```js
var express = require('express');
var request = require('supertest');
var chai = require('chai');
var expect = chai.expect;

describe('Parrot', function() {
  var server;

  beforeEach(function() {
    var app = express();
    var parrot = require('../parrot');
    parrot.express({
      expressApp: app,
      router: express.Router(),
      debug: true,
      checkCert: false
    });
    server = app.listen(3000);
  });

  afterEach(function() {
    server.close();
  });
});
```

#### Responds to Invalid Data

```js
it('responds to invalid data', function() {
  return request(server)
    .post('/parrot')
    .send({})
    .expect(200).then(function(response) {
      return expect(response.body).to.eql({
        version: '1.0',
        response: {
          directives: [],
          shouldEndSession: true,
          outputSpeech: {
            type: 'SSML',
            ssml: '<speak>Error: not a valid request</speak>'
          }
        },
        sessionAttributes: {}
      });
    });
});
```

#### Responds to a Launch Request

```js
it('responds to a launch event', function() {
  return request(server)
    .post('/parrot')
    .send({
      request: {
        type: 'LaunchRequest',
      }
    })
    .expect(200).then(function(response) {
      var ssml = response.body.response.outputSpeech.ssml;
      return expect(ssml).to.eql('<speak>I am a parrot.</speak>');
    });
});
```

#### Deploy to Lambda

Apex requires things to be in a functions directory, move this.

```
mkdir -p functions/parrot
git mv parrot.js functions/parrot
git mv package.json functions/parrot
git mv test functions/parrot
```

* Sign into AWS Console, [https://console.aws.amazon.com](https://console.aws.amazon.com), choose Lambda.
* Create a blank Lambda Function
* Configure Alexa Skills Kit trigger
* Name `alexa_parrot`
* Create a new role, `alexa-parrot`
* Get Apex, `curl https://raw.githubusercontent.com/apex/apex/master/install.sh | sh`
* Get AWS CLI, `brew install awscli`
* Configure access to AWS the first time, `aws configure`

Create `functions/parrot/index.js`.

```
var parrot = require('parrot');

exports.handle = parrot.lambda();
```

Create `project.json`.

```json
{
  "name": "alexa",
  "description": "I am a parrot.",
  "memory": 128,
  "timeout": 5,
  "role": "arn:aws:iam::585031190124:role/service-role/alexa-parrot"
}
```

Deploy.

```
apex deploy
```

#### A Useful Skill

Add this to `functions/parrot/parrot.js`.

```js
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
```

And a test to `functions/parrot/test/test_parrot.js`.

```js
it('responds to a repeat event', function() {
  return request(server)
    .post('/parrot')
    .send({
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'RepeatIntent',
          slots: {
            VALUE: {
              name: "VALUE",
              value: "2"
            }
          }
        }
      }
    })
    .expect(200).then(function(response) {
      var ssml = response.body.response.outputSpeech.ssml;
      return expect(ssml).to.eql('<speak>You said 2. I repeat, you said 2. I repeat, you said 2.</speak>');
    });
});
```

### Create a New Skill

* Sign into AWS Developer Console, [https://developer.amazon.com](https://developer.amazon.com).
* Choose Alexa, Alexa Skill Kit
* Add a New Skill
* Fill Out Forms

Schema and utterances can be generated with `functions/parrot/skill.js`.

```js
var parrot = require('./parrot');

console.log("SCHEMA: ");
console.log(parrot.schema());

console.log();
console.log("UTTERANCES: ");
console.log(parrot.utterances());
```

The skill is now available in [http://alexa.amazon.com](http://alexa.amazon.com).

#### Try It

* Alexa, open parrot.
* Alexa, ask parrot to repeat 3.

