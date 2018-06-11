# Alexa Parrot

[![Travis](https://img.shields.io/travis/dblock/alexa-parrot.svg?style=flat-square)](https://travis-ci.org/dblock/alexa-parrot) [![CircleCI](https://circleci.com/gh/dblock/alexa-parrot/tree/master.svg?style=shield)](https://circleci.com/gh/dblock/tree/master)


A simple parroting skill for Alexa to grasp basics of creating alexa skills with Alexa-App library and deploying to AWS Lambda Functions. Requires Use NodeJS v8.x or higher.

# Prerequisite files

## Package JSON

Require [alexa-app](https://github.com/alexa-js/alexa-app).

```json
{
  "name": "parrot",
  "version": "1.0.0",
  "description": "Alexa parroting skill",
  "main": "parrot.js",
  "dependencies": {
    "alexa-app": "^4.2.2"
  },
  "author": "Daniel Doubrovkine (db@artsy.net)",
  "license": "MIT",
  "engines": {
    "node": ">=8.0.0"
  }
}
```

## .gitignore

```
node_modules
```

## Install

```
yarn install
```

# Coding the skill

### Basic Alexa App

```js
const alexa = require('alexa-app');

const app = new alexa.app('parrot');

app.launch((req, res) => {
  res.say('I am a parrot.');
});

module.exports = app;
```

### Writing basic MochaJS tests

Add `express` and `mocha` to `package.json` and support for `yarn test`.

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

**Respond to Invalid Data**

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

**Responds to a Launch Request**

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

## Deployment to AWS Lambda

For the deployment we will use Apex, which requires files to be in a `functions` directory so lets move some files around:

```
mkdir -p functions/parrot
mv parrot.js functions/parrot
mv package.json functions/parrot
mv test functions/parrot
```

New folder structure is:
```
.
| functions/
|─── parrot/
|   | parrot.js
|   | package.json
|   |──test/
|   |  | test_parrot.js
└
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

### Creating a replying function

Add this to `functions/parrot/parrot.js`.

```js
app.intent('RepeatIntent', {
  slots: {VALUE: 'AMAZON.NUMBER'},
  utterances: ['repeat {-|VALUE}', 'to repeat {-|VALUE}']
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

## Create a new Alexa Skill

* Sign into [Alexa Developer Console](https://developer.amazon.com/alexa).
* Hover over `Your Alexa Consoles` then select `Skills`
* Click `Create Skill`
* Name the skill `Parrot`
* Select `Custom` then `Create skill`
* Go to `invocations` and in the `Skill Invocation Name` type `parrot`
* Create the intent required for the skill
* Go to `Endpoint` and select `AWS Lambda ARN`
* Copy the AWS Lambda Function ARN by accessing it in the AWS dashboard and paste it in the text field for `Default Region`
* In the Alexa Skills endpoint copy the skill ARN then in the Lambda Function configuration click the `Alexa Skills Kit` trigger, make sure `Skill ID verifcation` is enabled and paste the skill ARN in the text field then save the function
* Save and build the model to test it (example: `ask parrot to repeat 3`)

Intent data can be generated with `functions/parrot/skill.js`. Format the output of this file as proper JSON then paste it in the `JSON Editor`.

```js
const parrot = require('./parrot');

console.log('Intent Schema:');
console.log();
console.log(parrot.schemas.skillBuilder());
console.log('Utterances');
console.log(parrot.utterances());
```

The skill is now available in [http://alexa.amazon.com](http://alexa.amazon.com) under Skills → Your Skills → Dev Skills

## Try It

* Alexa, open parrot.
* Alexa, ask parrot to repeat 3.

# Setting up a CI service

CI (Continuous Integration) services will run your tests every time you commit some code and integrate flawlessly with major Git players such as GitHub, BitBucket and GitLab. Having a CI service set up will motivate you to always ensure the code you push works lest you'll be seeing the "tests failed" everywhere you have notifiers for the service set up.

For this project we have provided examples for setting up CI on Travis and on CircleCI. You can find the Travis setup [by clicking here](https://github.com/dblock/alexa-parrot/blob/master/.travis.yml) and the CircleCI setup [here](https://github.com/dblock/alexa-parrot/blob/master/circleci/config.yml)

## Setting up TravisCI

1. Go to [TravisCI.org](https://travis-ci.org/) and create an account by signing in with your GitHub
2. Once logged in click the `+` next to `My repositories` or navigate to your profile by clicking your name at the top right of the window
3. Enable the repo you want to build for
4. Push some code to the repo to start building

Note: for private repositories please go to [TravisCI.com](https://travis-ci.com/) instead

## Setting up CircleCI

1. Go to [CircleCI](https://circleci.com/) and create your account by signing in with GitHub or BitBucket
2. Once on the dashboard go to `Add Projects` on the left and add your Alexa Skill project
3. If you haven't committed your `config.yml` (in a folder `.circleci` in root) yet do so now
4. Press the button `start building` to start testing your repo from this point forward