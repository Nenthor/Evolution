const client = require('./client');

var send, sendAllClients;
var speed = '0', battery = '0', camera = '000', coords = 'Lokalisieren...';

const importance = { HIGH: 0, MEDIUM: 1, LOW: 2 }; //For debugging
const incoming = { //Incoming messages from web-clients
    battery: 'battery', speed: 'speed', coords: 'coords', camera: 'camera', shutdown: 'shutdown',
    set_remotedirection: 'set_remotedirection', set_remotespeed: 'set_remotespeed'
};
const fromHardware = { //Incoming hardware messages
    battery: 'battery', speed: 'speed', coords: 'coords', camera: 'camera'
};
const toHardware = { //Outgoing hardware messages
    get_camera: 'get_camera', shutdown: 'shutdown', remotedirection: 'remotedirection', remotespeed: 'remotespeed'
};

module.exports = {
    sendData: onWebsocketData,
    setSendFunctions
}

//Setup client script
client.setOnMessageFunction(onMessage);

function setSendFunctions(singel, all) {
    send = singel;
    sendAllClients = all
}

//Possible types: speed, battery, camera, coords
function onWebsocketData(ws, msg) {
    var data = null;
    const message = String(msg).split(':');

    switch (message[0]) {
        case incoming.speed:
            data = speed;
            break;
        case incoming.battery:
            data = battery;
            break;
        case incoming.camera:
            data = camera;
            break;
        case incoming.coords:
            data = coords;
            break;
        case incoming.set_remotedirection:
            client.send(`${toHardware.remotedirection}:${message[1]}`);
            break;
        case incoming.set_remotespeed:
            client.send(`${toHardware.remotespeed}:${message[1]}`);
            break;
        case incoming.shutdown:
            client.send(`${toHardware.shutdown}`);
            break;
        default:
            console.warn(`${type} is not a defined type.`);
            break;
    }

    if (data == null) return;
    if (ws == null) return data;
    send(ws, `${message[0]}:${data}`, `"${message[0]}" mit dem Wert "${data}" wird zum Klienten gesendet.`, importance.LOW);
}

//Receive messages from hardware server
function onMessage(msg) {
    const message = msg.split(':');
    switch (message[0]) {
        case fromHardware.speed:
            if (speed == message[1]) break;
            speed = message[1];
            sendAllClients(`${incoming.speed}:${speed}`, `Änderung der Geschwindigkeit zu "${speed}" wird an alle Klienten gesendet.`, null, importance.LOW);
            break;
        case fromHardware.battery:
            if (battery == message[1]) break;
            battery = message[1];
            sendAllClients(`${incoming.battery}:${battery}`, `Änderung des Akkustandes zu "${battery}" wird an alle Klienten gesendet.`, null, importance.LOW);
            break;
        case fromHardware.camera:
            if (camera == message[1]) break;
            camera = message[1];
            sendAllClients(`${incoming.camera}:${camera}`, `Änderung der Kamera zu "${camera}" wird an alle Klienten gesendet.`, null, importance.LOW);
            break;
        case fromHardware.coords:
            if (coords == message[1]) break;
            coords = message[1];
            sendAllClients(`${incoming.coords}:${coords}`, `Änderung der Koordinaten zu "${coords}" wird an alle Klienten gesendet.`, null, importance.LOW);
            break;
        default:
            console.warn(`${message[0]} is not an available hardware message.`);
            break;
    }
}

function onConnect() {
    client.send(`${toHardware.get_camera}`);
}

client.onMessage = onMessage;
client.setOnConnectFunction = onConnect;
client.connect();
