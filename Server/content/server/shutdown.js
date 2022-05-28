const shell = require('shelljs');
const os = require('os');

//Shutdown command
if(os.platform == 'linux')
    shell.exec('sudo shutdown now');