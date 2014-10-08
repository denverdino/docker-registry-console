var fs = require('fs');

/*
var data = JSON.stringify(config, null, '\t');

fs.writeFile('./config.json', data, function (err) {
    if (err) {
        console.log('There has been an error saving your configuration data.');
        console.log(err.message);
        return;
    }
    console.log('Configuration saved successfully.')
});
*/

var data = fs.readFileSync('./config.json');
var config = null;

try {
    config = JSON.parse(data);
}
catch (err) {
    console.log('There has been an error parsing the config JSON.');
    console.log(err);
}

module.exports = config;