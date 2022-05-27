const WebSocket = require('ws');
const fs = require('fs');
const ArrayQueue = require('./arrayqueue');

//Remote Data
var controllClient = null;
var remoteDirection = 'STANDBY';
var remoteSpeed = 0;

//Websocket ServerListener
global.wss.on('connection', function connection(ws) {
    ws.on('message', function message(data) {
        const message = String(data).split(':');
        switch (message[0]) {
            case 'get_coords':
                readFile(ws, 'coords', 'Lokalisieren...');
                break;
            case 'get_settings':
                readFile(ws, 'settings', '000');
                break;
            case 'get_camera':
                readFile(ws, 'camera', '000');
                break;
            case 'get_music':
                readFile(ws, 'music', '0');
                break;
            case 'get_speed':
                readFile(ws, 'speed', '0');
                break;
            case 'get_battery':
                readFile(ws, 'battery', '0');
                break;
            case 'set_music':
                writeFile(message[1], 'music');
                global.data.music = String(message[1]);
                sendAllClients(`music:${global.data.music}`, ws);
                break;
            case 'set_remotedirection':
                remoteDirection = String(message[1]);
                break;
            case 'set_remotespeed':
                remoteSpeed = parseInt(message[1]);
                break;
            case 'set_settings':
                writeFile(message[1], 'settings');
                global.data.settings = String(message[1]);
                remoteControllUpdate();
                sendAllClients(`settings:${global.data.settings}`, ws);
                break;
            case 'shutdown':
                require('./shutdown');//Shutdown System
                break;
            case 'controll_request':
                manageControllRequest(ws);
                break;
            case 'controll_check':
                if(controllClient === ws) checkReceived();
                break;
            case 'remote_devicelogout':
                remoteDeviceLogout(ws);
                break;
            default:
                console.log(`${message[0]} is not available`);
                break;
        }
    });
});

//GetData on boot
global.data.battery = getData('battery', '000');
global.data.camera = getData('camera', '000');
global.data.coords = getData('coords', 'Lokalisieren...');
global.data.music = getData('music', '0');
global.data.settings = getData('settings', '000');
global.data.speed = getData('speed', '0');

//Update Section - Check if data files changed
updateData();
function updateData(){
    updateBattery(5000); //Update every 5s
    updateCamera(500); //Update every 0,5s
    updateCoords(5000); //Update every 5s
    updateSpeed(300); //Update every 0,3s
}

function updateBattery(interval){
    setInterval(() => {
        fs.readFile(`${global.path}/content/data/battery.txt`, 'utf8', (error, data) => {
            if(error){
                console.log(`Error while getting battery file`);
            }else if(global.data.battery != data){
                global.data.battery = data;
                sendAllClients(`battery:${data}`, null);
            }
        });
    }, interval);
}

function updateCamera(interval){
    setInterval(() => {
        fs.readFile(`${global.path}/content/data/camera.txt`, 'utf8', (error, data) => {
            if(error){
                console.log(`Error while getting camera file`);
            }else if(global.data.camera != data){
                global.data.camera = data;
                sendAllClients(`camera:${data}`, null);
            }
        });
    }, interval);
}

function updateCoords(interval){
    setInterval(() => {
        fs.readFile(`${global.path}/content/data/coords.txt`, 'utf8', (error, data) => {
            if(error){
                console.log(`Error while getting coords file`);
            }else if(global.data.coords != data){
                global.data.coords = data;
                sendAllClients(`coords:${data}`, null);
            }
        });
    }, interval);
}

function updateSpeed(interval){
    setInterval(() => {
        fs.readFile(`${global.path}/content/data/speed.txt`, 'utf8', (error, data) => {
            if(error){
                console.log(`Error while getting speed file`);
            }else if(global.data.speed != data){
                global.data.speed = data;
                sendAllClients(`speed:${data}`, null);
            }
        });
    }, interval);
}

function sendAllClients(message, exeption){
    wss.clients.forEach(function each(client) {
        if(client != exeption){
            if (client.readyState == WebSocket.OPEN) {
                client.send(message);
            }
        }
    });
}

function readFile(ws, file, defaultValue){
    fs.readFile(`${global.path}/content/data/${file}.txt`, 'utf8', (error, data) => {
        if(error){
            ws.send(`${file}:${defaultValue}`);
        }else ws.send(`${file}:${data}`);
    });
}

function writeFile(data, file){
    fs.writeFile(`${global.path}/content/data/${file}.txt`, String(data), error => {
        if(error){
            console.log(error);
        }
    });
}

function getData(file){
    return fs.readFileSync(`${global.path}/content/data/${file}.txt`, 'utf8');
}

//Remote Controll Section
var connectionCheck = null;
var checkreceived = false;
const controllqueue = new ArrayQueue();

function manageControllRequest(client){
    if(global.data.settings[2] != '1'){
        client.send('controll_request:Fernsteuerung wurde deaktiviert.');
    }else if(controllClient != null){
        client.send('controll_request:Bereits mit anderem Gerät verbunden.');
    } else {
        controllClient = client;
        checkRemoteConnection();
        acceptControllRequest(client);
        return;
    }

    controllqueue.addElement(client);
}

function remoteControllUpdate() {
    if(global.data.settings[2] == '1' && controllClient == null && !controllqueue.isEmpty()){
        //Enable remote connection
        manageControllRequest(controllqueue.getElement());
    }else if(global.data.settings[2] == '0' && controllClient != null){
        //Disable remote connection
        controllqueue.addElement(controllClient);
        controllClient.send('controll_request:Fernsteuerung wurde deaktiviert.');
        controllClient = null;
    }
}

function acceptControllRequest(client){
    client.send('controll_request:accepted');
    sendAllClients('remote_controll:on', client);
}

function remoteDeviceLogout(client){
    if(client == controllClient){
        controllClient = null;
        if(connectionCheck != null){ clearInterval(connectionCheck); connectionCheck = null; }

        if(global.data.settings[2] == '1' && !controllqueue.isEmpty()){
            controllClient = controllqueue.getElement();
            checkRemoteConnection();
            acceptControllRequest(controllClient);
        }else sendAllClients('remote_controll:off', client);;
    }else if(!controllqueue.isEmpty()) controllqueue.removeElement(client);
}

function checkRemoteConnection(){
    checkReceived();
    connectionCheck = setInterval(() => {
        if(controllClient == null) {
            clearInterval(connectionCheck);
            return;
        }
        if(checkreceived){
            controllClient.send('controll_check');
            checkreceived = false;
        }else{
            controllClient.send('controll_request:Reaktionszeit ist zu groß. Webseite muss neu geladen werden.');
            remoteDeviceLogout(controllClient);
        }
    }, 2000); //Send Check Request every 2s
}

function checkReceived(){
    checkreceived = true;
}