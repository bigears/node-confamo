var AWS = require('aws-sdk');
var Promise = require('bluebird');
var debug = require('debug')('confamo');

var dynamodb = Promise.promisifyAll(new AWS.DynamoDB({
  region: 'eu-central-1'
}));

var conversions = {
  L: function(value) {
    return value.map(convertCfgValue);
  },
  M: function(value) {
    var obj = {};

    Object.keys(value).forEach(function(key)
    {
      obj[key] = convertCfgValue(value[key]);
    });

    return obj;
  }
};

function convertCfgValue(cfgItem)
{
  var keys = Object.keys(cfgItem);

  for(var i = 0; i < keys.length; i+=1) {
    if (conversions[keys[i]] && conversions[keys[i]].call) {
      return conversions[keys[i]].call(this, cfgItem[keys[i]]);
    }
  }

  return cfgItem[keys[0]];
}

function convertCfgItem (key, cfgItem)
{
  var obj = {};
  obj[key] = convertCfgValue(cfgItem);
  return obj;
}


module.exports = function (environment)
{
  return function (key)
  {
    return dynamodb.getItemAsync({
      TableName: 'config',
      Key: {
        environment: {
          S: environment
        },
        key: {
          S: key
        }
      }
    }).then(function(response)
    {
      var value = response.Item.value;
      debug('loaded config', value);
      var convertedValue = convertCfgValue(value);
      debug('converted config', convertedValue);
      return convertedValue;
    });
  };
};
