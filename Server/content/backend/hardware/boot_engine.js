const ipc = require('node-ipc').default;
ipc.config.id = 'engine';
ipc.config.retry = 1000;
ipc.config.silent = true;

const path = ipc.config.socketRoot + ipc.config.appspace + ipc.config.id;

ipc.serve(path, () => {
    ipc.server.on('start', () => {
        console.log('Engine-Server is running.');
    });
    ipc.server.on('connect', (client, destroyedSocketID) => {
        console.log('PI has connected.');
        enableConnection();
    });
    ipc.server.on('message', (data, client) => {
        message(data);
    });
    ipc.server.on('socket.disconnected', (client, destroyedSocketID) => {
        console.log('PI has disconnected.');
        autoStop();
    });
});

ipc.server.start();

function enableConnection(){

}

function autoStop(){

}

function message(data){
    console.log(data);
}