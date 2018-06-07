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

  it('responds to a launch event', () => request(server)
    .post('/parrot')
    .send({request: {type: 'LaunchRequest'}})
    .expect(200)
    .then((response) => {
      const {ssml} = response.body.response.outputSpeech;
  
      console.log(ssml);
  
      return expect(ssml).to.eql('<speak>I am a parrot.</speak>');
    }));

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
      const {ssml} = response.body.response.outputSpeech;

      
      return expect(ssml).to.eql('<speak>You said 2. I repeat, you said 2. I repeat, you said 2.</speak>');
    }));
});