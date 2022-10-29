const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const http = require('http');
const express = require('express');
const cors = require('cors')
const app = express();
const appSecure = express();

//Create array contains function
Array.prototype.contains = function (obj) { return this.indexOf(obj) > -1; };

//Set port
const port = os.type() == 'Linux' ? 80 : 8080;
const portSecure = os.type() == 'Linux' ? 443 : 8443;

//Get SSL-Certificate
const ssl = {
    key: fs.readFileSync(`${global.path}/content/backend/data/ssl/key.pem`),
    cert: fs.readFileSync(`${global.path}/content/backend/data/ssl/cert.pem`)
};

//Allow everyone to get CSS/fonts/images/JS files && Enable CORS-Policy
[app, appSecure].forEach(element => {
    element.use(cors());
    element.use('/CSS', express.static(path.join(global.path, 'content/frontend/CSS')));
    element.use('/fonts', express.static(path.join(global.path, 'content/frontend/fonts')));
    element.use('/images', express.static(path.join(global.path, 'content/frontend/images')));
    element.use('/JS', express.static(path.join(global.path, 'content/frontend/JS')));
});

//Manage paths
const localHtmlPages = ['index', 'music', 'camera', 'map', 'debug'];
const remoteHtmlPages = ['homepage', 'controll', 'map', 'debug'];

if (global.debug) { localHtmlPages.push('map_remote'); remoteHtmlPages.push('map_remote'); }

const htmlPages = localHtmlPages.concat(remoteHtmlPages);

//Set Startpage
app.get('/', (req, res) => {
    const redirection = req.socket.localAddress == req.ip ? '/index' : '/homepage';
    res.status(100);
    res.redirect(redirection);
});

//Set secure remote map page
appSecure.get('/map', (req, res) => {
    if (!global.debug && req.socket.localAddress == req.ip) {
        mapRedirect(req, res, false);
        return;
    }

    fs.readFile(path.join(global.path, `content/frontend/html/map.html`), (error, data) => {
        if (error) res.status(500);
        else res.write(data); //Sending file
        res.end();
    });
});

if (global.debug) {
    appSecure.get('/map_local', (req, res) => {
        req.url = '/map';
        mapRedirect(req, res, false);
    });
}

for (const pageIndex in htmlPages) {
    const page = htmlPages[pageIndex];
    if (htmlPages.indexOf(page) != pageIndex) continue;

    //Only shows accessable Pages for local or remote users
    app.get(`/${page}`, (req, res) => setPageAccess(req, res));
}

//URL not found for every not registered path
app.get('*', (req, res) => { res.status(404); res.end(); });
appSecure.get('*', (req, res) => { mapRedirect(req, res, false); });

function setPageAccess(req, res) {
    const fileRequested = path.basename(req.path);
    const allowedFiles = req.socket.localAddress == req.ip ? localHtmlPages : remoteHtmlPages;

    if (!localHtmlPages.contains(fileRequested) && !remoteHtmlPages.contains(fileRequested)) {
        //URL not found
        res.status(404);
        res.end();
        return;
    }

    if (allowedFiles.contains(fileRequested) || global.debug) {
        //Reading file
        if ((fileRequested == 'map' && req.socket.localAddress != req.ip) || (global.debug && fileRequested == 'map_remote')) {
            mapRedirect(req, res, true)
            return;
        }

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

function mapRedirect(req, res, toMap) {
    const url = new URL(toMap ? `https://${req.hostname}:${portSecure}/map` : `http://${req.hostname}:${port}${req.url}`);
    if (req.query.key) url.searchParams.set('key', req.query.key);

    res.status(100);
    res.redirect(url);
}

const server = http.createServer(app);
const serverSecure = https.createServer(ssl, appSecure);

//Open ports
server.listen(port, () => console.log(`Server is listening to port ${port}`));
serverSecure.listen(portSecure);

//Start websocket-server
global.server = server;
global.serverSecure = serverSecure;
require('./websocket');
