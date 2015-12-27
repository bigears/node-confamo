var AWS = require('aws-sdk');
var attr = require('dynamodb-data-types').AttributeValue;
var Promise = require('bluebird');
var debug = require('debug')('confamo');

var awsConfig = {};
if(process.env['REGION']) {
  awsConfig.region = process.env['REGION'];
}

var dynamodb = Promise.promisifyAll(new AWS.DynamoDB(awsConfig));
var tableName = process.env['CONFAMO_TABLE'] || 'config';

module.exports = function (environment) {
  if(!environment) {
    environment = process.env["ENVIRONMENT"];
  }

  return function (key) {
    return dynamodb.getItemAsync({
      TableName: tableName,
      Key: {
        environment: {
          S: environment
        },
        key: {
          S: key
        }
      }
    }).then(function(response) {
      if(!response.Item) { return null; }
      return attr.unwrap(response.Item).value;
    });
  };
};
