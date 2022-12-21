const net = require('net');
const ArrayQueue = require('./arrayqueue');
const client = new net.Socket();

const HOST = '127.0.0.1';
const PORT = 5050;
const HEADER = 2;
const FORMAT = 'utf-8';
const DISCONNECT_MESSAGE = '!DISCONNECT';
const MAX_RETRYCOUNT = 300; //5min

var onMessage;
var isConnected = false;
var retryCount = 0;
var onConnectMessages = [];
var retryTimeout = null;
var messageQueue = new ArrayQueue();

/**
 * Connect to server.
 */
function connect() {
    client.connect(PORT, HOST);
}

client.on('connect', () => {
    console.log('Connected to Hardware.');
    if (retryTimeout != null) clearTimeout(retryTimeout);
    isConnected = true;
    retryCount = 0;

    onConnectMessages.forEach(msg => {
        if (msg == 'set_music') msg += `:${global.music}`;
        else if (msg == 'set_lights') msg += `:${global.settings[1]}`
        messageQueue.addElement(msg);
    });
    if (!messageQueue.isEmpty()) {
        const messageQueueInterval = setInterval(() => {
            if (messageQueue.isEmpty()) {
                messageQueue.clear();
                clearInterval(messageQueueInterval);
                return;
            }
            send(messageQueue.getElement())
        }, 50);
    }
});

client.on('data', data => {
    if (onMessage != null) onMessage(String(data).trim());
});

client.on('error', retryConnecting);
client.on('close', () => {
    if (!isConnected && retryCount != 0) return;

    console.log('Hardware connection is closed. Retrying...');
    isConnected = false;

    retryConnecting();
});

function retryConnecting() {
    if (retryTimeout != null) clearTimeout(retryTimeout);
    retryTimeout = setTimeout(() => {
        if (retryCount >= MAX_RETRYCOUNT && !global.debug) {
            console.log('Could not establish connection to Hardware.');
            return;
        }

        connect();
        retryCount++;
    }, 1000);
}

/**
 * Send messages to the server.
 */
function send(message) {
    if (!isConnected)
        return;

    messageLength = Buffer.from(String(message.length));
    data = Buffer.allocUnsafe(HEADER);
    data.fill(messageLength, 0, messageLength.length);
    data.fill(Buffer.from(' '), messageLength.length, HEADER)

    client.write(data);
    client.write(Buffer.from(message));
}

/**
 * Call this function to receive messages from the server.
 */
function setOnMessageFunction(func) {
    onMessage = func;
}

function getDataOnConnect(messages) {
    onConnectMessages = messages;
}

exitEvents = ['SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'];

for (let event in exitEvents) {
    process.on(exitEvents[event], () => {
        send(DISCONNECT_MESSAGE);
        process.exit();
    });
}

module.exports = {
    connect,
    send,
    setOnMessageFunction,
    getDataOnConnect
}
