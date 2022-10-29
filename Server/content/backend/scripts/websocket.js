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
    get_coords: 'get_coords', get_compass: 'get_compass', get_settings: 'get_settings', get_camera: 'get_camera', get_music: 'get_music', get_speed: 'get_speed', get_battery: 'get_battery', set_navigation: 'set_navigation', get_navigation: 'get_navigation', set_target: 'set_target', get_target: 'get_target', get_debugdata: 'get_debugdata', get_remotecontrollstate: 'get_remotecontrollstate', set_music: 'set_music', set_remotedirection: 'set_remotedirection', set_settings: 'set_settings', shutdown: 'shutdown', add_debuglistener: 'add_debuglistener', remove_debuglistener: 'remove_debuglistener', controll_request: 'controll_request', controll_check: 'controll_check', remote_devicelogout: 'remote_devicelogout', remote_redirect: 'remote_redirect', set_importance: 'set_importance'
};

const outgoing = {  //Outgoing messages to web-clients
    music: 'music', settings: 'settings', battery: 'battery', speed: 'speed', coords: 'coords', compass: 'compass', camera: 'camera', set_navigation: 'set_navigation',
};

//Setup debug & remoteControll & navigation & hardware script
debug.setSendFunction(send);
navigation.setSendFunctions(send, sendAllClients);
hardware.setSendFunctions(send, sendAllClients);
hardware.setOnCoords(navigation.setNavigation)
remoteControll.setSendFunctions(send, sendAllClients, hardware.sendData);

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
    [wss, wssSecure].forEach(element => {
        element.clients.forEach(client => {
            if (client != exeption) {
                if (client.readyState == WebSocket.OPEN) client.send(message);
            }
        });
    })
    if (importance <= currentImportance && debugMessage != null) debug.addDebugMessage(debugMessage, false);
}

//Websocket ServerListener
const wss = new WebSocket.Server({ server: global.server });
const wssSecure = new WebSocket.Server({ server: global.serverSecure });
[wss, wssSecure].forEach(element => {
    element.on('connection', (ws, req) => {
        ws.on('message', data => {
            const message = String(data).split(':');
            switch (message[0]) {
                case incoming.get_coords:
                    receiveMessages('Anfrage für "Koordinaten"-Wert erhalten.', importance.LOW);
                    navigation.getNavigation(ws);
                    break;
                case incoming.get_compass:
                    receiveMessages('Anfrage für "Kompass"-Wert erhalten.', importance.LOW);
                    hardware.sendData(ws, outgoing.compass);
                    break;
                case incoming.get_settings:
                    receiveMessages('Anfrage für "Einstellungs"-Wert erhalten.', importance.LOW);
                    send(ws, `${outgoing.settings}:${global.settings}`, `"settings" mit dem Wert "${global.settings}" wird zum Klienten gesendet.`, importance.LOW);
                    break;
                case incoming.get_camera:
                    receiveMessages('Anfrage für "Kamera"-Wert erhalten.', importance.LOW);
                    hardware.sendData(ws, outgoing.camera);
                    break;
                case incoming.get_music:
                    receiveMessages('Anfrage für "Musik"-Wert erhalten.', importance.LOW);
                    send(ws, `${outgoing.music}:${global.music}`, `"music" mit dem Wert "${global.music}" wird zum Klienten gesendet.`, importance.LOW);
                    break;
                case incoming.get_speed:
                    receiveMessages('Anfrage für "Geschwindigkeits"-Wert erhalten.', importance.LOW);
                    hardware.sendData(ws, outgoing.speed);
                    break;
                case incoming.get_battery:
                    receiveMessages('Anfrage für "Batterie"-Wert erhalten.', importance.LOW);
                    hardware.sendData(ws, outgoing.battery);
                    break;
                case incoming.get_navigation:
                    receiveMessages('Anfrage für "Navigations"-Wert erhalten.', importance.LOW);
                    navigation.getNavigation(ws);
                    break;
                case incoming.set_navigation:
                    if (!remoteControll.isController(ws) || !global.debug) break;
                    receiveMessages('Änderung des "Navigations"-Werts erhalten.', importance.MEDIUM);
                    navigation.setNavigation(message[1]);
                    break;
                case incoming.set_target:
                    if (!remoteControll.isController(ws) && !(req.socket.localAddress == req.socket.remoteAddress && message[1] == '-1')) break;
                    receiveMessages('Ziel Koordinaten erhalten.', importance.HIGH);
                    navigation.setTarget(message[1]);
                    break;
                case incoming.get_target:
                    receiveMessages('Ziel Koordinaten erhalten.', importance.HIGH);
                    navigation.getTarget(ws);
                    break;
                case incoming.get_remotecontrollstate:
                    receiveMessages('Anfrage für "Fernsteuerungs-Zustand" erhalten.', importance.LOW);
                    remoteControll.hasRemoteConnection(ws);
                    break;
                case incoming.set_music:
                    if (req.socket.localAddress != req.socket.remoteAddress && !global.debug) break;
                    receiveMessages(`Änderung des "Musik"-Werts zu "${message[1]}" erhalten.`, importance.MEDIUM);
                    writeFile(message[1], 'music');
                    global.music = String(message[1]);
                    music.playMusic();
                    sendAllClients(`${outgoing.music}:${global.music}`, `Änderung des "Musik"-Werts zu "${message[1]}" wird an alle Klienten gesendet.`, ws, importance.LOW);
                    break;
                case incoming.set_remotedirection:
                    if (!remoteControll.isController(ws)) break;
                    receiveMessages(`Fernsteuerung wird auf "${message[1]}" gesetzt.`, importance.MEDIUM);
                    hardware.sendData(null, `${incoming.set_remotedirection}:${message[1]}`);
                    break;
                case incoming.set_settings:
                    if (req.socket.localAddress != req.socket.remoteAddress && !global.debug) break;
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
                    if (req.socket.localAddress != req.socket.remoteAddress && !global.debug) break;
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
                    remoteControll.manageControllRequest(ws, message[1]);
                    break;
                case incoming.controll_check:
                    if (!remoteControll.isController(ws)) break;
                    receiveMessages(`Kontroll-Check erhalten.`, importance.LOW);
                    remoteControll.checkReceived();
                    break;
                case incoming.remote_devicelogout:
                    receiveMessages(`"Fernsteuerungs-Klient" wurde ausgeloggt.`, importance.HIGH);
                    remoteControll.remoteDeviceLogout(ws);
                    break;
                case incoming.remote_redirect:
                    receiveMessages(`Anfrage für Fernsteuerungs-Weiterleitung erhalten.`, importance.LOW);
                    remoteControll.remoteRedirect(ws);
                    break;
                default:
                    console.warn(`${message[0]} is not available.`);
                    break;
            }
        });
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
