const express = require('express');
const path = require('path');
const fs = require('fs');
const os = require('os');

//Create array contains function
Array.prototype.contains = function (obj) { return this.indexOf(obj) > -1; };

const port = os.type() == 'Linux' ? 80 : 8080;
const app = express();
const server = require('http').createServer(app);

//Manage paths
const localHtmlPages = ['index', 'music', 'camera', 'map', 'debug'];
const remoteHtmlPages = ['index_remote', 'controll', 'map_remote', 'debug'];
const htmlPages = localHtmlPages.concat(remoteHtmlPages);

const debugMode = true; //TODO: Remove this line

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

for (const pageIndex in htmlPages) {
    const page = htmlPages[pageIndex];
    if (htmlPages.indexOf(page) != pageIndex) continue;

    //Only shows accessable Pages for local or remote users
    app.get(`/${page}`, (req, res) => setPageAccess(req, res));
}

//URL not found for every not registered path
app.get('*', (req, res) => { res.status(404); res.end(); });

//Open port
server.listen(port, () => console.log(`Server is listening to port ${port}`));

//Start websocketServer
global.server = server;
require('./websocket');

function setPageAccess(req, res) {
    const fileRequested = path.basename(req.path);
    const allowedFiles = req.socket.localAddress == req.ip ? localHtmlPages : remoteHtmlPages;

    if (!localHtmlPages.contains(fileRequested) && !remoteHtmlPages.contains(fileRequested)) {
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
}
