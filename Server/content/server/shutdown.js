const shell = require('shelljs');
const os = require('os');

//Shutdown command
if(os.type() == 'Linux')
    shell.exec('sudo shutdown now');