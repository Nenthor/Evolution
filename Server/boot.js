const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');
const os = require('os');

global.path = String(__dirname);
global.data = {
    battery: '0',
    camera: '000',
    coords: 'Lokalisieren...',
    music: '0',
    settings: '000',
    speed: '0'
};

const port = os.type() == 'Linux' ? 80 : 8080;
const app = express();
const server = require('http').createServer(app);

const debugMode = true; //TODO: Remove this line

//Setup websocket
global.wss = new WebSocket.Server({ server: server });
require('./content/backend/scripts/websocket'); //Websocket Code on different script (websocket.js)

//Create array contains function
Array.prototype.contains = function (obj) {
    return this.indexOf(obj) > -1;
};

//Manage paths
const localHtmlFiles = ['index', 'music', 'camera', 'map', 'debug'];
const remoteHtmlFiles = ['index_remote', 'controll', 'map_remote', 'debug'];
const htmlFiles = localHtmlFiles.concat(remoteHtmlFiles);

//Set Startpage
app.get('/', (req, res) => {
    const redirection = req.socket.localAddress == req.ip ? '/index' : '/index_remote';
    res.status(100);
    res.redirect(redirection);
});

//Allow everyone to get CSS/fonts/images/JS files
app.use('/CSS', express.static(path.join(global.path, 'content/frontend/CSS')));
app.use('/fonts', express.static(path.join(global.path, 'content/frontend/fonts')));
app.use('/images', express.static(path.join(global.path, 'content/frontend/images')));
app.use('/JS', express.static(path.join(global.path, 'content/frontend/JS')));

for (const pageIndex in htmlFiles) {
    const page = htmlFiles[pageIndex];
    if(htmlFiles.indexOf(page) != pageIndex) continue;

    app.get(`/${page}`, (req, res) => {
        const fileRequested = path.basename(req.path);
        const allowedFiles = req.socket.localAddress == req.ip ? localHtmlFiles : remoteHtmlFiles;
    
        if (!localHtmlFiles.contains(fileRequested) && !remoteHtmlFiles.contains(fileRequested)) {
            //URL not found
            res.status(404);
            res.end();
            return;
        }
    
        if (allowedFiles.contains(fileRequested) || debugMode) {
            //Reading file
            fs.readFile(path.join(global.path, `content/frontend/html/${fileRequested}.html`), (error, data) => {
                if (error) res.status(500);
                else res.write(data); //Sending file
                res.end();
            });
        } else {
            //Forbidden page - no permission
            res.status(403);
            res.end();
        }
    });
}

//URL not found for every not registered path
app.get('*', (req, res) => { res.status(404); res.end(); });

//Open port
server.listen(port, () => console.log(`Server is listening to port ${port}`));
