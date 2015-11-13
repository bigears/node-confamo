# Confamo, retrieve configuration from Amazon DynamoDB

## Usage

    var confamo = require('confamo')('staging');
    confamo('my-app').then(function(config) {
        console.log(config);
    });
    
## Environment variables

<dl>
<dt>REGION</dt><dd>Set the AWS region.</dd>
<dt>ENVIRONMENT</dt><dd>Set the environment instead of passing it.</dd>
<dt>CONFAMO_TABLE</dt><dd>Set the table name, defaults to "config".</dd>
</dl>
