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

  it('fetches from the test environment by default', function() {
    dynamodb.getItemAsync = sinon.spy(function(options) {
      return Promise.resolve({});
    });

    var conf = confamo()('app');
    expect(dynamodb.getItemAsync, 'was called with', {
      TableName: 'config',
      Key: {
        environment: { S: 'test' },
        key: { S: 'app' }
      }
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
});
