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
  this.environment = options.environment;
  this.refresh = options.refresh;
  this._updating = false;
  setImmediate(this.update.bind(this));
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
};
ConfigItem.prototype.update = function() {
  if(this.updating) { return; }
  this.updating = true;

  dynamodb.getItem({
    TableName: tableName,
    Key: {
      environment: { S: this.environment },
      key: { S: this.key }
    }
  }, function(err, res) {
    this.updating = false;
    this.scheduleRefresh();

    if(err) { return this.emit('error', err); }
    if(!res.Item) { return this.emit('error', 'No data'); }

    var data = attr.unwrap(res.Item).value;
    this.emit('data', data);
  }.bind(this));
};
ConfigItem.prototype.scheduleRefresh = function() {
  if(this.refreshTimer) {
    clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
  }

  if(this.refresh) {
    var self = this;
    this.refreshTimer = setTimeout(this.update.bind(this), this.refresh);
  }
};
ConfigItem.prototype.stop = function() {
  if(this.refreshTimer) { clearTimeout(this.refreshTimer); }
  this.refresh = null;
}

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
