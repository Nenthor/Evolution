const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');
const os = require('os');

global.path = String(__dirname);
global.data = {
    battery : '0', 
    camera : '000', 
    coords : 'Lokalisieren...',
    music : '0',
    settings : '000',
    speed : '0'
};

var port = 80;
const app = express();
const server = require('http').createServer(app);

//Setup websocket
global.wss = new WebSocket.Server({ server:server });
require('./content/server/websocket'); //Websocket Code on different script (websocket.js)

//Create array contains function
Array.prototype.contains = function(obj) {
    return this.indexOf(obj) > -1;
};

//Manage paths
const localHtmlFiles = ['index.html', 'music.html', 'camera.html'];
const remoteHtmlFiles = ['index_remote.html', 'controll.html'];

//Set Startpage
app.get('/', function (req, res) {
    var pagePath = '';
    if(req.socket.localAddress == req.ip)
        pagePath = path.join(global.path, 'content/html/index.html');
    else
        pagePath = path.join(global.path, 'content/html/index_remote.html');

    fs.readFile(pagePath, function(error, data){
        if(error)
            res.status(500);
        else
            res.write(data);
        res.end();
    });
});

//Allow everyone to get CSS/fonts/images/JS files
app.use('/content/CSS', express.static(path.join(global.path, 'content/CSS')));
app.use('/content/fonts', express.static(path.join(global.path, 'content/fonts')));
app.use('/content/images', express.static(path.join(global.path, 'content/images')));
app.use('/content/JS', express.static(path.join(global.path, 'content/JS')));

app.get('/content/html/*', function (req, res) {
    const fileRequested = path.basename(req.path);

    if(req.socket.localAddress == req.ip){
        if(localHtmlFiles.contains(fileRequested)){
            //Reading file
            fs.readFile(path.join(global.path, `content/html/${fileRequested}`), function(error, data){
                if(error){
                    res.status(500);
                }else res.write(data);
                res.end();
            });
            return;
        }else if(remoteHtmlFiles.contains(fileRequested)){
            //Forbidden page - no permission
            res.status(403);
            res.end();
            return;
        }
    }else{
        if(remoteHtmlFiles.contains(fileRequested)){
            //Reading file
            fs.readFile(path.join(global.path, `content/html/${fileRequested}`), function(error, data){
                if(error){
                    res.status(500);
                }else res.write(data);
                res.end();
            });
            return;
        }else if(localHtmlFiles.contains(fileRequested)){
            //Forbidden page - no permission
            res.status(403);
            res.end();
            return;
        }
    }

    //URL not found
    res.status(404);
    res.end();
});

//URL not found for every not registered path
app.get('*', (req, res) => { res.status(404); res.end(); });

//Open port
if(os.platform() == 'linux'){
	server.listen(port, () => console.log(`Server is listening to port ${port}`));
}else{
	port = 8080;
	server.listen(port, () => console.log(`Server is listening to port ${port}`))
}

