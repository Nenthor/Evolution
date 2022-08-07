const ipc = require('node-ipc').default;
ipc.config.id = 'pi';
ipc.config.retry = 1000;
ipc.config.silent = true;

const path = ipc.config.socketRoot + ipc.config.appspace + 'engine';
var isConnected = false;

ipc.connectTo('engine', path , () => {
    ipc.of.engine.on('connect', () => {
        console.log('Connected to engine.');
        isConnected = true;
    });
    ipc.of.engine.on('disconnect', () => {
        if(isConnected) console.log('Disconnected with engine.');
        isConnected = false;
    });
    ipc.of.engine.on('message', data => {
        console.log(`PI has recevied a message: ${data}.`);
    });
});

function send(data){
    ipc.of.engine.emit('message', data);
}

module.exports = {
    sendToEngine: send,    //Send messages to Engine
}
