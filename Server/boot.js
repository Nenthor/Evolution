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

//Setup websocket
global.wss = new WebSocket.Server({ server: server });
require('./content/server/websocket'); //Websocket Code on different script (websocket.js)

//Create array contains function
Array.prototype.contains = function (obj) {
    return this.indexOf(obj) > -1;
};

//Manage paths
const localHtmlFiles = ['index', 'music', 'camera', 'map', 'debug'];
const remoteHtmlFiles = ['index_remote', 'controll', 'map_remote', 'debug'];

//Set Startpage
app.get('/', (req, res) => {
    const redirection = req.socket.localAddress == req.ip ? '/content/html/index.html' : '/content/html/index_remote.html';
    res.status(100);
    res.redirect(redirection);
});

//Allow everyone to get CSS/fonts/images/JS files
app.use('/content/CSS', express.static(path.join(global.path, 'content/CSS')));
app.use('/content/fonts', express.static(path.join(global.path, 'content/fonts')));
app.use('/content/images', express.static(path.join(global.path, 'content/images')));
app.use('/content/JS', express.static(path.join(global.path, 'content/JS')));
app.use('/content/html', express.static(path.join(global.path, 'content/html'))); //TODO: remove this line

app.get('/content/html/*', (req, res) => {
    const fileRequested = path.basename(req.path, '.html');
    const allowedFiles = req.socket.localAddress == req.ip ? localHtmlFiles : remoteHtmlFiles;

    if (!localHtmlFiles.contains(fileRequested) && !remoteHtmlFiles.contains(fileRequested)) {
        //URL not found
        res.status(404);
        res.end();
        return;
    }

    if (allowedFiles.contains(fileRequested)) {
        //Reading file
        fs.readFile(path.join(global.path, `content/html/${fileRequested}.html`), (error, data) => {
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

//URL not found for every not registered path
app.get('*', (req, res) => { res.status(404); res.end(); });

//Open port
server.listen(port, () => console.log(`Server is listening to port ${port}`));
