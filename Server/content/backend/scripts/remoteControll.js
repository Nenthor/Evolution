const ArrayQueue = require('./arrayqueue');

const controllqueue = new ArrayQueue();

var send, sendAllClients, hardware;
var controllClient = null;
var connectionCheck = null;
var checkreceived = false;

const importance = { HIGH: 0, MEDIUM: 1, LOW: 2 }; //For debugging
const outgoing = {  //Outgoing messages to web-clients
    controll_request: 'controll_request', remote_controll: 'remote_controll', controll_check: 'controll_check', 
};

module.exports = {
    setSendFunctions,
    manageControllRequest,
    remoteControllUpdate,
    remoteDeviceLogout,
    hasRemoteConnection,
    isController,
    checkReceived
}

function setSendFunctions(singel, all, toHardware) {
    send = singel;
    sendAllClients = all;
    hardware = toHardware;
}

function manageControllRequest(client) {
    if (global.settings[2] != '1') {
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
    if (global.settings[2] == '1' && controllClient == null && !controllqueue.isEmpty()) {
        //Enable remote connection
        manageControllRequest(controllqueue.getElement());
    } else if (global.settings[2] == '0' && controllClient != null) {
        //Disable remote connection
        controllqueue.addElement(controllClient);
        send(controllClient, `${outgoing.controll_request}:Fernsteuerung wurde deaktiviert.`, '"Fernsteuerungs-Kontrolle" wurde widerrufen: Fernsteuerung wurde deaktiviert.', importance.HIGH);
        controllClient = null;
    }
}

function acceptControllRequest(client) {
    send(client, `${outgoing.controll_request}:accepted`, 'Anfrage auf "Fernsteuerungs-Kontrolle" akzeptiert.', importance.HIGH);
    sendAllClients(`${outgoing.remote_controll}:on`, `Fernsteuerung wird aktiviert.`, client, importance.MEDIUM);
    hardware(null, `${outgoing.remote_controll}:on`);
}

function remoteDeviceLogout(client) {
    if (client == controllClient) {
        controllClient = null;
        hardware(null, `${outgoing.remote_controll}:off`);
        if (connectionCheck != null) { clearInterval(connectionCheck); connectionCheck = null; }

        if (global.settings[2] == '1' && !controllqueue.isEmpty()) {
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

function isController(client) {
    return controllClient == client;
}

function checkReceived() {
    checkreceived = true;
}