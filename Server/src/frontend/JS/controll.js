//Server data
var socket = new WebSocket(`ws://${location.host}`);
var sendStop = false;

addSocketEvents();
function addSocketEvents() {
    socket.addEventListener('open', () => {
        send('get_speed');
        send('get_battery');
        if (document.hasFocus()) requestControll();
    }, { passive: true });

    socket.addEventListener('close', () => {
        console.warn('Server has closed. Retrying...');
        controllRequest(false, 'Warte auf Serverantwort...');
        reconnect();
    });

    socket.addEventListener('message', event => {
        const data = String(event.data).split(':');
        switch (data[0]) {
            case 'speed':
                updateSpeedtext(data[1]);
                break;
            case 'battery':
                updateBatterytext(data[1]);
                break;
            case 'controll_request':
                controllRequest(data[1] == 'accepted', data[1]);
                break;
            case 'controll_check':
                send('controll_check');
                checkReceived();
                break;
            case 'controll_redirect':
                redirect(data[1]);
            default:
                break;
        }
    }, { passive: true });
}

function reconnect() {
    fetch(`${location.protocol}//${location.host}`, { method: 'GET' })
        .then(() => {
            socket = new WebSocket(`ws://${location.host}`);
            addSocketEvents();
            console.log('Reconnected to Server.');
        }).catch(() => {
            setTimeout(() => {
                reconnect();
            }, 1000); // 1s
        });
}

function send(message) {
    if (socket.readyState == WebSocket.OPEN && !sendStop) {
        socket.send(message);
    }
}

//Controll authentication
var key = new URLSearchParams(location.search).get('key');
history.replaceState({}, null, location.pathname);

function requestControll() {
    if (key) {
        send(`controll_request:${key}`);
        key = null;
        return;
    } else
        send('controll_request');
}

//Onclose event
window.addEventListener('beforeunload', () => {
    send('remote_devicelogout');
}, { passive: true });

//Redirect to map page
const mapButton = document.getElementById('mapButton');
mapButton.addEventListener('click', () => {
    send('remote_redirect');
});

function redirect(key) {
    if (key != '-1') {
        sendStop = true;
        setTimeout(() => { sendStop = false; }, 5000);
    }

    open(key == '-1' ? '/map' : `map?key=${key}`, '_self');
}

//Waiting-Animation
const waitingtitle = document.getElementById('waitingtitle');
const waitingdefaulttext = waitingtitle.textContent;
var currentdotanimation = 0;
setInterval(() => {
    switch (currentdotanimation) {
        case 0:
            waitingtitle.textContent = `${waitingdefaulttext}`
            break;
        case 1:
            waitingtitle.textContent = `${waitingdefaulttext}.`
            break;
        case 2:
            waitingtitle.textContent = `${waitingdefaulttext}..`
            break;
        case 3:
            waitingtitle.textContent = `${waitingdefaulttext}...`
            break;
        case 4:
            waitingtitle.textContent = `${waitingdefaulttext}..`
            break;
        case 5:
            waitingtitle.textContent = `${waitingdefaulttext}.`
            currentdotanimation = -1;
            break;
    }
    currentdotanimation++;
}, 500);

//Get waiting-cause
const waitingdiv = document.getElementById('waitingdiv');
const waitingcause = document.getElementById('waitingcause');
var connectionCheck = null;
waitingdiv.style.display = 'flex';

function controllRequest(accepted, cause) {
    if (accepted) {
        waitingdiv.style.display = 'none';
        waitingcause.textContent = 'Warte auf Serverantwort...';

        checkRemoteConnection();
    } else {
        waitingdiv.style.display = 'flex';
        waitingcause.textContent = cause;

        if (connectionCheck != null) {
            clearInterval(connectionCheck);
            connectionCheck = null;
        }
    }
}

//Check remote Connection
var checkreceived = false;

function checkRemoteConnection() {
    checkReceived();
    connectionCheck = setInterval(() => {
        if (checkreceived) {
            checkreceived = false;
        } else {
            send('remote_devicelogout');
            controllRequest(false, 'Reaktionszeit ist zu groß. Webseite muss neu geladen werden.');
        }
    }, 4000); //Ask if check was received every 2s
}

function checkReceived() {
    checkreceived = true;
}

window.addEventListener('focus', onTurnOnScreen, { passive: true });
window.addEventListener('blur', onTurnOffScreen, { passive: true });

function onTurnOnScreen() {
    requestControll();
}

function onTurnOffScreen() {
    send('remote_devicelogout');
    controllRequest(false, 'Webseite ist nicht im Vordergrund.');
}

//Update speedtext + batterytext
const speedtext = document.getElementById('speedtext');
const batterytext = document.getElementById('batterytext');

function updateSpeedtext(speed) {
    speedtext.textContent = `Geschwindigkeit: ${speed} km/h`;
}

function updateBatterytext(battery) {
    batterytext.textContent = `Akku: ${battery}%`;
}

//Controller methods
const controller = document.getElementsByClassName('controll_controllerbutton');
var directionReady = true

for (let index = 0; index < controller.length; index++) {
    const element = controller[index];
    ["mousedown", "touchstart"].forEach(event => {
        element.addEventListener(event, () => {
            onControllerStart(index);
        }, { passive: true })
    });
    ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach(event => {
        element.addEventListener(event, () => {
            onControllerEnd(index);
        }, { passive: true })
    });
}

var currentdirection = 'STANDBY';
function onControllerStart(index) {
    // 0: FORWARD ; 1: LEFT ; 2: RIGHT ; 3: BACKWARD
    if (currentdirection != 'STANDBY' || !directionReady) return;
    // Can only send direction every 0.5s

    switch (index) {
        case 0:
            currentdirection = 'FORWARD';
            break;
        case 1:
            currentdirection = 'LEFT';
            break;
        case 2:
            currentdirection = 'RIGHT';
            break;
        case 3:
            currentdirection = 'BACKWARD';
            break;
    }

    directionReady = false;
    controller[index].style.backgroundColor = '#3268cd';
    sendCurrentdirection();
    setTimeout(() => { directionReady = true; }, 500);
}

function onControllerEnd(index) {
    if (currentdirection == 'STANDBY') return;

    switch (index) {
        case 0:
            if (currentdirection != 'FORWARD') return;
            break;
        case 1:
            if (currentdirection != 'LEFT') return;
            break;
        case 2:
            if (currentdirection != 'RIGHT') return;
            break;
        case 3:
            if (currentdirection != 'BACKWARD') return;
            break;
    }
    currentdirection = 'STANDBY';
    controller[index].style.backgroundColor = '#ddd';
    sendCurrentdirection();

    directionReady = false;
    setTimeout(() => { directionReady = true; }, 500);
}

function sendCurrentdirection() {
    send(`set_remotedirection:${currentdirection}`);
}
