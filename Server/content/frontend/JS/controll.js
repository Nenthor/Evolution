//Server data
const socket = new WebSocket(`ws://${location.host}`);

socket.addEventListener('open', () => {
    send('get_speed');
    send('get_battery');
    send('controll_request');
}, { passive: true });

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
            if (data[1] == 'accepted') {
                controllRequest(true, null);
            } else {
                controllRequest(false, data[1]);
            }
            break;
        case 'controll_check':
            send('controll_check');
            checkReceived();
            break;
        default:
            break;
    }
}, { passive: true });

function send(message) {
    if (socket.readyState == WebSocket.OPEN) {
        socket.send(message);
    }
}

//BackButton
const backbutton = document.getElementById('back_button');
const mobilbackbutton = document.getElementById('mobil_back_button');
backbutton.addEventListener('click', logout, { passive: true });
mobilbackbutton.addEventListener('click', logout, { passive: true });

function logout() {
    open('/index_remote', '_self');
}

window.addEventListener('beforeunload', event => {
    send('remote_devicelogout');
}, { passive: true });

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
        waitingcause.textContent = 'Warte auf Serverantwort';

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
    send('controll_request');
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
    if (currentdirection != 'STANDBY') return;

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

    controller[index].style.backgroundColor = '#3268cd';
    sendCurrentdirection();
}

function onControllerEnd(index) {
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
}

function sendCurrentdirection() {
    send(`set_remotedirection:${currentdirection}`);
}

//Speed methods
var slider = document.getElementById('slider');
slider.addEventListener('change', event => {
    send(`set_remotespeed:${slider.value}`);
}, { passive: true });