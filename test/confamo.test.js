'use strict'
var expect = require('unexpected').clone();
expect.installPlugin(require('unexpected-sinon'));
var sinon = require('sinon');
var rewire = require('rewire');
var confamo = rewire('../');

var dynamodb = { };
var process = {
  env: {
    ENVIRONMENT: 'test'
  }
};
confamo.__set__('dynamodb', dynamodb);
confamo.__set__('process', process);

describe('confamo', function() {
  it('exports a function', function() {
    expect(confamo, 'to be a function');
  });

  it('returns a function', function() {
    expect(confamo(), 'to be a function');
  });

  it('fetches from the test environment by default', function(done) {
    dynamodb.getItem = sinon.spy(function(options, cb) {
      cb(null, {Item: {"value": {"M": {"config_key": {"S": "string_value"}}}}});
    });

    var conf = confamo()('app');

    conf.on('data', function(data) {
      expect(dynamodb.getItem, 'was called with', {
        TableName: 'config',
        Key: {
          environment: { S: 'test' },
          key: { S: 'app' }
        }
      });

      expect(data, 'to equal', {"config_key": "string_value"});
      done();
    });
  });

  it('returns null if no config item is found', function() {
    dynamodb.getItemAsync = sinon.spy(function(options) {
      return Promise.resolve({});
    });

    return confamo()('app').then(conf => expect(conf, 'to equal', null));
  });

  it('converts array config from dynamodb format to javascript object', function() {
    dynamodb.getItemAsync = sinon.spy(function(options) {
      return Promise.resolve({
        Item: {
          value: {
            L: [
              {
                M: {
                  string: { S: 'test' },
                  number: { N: 123 }
                }
              },
              {
                N: 123
              }
            ]
          }
        }
      });
    });

    return confamo()('app').then(conf =>
      expect(conf, 'to equal', [{string: 'test', number: 123}, 123]));
  });

  it('converts object config from dynamodb fromat to javascript object', function() {
    dynamodb.getItemAsync = sinon.spy(function(options) {
      return Promise.resolve({
        Item: {
          value: {
            M: {
              string: { S: 'test' },
              number: { N: 123 },
              array: { L: [ { S: 'a1' }, { S: 'a2' } ] }
            }
          }
        }
      });
    });

    return confamo()('app').then(conf =>
      expect(conf, 'to equal', { string: 'test', number: 123, array: ['a1', 'a2'] }));
  });

  describe('refresh', function() {
    it('calls the data event at intervals', function(done) {
      dynamodb.getItem = sinon.spy(function(options, cb) {
        cb(null, {Item: {"value": {"M": {"config_key": {"S": "string_value"}}}}});
      });

      var options = {refresh: 100};
      var confRecevied = 0;
      var conf = confamo()('app', options);

      conf.on('data', function(data) {
        expect(dynamodb.getItem, 'was called with', {
          TableName: 'config',
          Key: {
            environment: { S: 'test' },
            key: { S: 'app' }
          }
        });
        expect(data, 'to equal', {"config_key": "string_value"});
        confRecevied += 1;
        if(confRecevied === 3) {
          conf.stop();
          done();
        }
      });
    });
  });
});
