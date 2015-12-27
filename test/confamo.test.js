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
});
