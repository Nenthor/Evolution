const WebSocket = require('ws');
const fs = require('fs');
const navigation = require('./navigation');
const music = require('./music');
const debug = require('./debug');
const remoteControll = require('./remoteControll');
const hardware = require('./hardware');

//Enum
const importance = { HIGH: 0, MEDIUM: 1, LOW: 2 }; //For debugging
var currentImportance = importance.MEDIUM;

const incoming = {  //Incoming websocket messages
    get_coords: 'get_coords', get_settings: 'get_settings', get_camera: 'get_camera', get_music: 'get_music', get_speed: 'get_speed', get_battery: 'get_battery',
    get_navigation: 'get_navigation', get_debugdata: 'get_debugdata', get_remotecontrollstate: 'get_remotecontrollstate', set_music: 'set_music',
    set_remotedirection: 'set_remotedirection', set_remotespeed: 'set_remotespeed', set_settings: 'set_settings', shutdown: 'shutdown', add_debuglistener: 'add_debuglistener',
    remove_debuglistener: 'remove_debuglistener', controll_request: 'controll_request', controll_check: 'controll_check', remote_devicelogout: 'remote_devicelogout',
    set_importance: 'set_importance'
};

const outgoing = {  //Outgoing messages to web-clients
    music: 'music', settings: 'settings', battery: 'battery', speed: 'speed', coords: 'coords', camera: 'camera', set_navigation: 'set_navigation',
};

//Setup debug & remoteControll & navigation & hardware script
debug.setSendFunction(send);
remoteControll.setSendFunctions(send, sendAllClients);
navigation.setSendFunctions(send, sendAllClients);
hardware.setSendFunctions(send, sendAllClients);
hardware.setOnCoords(navigation.setNavigation)

//Send Messages to clients (and logging them)
function send(client, message, debugMessage, important) {
    client.send(message);
    if (important <= currentImportance && debugMessage != null) debug.addDebugMessage(debugMessage, false);
}

//Logging of received messages
function receiveMessages(message, important) {
    if (important <= currentImportance) debug.addDebugMessage(message, true);
}

function sendAllClients(message, debugMessage, exeption, importance) {
    wss.clients.forEach(client => {
        if (client != exeption) {
            if (client.readyState == WebSocket.OPEN) client.send(message);
        }
    });
    if (importance <= currentImportance && debugMessage != null) debug.addDebugMessage(debugMessage, false);
}

//Websocket ServerListener
const wss = new WebSocket.Server({ server: global.server });
wss.on('connection', ws => {
    ws.on('message', data => {
        const message = String(data).split(':');
        switch (message[0]) {
            case incoming.get_coords:
                receiveMessages('Anfrage für "Koordinaten"-Datei erhalten.', importance.LOW);
                navigation.getNavigation(ws);
                break;
            case incoming.get_settings:
                receiveMessages('Anfrage für "Einstellungs"-Datei erhalten.', importance.LOW);
                send(ws, `${outgoing.settings}:${global.settings}`, `"settings" mit dem Wert "${global.settings}" wird zum Klienten gesendet.`, importance.LOW);
                break;
            case incoming.get_camera:
                receiveMessages('Anfrage für "Kamera"-Datei erhalten.', importance.LOW);
                hardware.sendData(ws, outgoing.camera);
                break;
            case incoming.get_music:
                receiveMessages('Anfrage für "Musik"-Datei erhalten.', importance.LOW);
                send(ws, `${outgoing.music}:${global.music}`, `"music" mit dem Wert "${global.music}" wird zum Klienten gesendet.`, importance.LOW);
                break;
            case incoming.get_speed:
                receiveMessages('Anfrage für "Geschwindigkeits"-Datei erhalten.', importance.LOW);
                hardware.sendData(ws, outgoing.speed);
                break;
            case incoming.get_battery:
                receiveMessages('Anfrage für "Batterie"-Datei erhalten.', importance.LOW);
                hardware.sendData(ws, outgoing.battery);
                break;
            case incoming.get_navigation:
                receiveMessages('Anfrage für "Navigations"-Datei erhalten.', importance.LOW);
                navigation.getNavigation(ws);
                break;
            case incoming.get_remotecontrollstate:
                receiveMessages('Anfrage für "Fernsteuerungs-Zustand" erhalten.', importance.LOW);
                remoteControll.hasRemoteConnection(ws);
                break;
            case incoming.set_music:
                receiveMessages(`Änderung der "Musik"-Datei zu "${message[1]}" erhalten.`, importance.MEDIUM);
                writeFile(message[1], 'music');
                global.music = String(message[1]);
                music.playMusic();
                sendAllClients(`${outgoing.music}:${global.music}`, `Änderung der "Musik"-Datei zu "${message[1]}" wird an alle Klienten gesendet.`, ws, importance.LOW);
                break;
            case incoming.set_remotedirection:
                receiveMessages(`Fernsteuerung wird auf "${message[1]}" gesetzt.`, importance.MEDIUM);
                hardware.sendData(null, `${incoming.set_remotedirection}:${message[1]}`);
                break;
            case incoming.set_remotespeed:
                receiveMessages(`Geschwindigkeit der Fernsteuerung wird auf "${message[1]}" gesetzt.`, importance.MEDIUM);
                hardware.sendData(null, `${incoming.set_remotespeed}:${message[1]}`);
                break;
            case incoming.set_settings:
                receiveMessages(`Änderung der "Einstellungs"-Datei zu "${message[1]}" erhalten.`, importance.MEDIUM);
                writeFile(message[1], 'settings');
                global.settings = String(message[1]);
                music.checkForMute();
                remoteControll.remoteControllUpdate();
                sendAllClients(`${outgoing.settings}:${global.settings}`, `Änderung der "Einstellungs"-Datei zu "${message[1]}" wird an alle Klienten gesendet.`, ws, importance.LOW);
                break;
            case incoming.set_importance:
                receiveMessages(`Änderung der "Debug-Nachrichtenstufe" auf "${message[1]}" erhalten.`, importance.LOW);
                currentImportance = parseInt(message[1]);
                break;
            case incoming.shutdown:
                receiveMessages(`Anfrage auf "System-Shutdown" erhalten.`, importance.HIGH);
                hardware.sendData(null, incoming.shutdown);
                break;
            case incoming.add_debuglistener:
                receiveMessages(`Debug-Klient wird hinzugefügt.`, importance.LOW);
                debug.addDebugListener(ws);
                debug.sendDebugData(ws, true);
                break;
            case incoming.remove_debuglistener:
                receiveMessages(`Debug-Klient wird entfernt.`, importance.LOW);
                debug.removeDebugListener(ws);
                break;
            case incoming.controll_request:
                receiveMessages(`Anfrage auf "Fernsteuerungs-Kontrolle" erhalten.`, importance.MEDIUM);
                remoteControll.manageControllRequest(ws);
                break;
            case incoming.controll_check:
                receiveMessages(`Kontroll-Check erhalten.`, importance.LOW);
                if (remoteControll.isController(ws)) remoteControll.checkReceived();
                break;
            case incoming.remote_devicelogout:
                receiveMessages(`"Fernsteuerungs-Klient" wurde ausgeloggt.`, importance.HIGH);
                remoteControll.remoteDeviceLogout(ws);
                break;
            default:
                console.warn(`${message[0]} is not available.`);
                break;
        }
    });
});

//GetData on boot
global.music = readFile('music', '0');
global.settings = readFile('settings', '000');

navigation.setNavigation(hardware.sendData(null, outgoing.coords)); //Send data to navigation script

function readFile(file, fallback) {
    const data = fs.readFileSync(`${global.path}/content/backend/data/${file}.txt`, 'utf8');
    if (data == null) return fallback
    return data;
}

function writeFile(data, file) {
    fs.writeFile(`${global.path}/content/backend/data/${file}.txt`, String(data), error => {
        if (error) {
            console.warn(`${file}.txt konnte nicht geändert werden: ${error}`);
        }
    });
}
