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
yarn install
```

#### Parrot Implementation

```js
const alexa = require('alexa-app');

const app = new alexa.app('parrot');

app.launch((req, res) => {
  res.say('I am a parrot.');
});

module.exports = app;
```

#### A Test

Add `express` and `mocha` to `package.json` and support for `npm test`.

```json
"devDependencies": {
  "chai": "4.1.2",
  "eslint": "^4.19.1",
  "express": "^4.14.0",
  "mocha": "5.2.0",
  "supertest": "3.1.0"
},
"scripts": {
  "test": "mocha test"
}
```

A test in `test/test_parrot.js`.

```js
/* eslint-disable no-undef, no-unused-vars, sort-vars, no-mixed-requires, global-require*/
const express = require('express');
const request = require('supertest');
const {expect} = require('chai');

describe('Parrot', () => {
  let server = null;

  beforeEach(() => {
    const app = express();
    const parrot = require('../parrot');

    parrot.express({
      expressApp: app,
      debug: true,
      checkCert: false
    });
    server = app.listen(3000);
  });

  afterEach(() => {
    server.close();
  });
});
```

#### Responds to Invalid Data

```js
it('responds to invalid data', () => request(server)
  .post('/parrot')
  .send({})
  .expect(200)
  .then(response => expect(response.body).to.eql({
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
  })));
```

#### Responds to a Launch Request

```js
it('responds to a launch event', () => request(server)
  .post('/parrot')
  .send({request: {type: 'LaunchRequest'}})
  .expect(200)
  .then((response) => {
    const {ssml} = response.body.response.outputSpeech;

    console.log(ssml);

    return expect(ssml).to.eql('<speak>I am a parrot.</speak>');
  }));
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
* Ensure your region is set to `Asia Pacific (Tokyo)`, `EU (Ireland)`, `US East (N. Virginia)` or `US West (Oregon)` as other regions do not have the Alexa Skills kit
* Click `Services` near the top then search for `Lambda`
* Click `Create function` to create a new Lambda function
  * Leave it on `Author from scratch`
* Name `alexa_parrot`
* Create a new role, `alexa-parrot`
* In the designer menu select `Alexa Skills Kit`
* Get Apex
  * MacOS, Linux or OpenBSD: `curl https://raw.githubusercontent.com/apex/apex/master/install.sh | sh`
  * Windows: Download [the binary](https://github.com/apex/apex/releases)
  * [More info on official website](http://apex.run/) 
* Get AWS CLI
  * MacOS through [homebrew](https://brew.sh/): `brew install awscli`
  * Linux: [Read this AWS article for pip method](https://docs.aws.amazon.com/cli/latest/userguide/awscli-install-linux.html) or get it through APT / yum
  * Windows: [Read this AWS article for MSI installer](https://docs.aws.amazon.com/cli/latest/userguide/awscli-install-windows.html)
* Configure access to AWS the first time, `aws configure`
  * In AWS find the `IAM` service
  * Go to `Users`
  * Create a new user with `Programmatic access`
  * Copy access key ID and secret access key
  * Fill in the region where you created the lambda function (you can see it when going to the function as part of the ARN near the top right)
  * Set `default output` to `json`

Create `functions/parrot/index.js`.

```
const parrot = require('parrot');

exports.handle = parrot.lambda();
```

Create `project.json`.

```json
{
  "name": "alexa",
  "description": "I am a parrot.",
  "memory": 128,
  "timeout": 5,
  "role": ""
}
```

For the role value go to AWS → IAM → Roles → Open the role you created while creating the function → Copy the ARN

To deploy run this command:

```
apex deploy
```

#### A Useful Skill

Add this to `functions/parrot/parrot.js`.

```js
app.intent('RepeatIntent', {
  slots: {VALUE: 'AMAZON.NUMBER'},
  utterances: ['repeat {-|VALUE}']
}, (req, res) => {
  const value = req.slot('VALUE') || 2;

  res.say(`You said ${value}.`);
  for (let i = 0; i < value; i++) {
    res.say(`I repeat, you said ${value}.`);
  }
});
```

And a test to `functions/parrot/test/test_parrot.js`.

```js
it('responds to a repeat event', () => request(server)
.post('/parrot')
.send({
  request: {
    type: 'IntentRequest',
    intent: {
      name: 'RepeatIntent',
      slots: {
        VALUE: {
          name: 'VALUE',
          value: '2'
        }
      }
    }
  }
})
.expect(200)
.then((response) => {
  const { ssml } = response.body.response.outputSpeech;

  return expect(ssml).to.eql('<speak>You said 2. I repeat, you said 2. I repeat, you said 2.</speak>');
}));
});
```

### Create a New Skill

* Sign into [Alexa Developer Console](https://developer.amazon.com/alexa).
* Hover over `Your Alexa Consoles` then select `Skills`
* Click `Create Skill`
* Name the skill `Parrot`
* Select `Custom` then `Create skill`
* Go to `invocations` and in the `Skill Invocation Name` type `parrot`
* Create the intent required for the skill

Intent data can be generated with `functions/parrot/skill.js`. Format the output of this file as proper JSON then paste it in the `JSON Editor`.

```js
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
```

The skill is now available in [http://alexa.amazon.com](http://alexa.amazon.com) under Skills → Your Skills → Dev Skills

#### Try It

* Alexa, open parrot.
* Alexa, ask parrot to repeat 3.

