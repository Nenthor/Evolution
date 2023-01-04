var cameraListeners = [];
var send;

const outgoing = {  //Outgoing messages to hardware-server
    set_camera: 'set_camera'
};

module.exports = {
    setSendFunction,
    addCameraListener,
    removeCameraListener,
}

function setSendFunction(func) {
    send = func;
}

function addCameraListener(client) {
    if (cameraListeners.length == 0) changeState('on');
    cameraListeners.push(client);
}

function removeCameraListener(client) {
    for (let index = 0; index < cameraListeners.length; index++) {
        const listener = cameraListeners[index];
        if (listener != client) continue;

        cameraListeners.splice(index);
        if (cameraListeners.length == 0) changeState('off');
    }
}

function changeState(state) {
    global.camera = state;
    send(null, `${outgoing.set_camera}:${state}`);
}
