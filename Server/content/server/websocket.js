const WebSocket = require('ws');
const fs = require('fs');
const os = require('os');
const ArrayQueue = require('./arrayqueue');
const navigation = require('./navigation');

//Remote Data
var controllClient = null;
var remoteDirection = 'STANDBY';
var remoteSpeed = 0;

//Enum
const importance = {HIGH:0, MEDIUM:1, LOW:2}; //for debugging
var currentImportance = importance.MEDIUM;

const incoming = {
    get_coords:'get_coords', get_settings:'get_settings', get_camera:'get_camera', get_music:'get_music', get_speed:'get_speed', get_battery:'get_battery', 
    get_navigation:'get_navigation', get_debugdata:'get_debugdata', set_music:'set_music', set_remotedirection:'set_remotedirection', set_remotespeed:'set_remotespeed', set_settings:'set_settings',
    shutdown:'shutdown', add_debuglistener:'add_debuglistener', remove_debuglistener:'remove_debuglistener', controll_request:'controll_request', controll_check:'controll_check',
    remote_devicelogout:'remote_devicelogout', set_importance:'set_importance'
}; //Incoming messages

const outgoing = {
    music:'music', settings:'settings', battery:'battery', speed:'speed', coords:'coords', camera:'camera', set_navigation:'set_navigation', set_memoryusage:'set_memoryusage', 
    set_cpuusage:'set_cpuusage', set_systemload:'set_systemload', controll_request:'controll_request', remote_controll:'remote_controll', controll_check:'controll_check',
    add_debugmessage:'add_debugmessage'
}; //Outgoing Messages

//Setup navigation system
navigation.extractFileData(global.path);

//Send Messages to clients (and logging them)
function send(client, message, important){
    client.send(message);
    if(currentImportance >= important) addDebugMessage(message, false);
}

//received messages logging
function receiveMessages(message, important){
    if(currentImportance >= important) addDebugMessage(message, true);
}

function sendAllClients(message, exeption, importance){
    wss.clients.forEach(client => {
        if(client != exeption){
            if (client.readyState == WebSocket.OPEN) client.send(message);
        }
    });
    if(currentImportance >= importance) addDebugMessage(message, false);
}

//Websocket ServerListener
global.wss.on('connection', ws => {
    ws.on('message', data => {
        const message = String(data).split(':');
        switch (message[0]) {
            case incoming.get_coords:
                readFile(ws, 'coords', 'Lokalisieren...');
                receiveMessages(String(data), importance.LOW);
                break;
            case incoming.get_settings:
                readFile(ws, 'settings', '000');
                receiveMessages(String(data), importance.LOW);
                break;
            case incoming.get_camera:
                readFile(ws, 'camera', '000');
                receiveMessages(String(data), importance.LOW);
                break;
            case incoming.get_music:
                readFile(ws, 'music', '0');
                receiveMessages(String(data), importance.LOW);
                break;
            case incoming.get_speed:
                readFile(ws, 'speed', '0');
                receiveMessages(String(data), importance.LOW);
                break;
            case incoming.get_battery:
                readFile(ws, 'battery', '0');
                receiveMessages(String(data), importance.LOW);
                break;
            case incoming.get_navigation:
                getNavigation(ws);
                receiveMessages(String(data), importance.LOW);
                break;
            case incoming.set_music:
                writeFile(message[1], 'music');
                global.data.music = String(message[1]);
                sendAllClients(`${outgoing.music}:${global.data.music}`, ws, importance.LOW);
                receiveMessages(String(data), importance.MEDIUM);
                break;
            case incoming.set_remotedirection:
                remoteDirection = String(message[1]);
                receiveMessages(String(data), importance.MEDIUM);
                break;
            case incoming.set_remotespeed:
                remoteSpeed = parseInt(message[1]);
                receiveMessages(String(data), importance.MEDIUM);
                break;
            case incoming.set_settings:
                writeFile(message[1], 'settings');
                global.data.settings = String(message[1]);
                remoteControllUpdate();
                sendAllClients(`${outgoing.settings}:${global.data.settings}`, ws, importance.LOW);
                receiveMessages(String(data), importance.MEDIUM);
                break;
            case incoming.set_importance:
                currentImportance = parseInt(message[1]);
                receiveMessages(String(data), importance.LOW);
                break;
            case incoming.shutdown:
                receiveMessages(String(data), importance.HIGH);
                require('./shutdown');//Shutdown System
                break;
            case incoming.add_debuglistener:
                addDebugListener(ws);
                sendDebugData(ws, true);
                receiveMessages(String(data), importance.LOW);
                break;
            case incoming.remove_debuglistener:
                removeDebugListener(ws);
                receiveMessages(String(data), importance.LOW);
                break;
            case incoming.controll_request:
                manageControllRequest(ws);
                receiveMessages(String(data), importance.MEDIUM);
                break;
            case incoming.controll_check:
                if(controllClient === ws) checkReceived();
                receiveMessages(String(data), importance.LOW);
                break;
            case incoming.remote_devicelogout:
                remoteDeviceLogout(ws);
                receiveMessages(String(data), importance.HIGH);
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

navigation.setNavigation(global.data.coords); //Send data to navigation script
setDebugInterval(global.data.coords); //Check stats every 5s

//Update Section - Check if data files changed
updateData();
function updateData(){
    updateBattery(5000); //Update every 5s
    updateCamera(500); //Update every 0,5s
    updateCoords(1000); //Update every 1s
    updateSpeed(300); //Update every 0,3s
}

function updateBattery(interval){
    setInterval(() => {
        fs.readFile(`${global.path}/content/data/battery.txt`, 'utf8', (error, data) => {
            if(error){
                console.log(`Error while getting battery file`);
            }else if(global.data.battery != data){
                global.data.battery = data;
                sendAllClients(`${outgoing.battery}:${data}`, null, importance.LOW);
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
                sendAllClients(`${outgoing.camera}:${data}`, null, importance.LOW);
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
                setNavigation(data); //Send data to navigation script
                sendAllClients(`${outgoing.coords}:${data}`, null), importance.LOW;
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
                sendAllClients(`${outgoing.speed}:${data}`, null, importance.LOW);
            }
        });
    }, interval);
}

function readFile(ws, file, defaultValue){
    fs.readFile(`${global.path}/content/data/${file}.txt`, 'utf8', (error, data) => {
        if(error){
            send(ws, `${file}:${defaultValue}`, importance.LOW);
        }else send(ws, `${file}:${data}`, importance.LOW);
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

//Navigation Script
function getNavigation(client){
    const data = navigation.getNavigation();
    if(data == null) return;

    send(client, `${outgoing.set_navigation}:${data}`, importance.LOW);
}

function setNavigation(coords){
    const data = navigation.setNavigation(coords); 
    if(data == null) return;

    sendAllClients(`${outgoing.set_navigation}:${data}`, null, importance.LOW);
}

//Debug Section
var debugListeners = [];
var debugInterval = setDebugInterval();
var memoryUsage = 0, cpuusage = 0, systemload = 0;

function addDebugListener(client){
    if(debugListeners.length == 0) debugInterval = setDebugInterval();
    debugListeners.push(client);
    sendDebugData(client);
}

function removeDebugListener(client){
    for (let index = 0; index < debugListeners.length; index++) {
        const listener = debugListeners[index];
        if(listener != client) continue;

        debugListeners.splice(index);
        if(debugListeners.length == 0) clearInterval(debugInterval);
    }
}

function setDebugInterval(){
    return setInterval(() => {
        for (let index = 0; index < debugListeners.length; index++) {
            const listener = debugListeners[index];
            sendDebugData(listener, false);
        }
    }, 5000); //Every 5s
}

function addDebugMessage(message, incoming){
    if(debugListeners.length == 0) return;

    for (let index = 0; index < debugListeners.length; index++) {
        const listener = debugListeners[index];
        message = message.replace(':', '=');
        if(incoming){
            listener.send(`${outgoing.add_debugmessage}:IN:${message}`);
        }else{
            listener.send(`${outgoing.add_debugmessage}:OUT:${message}`);
        }
        
    }
}

function sendDebugData(client, force){
    sendMemoryUsage(client, force);
    sendCpuUsage(client, force);
    sendSystemLoad(client, force);
}

function sendMemoryUsage(client, force){
    const percentage = Math.round(os.freemem / os.totalmem * 100);
    if(percentage == memoryUsage && !force) return;
    memoryUsage = percentage;
    send(client, `${outgoing.set_memoryusage}:${percentage}`, importance.LOW);
}

function sendCpuUsage(client, force){
    const cpus = os.cpus();
    let percentage = 0.0;

    for (let index = 0; index < cpus.length; index++) {
        const core = cpus[index];
        let work = core.times.irq + core.times.nice + core.times.sys + core.times.user;
        let total = work + core.times.idle;
        percentage += work / total;
    }

    percentage = Math.round(percentage / cpus.length * 100);
    if(percentage == cpuusage && !force) return;
    cpuusage = percentage;
    send(client, `${outgoing.set_cpuusage}:${percentage}`, importance.LOW);
}

function sendSystemLoad(client, force){
    const load = Math.round(os.loadavg()[2] / os.cpus().length * 100);
    if(load == systemload && !force) return;
    systemload = load;
    send(client, `${outgoing.set_systemload}:${load}`, importance.LOW);
}

//Remote Controll Section
var connectionCheck = null;
var checkreceived = false;
const controllqueue = new ArrayQueue();

function manageControllRequest(client){
    if(global.data.settings[2] != '1'){
        send(client, `${outgoing.controll_request}:Fernsteuerung wurde deaktiviert.`, importance.HIGH);
    }else if(controllClient != null){
        send(client, `${outgoing.controll_request}:Bereits mit anderem Gerät verbunden.`, importance.HIGH);
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
        send(controllClient, `${outgoing.controll_request}:Fernsteuerung wurde deaktiviert.`, importance.MEDIUM);
        controllClient = null;
    }
}

function acceptControllRequest(client){
    send(client, `${outgoing.controll_request}:accepted`, importance.MEDIUM);
    sendAllClients(`${outgoing.remote_controll}:on`, client, importance.HIGH);
}

function remoteDeviceLogout(client){
    if(client == controllClient){
        controllClient = null;
        if(connectionCheck != null){ clearInterval(connectionCheck); connectionCheck = null; }

        if(global.data.settings[2] == '1' && !controllqueue.isEmpty()){
            controllClient = controllqueue.getElement();
            checkRemoteConnection();
            acceptControllRequest(controllClient);
        }else sendAllClients(`${outgoing.remote_controll}:off`, client, importance.HIGH);
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
            send(controllClient, `${outgoing.controll_check}`, importance.LOW);
            checkreceived = false;
        }else{
            send(controllClient, `${outgoing.controll_request}:Reaktionszeit ist zu groß. Webseite muss neu geladen werden.`, importance.HIGH);
            remoteDeviceLogout(controllClient);
        }
    }, 2000); //Send Check Request every 2s
}

function checkReceived(){
    checkreceived = true;
}