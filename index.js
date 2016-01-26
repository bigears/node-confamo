var AWS = require('aws-sdk');
var attr = require('dynamodb-data-types').AttributeValue;
var EventEmitter = require('events');
var util = require('util');

var awsConfig = {};
if(process.env['REGION']) {
  awsConfig.region = process.env['REGION'];
}

var dynamodb = new AWS.DynamoDB(awsConfig);
var tableName = process.env['CONFAMO_TABLE'] || 'config';

var ConfigItem = function(key, options) {
  this.key = key;
  this.options = options;
  this.scheduleRefresh();
}
util.inherits(ConfigItem, EventEmitter);
ConfigItem.prototype.then = function(cb) {
  var promise = new Promise(function(resolve, reject) {
    this.once('data', function(data) {
      resolve(data);
    });
    this.once('error', function(err) {
      reject(err);
    });
  }.bind(this));

  setImmediate(this.update.bind(this));
};
ConfigItem.prototype.update = function(cb) {
  if(!cb) cb = function(){};

  dynamodb.getItem({
    TableName: tableName,
    Key: {
      environment: { S: this.options.environment },
      key: { S: this.key }
    }
  }, function(err, res) {
    if(err) { return this.emit('error', err); cb(err); }
    if(!res.Item) { return this.emit('error', 'No data'); cb(null, null); }

    var data = attr.unwrap(res.Item).value;
    this.emit('data', data);
    cb(null, data);
  }.bind(this));
};
ConfigItem.prototype.scheduleRefresh = function() {
  if(this.refreshTimer) clearTimeout(this.refreshTimer);

  if(this.options.refresh) {
    var self = this;

    self.refreshTimer = setTimeout(function() {
      self.update(self.scheduleRefresh());
    }, self.options.refresh);
  }
};

module.exports = function (environment) {
  if(!environment) {
    environment = process.env["ENVIRONMENT"];
  }

  return function (key, options) {
    if(!options) { options = {}; }
    options.environment = environment;

    return new ConfigItem(key, options);
  };
};
