const WebSocket = require('ws');
const fs = require('fs');
const os = require('os');
const sound = require('play-sound')(opts = {});
const ArrayQueue = require('./arrayqueue');
const navigation = require('./navigation');
const gpio = require('./gpio');
const engine = require('./communication'); //Engine connection

//Remote Data
var controllClient = null;
var remoteDirection = 'STANDBY';
var remoteSpeed = 0;

//Enum
const importance = { HIGH: 0, MEDIUM: 1, LOW: 2 }; //For debugging
var currentImportance = importance.MEDIUM;

const incoming = {  //Incoming websocket messages
    get_coords: 'get_coords', get_settings: 'get_settings', get_camera: 'get_camera', get_music: 'get_music', get_speed: 'get_speed', get_battery: 'get_battery',
    get_navigation: 'get_navigation', get_debugdata: 'get_debugdata', get_remotecontrollstate: 'get_remotecontrollstate', set_music: 'set_music', set_remotedirection: 'set_remotedirection', set_remotespeed: 'set_remotespeed', set_settings: 'set_settings',
    shutdown: 'shutdown', add_debuglistener: 'add_debuglistener', remove_debuglistener: 'remove_debuglistener', controll_request: 'controll_request', controll_check: 'controll_check',
    remote_devicelogout: 'remote_devicelogout', set_importance: 'set_importance'
};

const outgoing = {  //Outgoing messages to web-clients
    music: 'music', settings: 'settings', battery: 'battery', speed: 'speed', coords: 'coords', camera: 'camera', set_navigation: 'set_navigation', set_memoryusage: 'set_memoryusage',
    set_cpuusage: 'set_cpuusage', set_systemload: 'set_systemload', controll_request: 'controll_request', remote_controll: 'remote_controll', controll_check: 'controll_check',
    add_debugmessage: 'add_debugmessage'
};

//Setup navigation system
navigation.extractFileData(global.path);

//Send Messages to clients (and logging them)
function send(client, message, debugMessage, important) {
    client.send(message);
    if (important <= currentImportance && debugMessage != null) addDebugMessage(debugMessage, false);
}

//received messages logging
function receiveMessages(message, important) {
    if (important <= currentImportance) addDebugMessage(message, true);
}

function sendAllClients(message, debugMessage, exeption, importance) {
    wss.clients.forEach(client => {
        if (client != exeption) {
            if (client.readyState == WebSocket.OPEN) client.send(message);
        }
    });
    if (importance <= currentImportance && debugMessage != null) addDebugMessage(debugMessage, false);
}

//Websocket ServerListener
global.wss.on('connection', ws => {
    ws.on('message', data => {
        const message = String(data).split(':');
        switch (message[0]) {
            case incoming.get_coords:
                receiveMessages('Anfrage für "Koordinaten"-Datei erhalten.', importance.LOW);
                readFile(ws, 'coords', 'Lokalisieren...');
                break;
            case incoming.get_settings:
                receiveMessages('Anfrage für "Einstellungs"-Datei erhalten.', importance.LOW);
                readFile(ws, 'settings', '000');
                break;
            case incoming.get_camera:
                receiveMessages('Anfrage für "Kamera"-Datei erhalten.', importance.LOW);
                readFile(ws, 'camera', '000');
                break;
            case incoming.get_music:
                receiveMessages('Anfrage für "Musik"-Datei erhalten.', importance.LOW);
                readFile(ws, 'music', '0');
                break;
            case incoming.get_speed:
                receiveMessages('Anfrage für "Geschwindigkeits"-Datei erhalten.', importance.LOW);
                readFile(ws, 'speed', '0');
                break;
            case incoming.get_battery:
                receiveMessages('Anfrage für "Batterie"-Datei erhalten.', importance.LOW);
                readFile(ws, 'battery', '0');
                break;
            case incoming.get_navigation:
                receiveMessages('Anfrage für "Navigations"-Datei erhalten.', importance.LOW);
                getNavigation(ws);
                break;
            case incoming.get_remotecontrollstate:
                receiveMessages('Anfrage für "Fernsteuerungs-Zustand" erhalten.', importance.LOW);
                hasRemoteConnection(ws);
                break;
            case incoming.set_music:
                receiveMessages(`Änderung der "Musik"-Datei zu "${message[1]}" erhalten.`, importance.MEDIUM);
                writeFile(message[1], 'music');
                global.data.music = String(message[1]);
                playMusic(parseInt(message[1]));
                sendAllClients(`${outgoing.music}:${global.data.music}`, `Änderung der "Musik"-Datei zu "${message[1]}" wird an alle Klienten gesendet.`, ws, importance.LOW);
                break;
            case incoming.set_remotedirection:
                receiveMessages(`Fernsteuerung wird auf "${message[1]}" gesetzt.`, importance.MEDIUM);
                remoteDirection = String(message[1]);
                break;
            case incoming.set_remotespeed:
                receiveMessages(`Geschwindigkeit der Fernsteuerung wird auf "${message[1]}" gesetzt.`, importance.MEDIUM);
                remoteSpeed = parseInt(message[1]);
                break;
            case incoming.set_settings:
                receiveMessages(`Änderung der "Einstellungs"-Datei zu "${message[1]}" erhalten.`, importance.MEDIUM);
                writeFile(message[1], 'settings');
                global.data.settings = String(message[1]);
                remoteControllUpdate();
                sendAllClients(`${outgoing.settings}:${global.data.settings}`, `Änderung der "Einstellungs"-Datei zu "${message[1]}" wird an alle Klienten gesendet.`, ws, importance.LOW);
                break;
            case incoming.set_importance:
                receiveMessages(`Änderung der "Debug-Nachrichtenstufe" auf "${message[1]}" erhalten.`, importance.LOW);
                currentImportance = parseInt(message[1]);
                break;
            case incoming.shutdown:
                receiveMessages(`Anfrage auf "System-Shutdown" erhalten.`, importance.HIGH);
                require('./shutdown'); //Shutdown System
                break;
            case incoming.add_debuglistener:
                receiveMessages(`Debug-Klient wird hinzugefügt.`, importance.LOW);
                addDebugListener(ws);
                sendDebugData(ws, true);
                break;
            case incoming.remove_debuglistener:
                receiveMessages(`Debug-Klient wird entfernt.`, importance.LOW);
                removeDebugListener(ws);
                break;
            case incoming.controll_request:
                receiveMessages(`Anfrage auf "Fernsteuerungs-Kontrolle" erhalten.`, importance.MEDIUM);
                manageControllRequest(ws);
                break;
            case incoming.controll_check:
                receiveMessages(`Kontroll-Check erhalten.`, importance.LOW);
                if (controllClient === ws) checkReceived();
                break;
            case incoming.remote_devicelogout:
                receiveMessages(`"Fernsteuerungs-Klient" wurde ausgeloggt.`, importance.HIGH);
                remoteDeviceLogout(ws);
                break;
            default:
                console.warn(`${message[0]} is not available.`);
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

playMusic(parseInt(global.data.music));

function getData(file) {
    return fs.readFileSync(`${global.path}/content/data/${file}.txt`, 'utf8');
}

function readFile(ws, file, defaultValue) {
    fs.readFile(`${global.path}/content/data/${file}.txt`, 'utf8', (error, data) => {
        if (error) {
            send(ws, `${file}:${data}`, `Konnte "${file}.txt" nicht lesen. Standardwert wird verwendet: ${defaultValue}.`, importance.HIGH);
        } else send(ws, `${file}:${data}`, `"${file}.txt" mit dem Wert "${data}" wird zum Klienten gesendet.`, importance.LOW);
    });
}

function writeFile(data, file) {
    fs.writeFile(`${global.path}/content/data/${file}.txt`, String(data), error => {
        if (error) {
            console.warn(`${file}.txt konnte nicht geändert werden: ${error}`);
        }
    });
}

//Update Section - Check if data files changed
gpio.setup(updateBattery, updateCamera, updateCoords, updateSpeed);

function updateBattery(battery) {
    global.data.battery = battery;
    sendAllClients(`${outgoing.battery}:${battery}`, `Ändert "Batterie" zu ${battery}`, null, importance.LOW);
}

function updateCamera(camera) {
    global.data.camera = camera;
    sendAllClients(`${outgoing.camera}:${camera}`, `Ändert "Kamera" zu ${camera}`, null, importance.LOW);
}

function updateCoords(coords) {
    global.data.coords = coords;
    setNavigation(data); //Send data to navigation script
    sendAllClients(`${outgoing.coords}:${coords}`, `Ändert "Koordinaten" zu ${coords}`, null, importance.LOW);
}

function updateSpeed(speed) {
    global.data.speed = speed;
    sendAllClients(`${outgoing.speed}:${speed}`, `Ändert "Geschwindigkeit" zu ${speed}`, null, importance.LOW);
}

//Navigation Script
function getNavigation(client) {
    const data = navigation.getNavigation();
    if (data == null) return;

    send(client, `${outgoing.set_navigation}:${data}`, `"Navigation" mit dem Wert "${data}" wird zum Klienten gesendet.`, importance.LOW);
}

function setNavigation(coords) {
    const data = navigation.setNavigation(coords);
    if (data == null) return;

    sendAllClients(`${outgoing.set_navigation}:${data}`, `Ändert "Navigation" zu ${data}.`, null, importance.LOW);
}

//Music Section
var currentMusic = undefined;

function playMusic(index){
    if(index == 0){
        //Stop music
        if(currentMusic != null) currentMusic.kill();
        currentMusic = null;
        return;
    }

    if(currentMusic != null) currentMusic.kill(); //Stop current music

    switch(index){
        case 1:
            playMusicFile('rickroll.mp3');
            break;
        case 2:
            playMusicFile('mario.mp3');
            break;
        case 3:
            playMusicFile('salsa.mp3');
            break;
        case 4:
            playMusicFile('podcast.mp3');
            break;
    }
}

function playMusicFile(file){
    currentMusic = sound.play(`${global.path}/content/sound/${file}`, { mplayer: ['-loop 0'] }, (err) => {
        if(err && err != 1) console.log(`Error while trying to play ${file}.`);
    });
}

//Debug Section
var debugListeners = [];
var debugInterval = setDebugInterval();
var memoryUsage = 0, cpuusage = 0, systemload = 0;

function addDebugListener(client) {
    if (debugListeners.length == 0) debugInterval = setDebugInterval();
    debugListeners.push(client);
    sendDebugData(client);
}

function removeDebugListener(client) {
    for (let index = 0; index < debugListeners.length; index++) {
        const listener = debugListeners[index];
        if (listener != client) continue;

        debugListeners.splice(index);
        if (debugListeners.length == 0) clearInterval(debugInterval);
    }
}

function setDebugInterval() {
    return setInterval(() => {
        for (let index = 0; index < debugListeners.length; index++) {
            const listener = debugListeners[index];
            sendDebugData(listener, false);
        }
    }, 5000); //Every 5s
}

function addDebugMessage(message, incoming) {
    if (debugListeners.length == 0) return;

    for (let index = 0; index < debugListeners.length; index++) {
        const listener = debugListeners[index];
        message = message.replace(':', '=');
        if (incoming) {
            listener.send(`${outgoing.add_debugmessage}:IN:${message}`);
        } else {
            listener.send(`${outgoing.add_debugmessage}:OUT:${message}`);
        }
    }
}

function sendDebugData(client, force) {
    sendMemoryUsage(client, force);
    sendCpuUsage(client, force);
    sendSystemLoad(client, force);
}

function sendMemoryUsage(client, force) {
    const percentage = Math.round(os.freemem / os.totalmem * 100);
    if (percentage == memoryUsage && !force) return;
    memoryUsage = percentage;
    send(client, `${outgoing.set_memoryusage}:${percentage}`, `Änderung des "Arbeitsspeichers" auf den Wert "${percentage}".`, importance.LOW);
}

function sendCpuUsage(client, force) {
    const cpus = os.cpus();
    let percentage = 0.0;

    for (let index = 0; index < cpus.length; index++) {
        const core = cpus[index];
        let work = core.times.irq + core.times.nice + core.times.sys + core.times.user;
        let total = work + core.times.idle;
        percentage += work / total;
    }

    percentage = Math.round(percentage / cpus.length * 100);
    if (percentage == cpuusage && !force) return;
    cpuusage = percentage;
    send(client, `${outgoing.set_cpuusage}:${percentage}`, `Änderung der "CPU-Auslastung" auf den Wert "${percentage}".`, importance.LOW);
}

function sendSystemLoad(client, force) {
    const load = Math.round(os.loadavg()[2] / os.cpus().length * 100);
    if (load == systemload && !force) return;
    systemload = load;
    send(client, `${outgoing.set_systemload}:${load}`, `Änderung der "Prozess-Auslastung" auf den Wert "${load}".`, importance.LOW);
}

//Remote Controll Section
var connectionCheck = null;
var checkreceived = false;
const controllqueue = new ArrayQueue();

function manageControllRequest(client) {
    if (global.data.settings[2] != '1') {
        send(client, `${outgoing.controll_request}:Fernsteuerung wurde deaktiviert.`, 'Anfrage auf "Fernsteuerungs-Kontrolle" abgelehnt: Fernsteuerung wurde deaktiviert.', importance.HIGH);
    } else if (controllClient != null) {
        send(client, `${outgoing.controll_request}:Bereits mit anderem Gerät verbunden.`, 'Anfrage auf "Fernsteuerungs-Kontrolle" abgelehnt: Bereits mit anderem Gerät verbunden.', importance.HIGH);
    } else {
        controllClient = client;
        checkRemoteConnection();
        acceptControllRequest(client);
        return;
    }

    controllqueue.addElement(client);
}

function remoteControllUpdate() {
    if (global.data.settings[2] == '1' && controllClient == null && !controllqueue.isEmpty()) {
        //Enable remote connection
        manageControllRequest(controllqueue.getElement());
    } else if (global.data.settings[2] == '0' && controllClient != null) {
        //Disable remote connection
        controllqueue.addElement(controllClient);
        send(controllClient, `${outgoing.controll_request}:Fernsteuerung wurde deaktiviert.`, '"Fernsteuerungs-Kontrolle" wurde widerrufen: Fernsteuerung wurde deaktiviert.', importance.HIGH);
        controllClient = null;
    }
}

function acceptControllRequest(client) {
    send(client, `${outgoing.controll_request}:accepted`, 'Anfrage auf "Fernsteuerungs-Kontrolle" akzeptiert.', importance.HIGH);
    sendAllClients(`${outgoing.remote_controll}:on`, `Fernsteuerung wird aktiviert.`, client, importance.MEDIUM);
}

function remoteDeviceLogout(client) {
    if (client == controllClient) {
        controllClient = null;
        if (connectionCheck != null) { clearInterval(connectionCheck); connectionCheck = null; }

        if (global.data.settings[2] == '1' && !controllqueue.isEmpty()) {
            controllClient = controllqueue.getElement();
            checkRemoteConnection();
            acceptControllRequest(controllClient);
        } else sendAllClients(`${outgoing.remote_controll}:off`, 'Fernsteuerung wird deaktiviert.', client, importance.HIGH);
    } else if (!controllqueue.isEmpty()) controllqueue.removeElement(client);
}

function checkRemoteConnection() {
    checkReceived();
    connectionCheck = setInterval(() => {
        if (controllClient == null) {
            clearInterval(connectionCheck);
            return;
        }
        if (checkreceived) {
            send(controllClient, `${outgoing.controll_check}`, 'Kontroll-Check wird gesendet.', importance.LOW);
            checkreceived = false;
        } else {
            send(controllClient, `${outgoing.controll_request}:Reaktionszeit ist zu groß. Webseite muss neu geladen werden.`, 'Kontroll-Check Reaktionszeit zu groß. Fernsteuerung wird deaktiviert.', importance.HIGH);
            remoteDeviceLogout(controllClient);
        }
    }, 2000); //Send Check Request every 2s
}

function hasRemoteConnection(client) {
    const hasConnection = controllClient != null ? 'on' : 'off';
    send(client, `${outgoing.remote_controll}:${hasConnection}`, `Fernsteuerungsstatus "${hasConnection}" an Klient gesendet.`, importance.LOW);
}

function checkReceived() {
    checkreceived = true;
}
