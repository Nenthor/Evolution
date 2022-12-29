global.path = String(__dirname);
global.settings = '000';
global.music = '0';
global.navigation = 'Lokalisieren...';
global.coords = 'Lokalisieren...';
global.compass = '0';
global.camera = '0';
global.debug = true;

//Setup webserver
require('./src/backend/scripts/website');
