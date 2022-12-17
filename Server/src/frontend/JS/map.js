//Server data
var socket = getWebsocket();
const imageWidth = 2816;
const images = [];
var isLocal = location.protocol == 'http:';
var sendStop = false;
var currentX = 0, currentY = 0;
var pixelX = 0, pixelY = 0;
var targetX = 0, targetY = 0;
var hasData = false, hasTarget = false, hasLoaded = 0, hasControll = false;
var onSetWaiting = false;
var gpsWatch = null, gpsWatchTimeout = null;

addSocketEvents();
function addSocketEvents() {
    socket.addEventListener('open', () => {
        send('get_navigation');
        send('get_target');
        if (!isLocal && document.hasFocus()) requestControll();
    }, { passive: true });

    socket.addEventListener('close', () => {
        console.warn('Server has closed. Retrying...');
        reconnect();
    });

    socket.addEventListener('message', event => {
        const data = String(event.data).split(':');
        switch (data[0]) {
            case 'set_navigation':
                extractNavigationMessage(data[1]);
                if (hasData) displayMap();
                checkButtonStatus();
                checkMapImages();
                break;
            case 'target':
                extractTargetMessage(data[1]);
                if (hasTarget && hasData && hasLoaded >= 3)
                    drawTarget()
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

function getWebsocket() {
    const protocol = location.protocol == 'http:' ? 'ws' : 'wss';
    return new WebSocket(`${protocol}://${location.host}`);
}

function reconnect() {
    setDestinationButtons(false, false);

    fetch(`${location.protocol}//${location.host}`, { method: 'GET' })
        .then(() => {
            socket = getWebsocket();
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
    setDestinationButtons(false, false);
}, { passive: true });

//BackButton: Redirect to controll page
const backButton = document.getElementById('backButton');

backButton.addEventListener('click', () => {
    if (isLocal) {
        send('remote_devicelogout');
        open('/index', '_self');
    } else
        send('remote_redirect');
});

function redirect(key) {
    if (key != '-1') {
        sendStop = true;
        setTimeout(() => { sendStop = false; }, 5000);
    }

    open(key == '-1' ? '/controll' : `controll?key=${key}`, '_self');
}

//Waiting room
const waitingdiv = document.getElementById('waitingdiv');
const waitingtitle = document.getElementById('waitingtitle');
var waitingAnimation = null;

waitingdiv.style.display = 'flex';

function activateWaitingRoom() {
    waitingdiv.style.display = 'flex';
    if (waitingAnimation != null) return;

    waitingAnimation = setInterval(() => {
        if (waitingtitle.textContent.endsWith('...'))
            waitingtitle.textContent = waitingtitle.textContent.substring(0, waitingtitle.textContent.length - 3);
        else
            waitingtitle.textContent += '.';
    }, 750);
}

function deactivateWaitingRoom() {
    waitingdiv.style.display = 'none';
    if (waitingAnimation != null) clearInterval(waitingAnimation);
}

//Manage controll request
function controllRequest(accepted, cause) {
    hasControll = accepted;
    if (accepted) {
        if (hasData)
            setDestinationButtons(true, callText.textContent != "Stopp");
        else
            setDestinationButtons(false, false);
        checkRemoteConnection();
    } else {
        clearGPSWatch();
        if (connectionCheck != null) {
            clearInterval(connectionCheck);
            connectionCheck = null;
        }
        setDestinationButtons(false, false);
    }
}

function setDestinationButtons(call, set) {
    if (!navigator.geolocation || (isLocal && !hasTarget) || (!isLocal && !hasControll)) {
        //geolocation api is not available or is local with no target
        call = false;
        set = false;
    } else if (gpsWatch != null) {
        set = false;
    } else if (onSetWaiting) {
        call = false;
        set = true;
    }
    if (callButton.style.display != (call ? 'block' : 'none') || setButton.style.display != (set ? 'block' : 'none')) {
        callButton.style.display = call ? 'block' : 'none';
        setButton.style.display = set ? 'block' : 'none';

        if (!hasData) return;
        fix_dpi();
        displayMap();
    }
}

//Check remote Connection
var checkreceived = false;
var connectionCheck = null;

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
    setWaitingForInput(false);
}

//map canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

fix_dpi();
function fix_dpi() {
    let dpi = window.devicePixelRatio;
    let style_height = getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);
    let style_width = getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);

    canvas.removeAttribute('height');
    canvas.removeAttribute('width');
    canvas.setAttribute('height', style_height * dpi);
    canvas.setAttribute('width', style_width * dpi);
}

function extractNavigationMessage(message) {
    //Example: filename=geodata_18_19;pixelX=1455;pixelY=1355
    if (message == 'Lokalisieren...') {
        hasData = false;
        activateWaitingRoom();
        return;
    }

    currentX = parseInt(message.split(';')[0].split('=')[1].split('_')[1]);
    currentY = parseInt(message.split(';')[0].split('=')[1].split('_')[2]);
    pixelX = parseInt(message.split(';')[1].split('=')[1]);
    pixelY = parseInt(message.split(';')[2].split('=')[1]);

    if (!hasData) {
        hasData = true;
        deactivateWaitingRoom();
    }
}

function displayMap() {
    if (!hasData) return;

    hasLoaded = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var x = pixelX > imageWidth / 2 ? 1 : -1;
    var y = pixelY > imageWidth / 2 ? 1 : -1;

    var searches = [
        { x: currentX, y: currentY },
        { x: currentX, y: currentY + y },
        { x: currentX + x, y: currentY },
        { x: currentX + x, y: currentY + y }
    ];

    //Search for out of range index
    for (let searchIndex in searches) {
        var search = searches[searchIndex]

        if (search.x == -1 || search.x == 26 || search.y == -1 || search.y == 26) {
            searches.splice(searchIndex, 1);
        }
    }

    //Search for cached images
    for (let imageIndex in images) {
        if (searches.length == 0) break;
        var image = images[imageIndex];
        for (let searchIndex in searches) {
            var search = searches[searchIndex]
            if (image.x == search.x && image.y == search.y) {
                drawImage(image.image, image.x - currentX, image.y - currentY);
                searches.splice(searchIndex, 1);
                break;
            }
        }
    }

    //Download non-cached images
    for (let searchIndex in searches) {
        loadGeoDataImage(searches[searchIndex].x, searches[searchIndex].y);
    }
}

function checkMapImages() {
    for (const index in images) {
        const image = images[index];
        if (Math.abs(currentY - image.y) > 1 || Math.abs(currentX - image.x) > 1) {
            images.splice(index, 1);
        }
    }
}

function loadGeoDataImage(x, y) {
    const image = new Image();
    image.src = `/images/navigation/geodata_${x}_${y}.webp`;

    image.onerror = () => console.warn(`Could not load geodata_${x}_${y}.webp.`);
    image.onload = () => {
        drawImage(image, x - currentX, y - currentY);
        for (const index in images) {
            const image = images[index];
            if (image.x == x && image.y == y) return;
        }
        images.push({ x: x, y: y, image: image });
    };
}

function drawImage(image, x, y) {
    //drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)   pixelX=1455;pixelY=1355
    const scale = window.devicePixelRatio * (2 / 3);

    var dx = x * image.width * scale - pixelX * scale + canvas.width / 2;
    var dy = y * image.width * scale - pixelY * scale + canvas.height / 2;

    ctx.drawImage(image, 0, 0, image.width, image.width, dx, dy, image.width * scale, image.height * scale);

    hasLoaded++;
    if (hasTarget && hasLoaded == 3) drawTarget();
}

window.addEventListener('resize', () => {
    if (!hasData) return;
    fix_dpi();
    displayMap();
}, { passive: true });

//Call Ekart button
const callButton = document.getElementById('callButton');
const setButton = document.getElementById('setButton');
const callText = document.getElementById('callText');
const setText = document.getElementById('setText');
const displayFrame = document.getElementById('displayFrame');
const setInfo = document.getElementById('setInfo');
const errorMessage = document.getElementById('errorMessage');

[callButton, setButton].forEach(button => {
    //Adding hover effect
    button.addEventListener('mouseenter', () => {
        if (button.style.backgroundColor == 'rgb(205, 50, 50)')
            button.style.backgroundColor = '#cd1616';
        else
            button.style.backgroundColor = '#216fc9';
    }, { passive: true });

    button.addEventListener('mouseleave', () => {
        if (button.style.backgroundColor == 'rgb(205, 22, 22)')
            button.style.backgroundColor = '#cd3232';
        else
            button.style.backgroundColor = null;
    }, { passive: true });
});

callButton.style.display = 'none';
setButton.style.display = 'none';
errorMessage.style.display = 'none';
var destination = null;

function checkButtonStatus() {
    if (hasData && callText.textContent == 'Stopp') {
        if (callButton.style.backgroundColor != 'rgb(205, 22, 22)')
            callButton.style.backgroundColor = '#cd3232';
        setDestinationButtons(true, false)
    } else if (hasData)
        setDestinationButtons(true, true)
    else
        setDestinationButtons(false, false)
}

//GPS-CallMyEkart
callButton.addEventListener('click', () => {
    if (!hasData) return;
    if (gpsWatch != null) return;
    if (hasTarget) {
        //Stop-Button
        hasTarget = false;
        send(`set_target:deg:-1`);
        clearGPSWatch();
        return;
    }
    getDestination();
}, { passive: true });

var accuracy = 0;
function getDestination() {
    clearGPSWatch();
    if (!hasControll) return;

    gpsWatch = navigator.geolocation.watchPosition(position => {
        const lat = position.coords.latitude;
        const long = position.coords.longitude;

        if (gpsWatchTimeout == null) {
            gpsWatchTimeout = setTimeout(() => {
                gpsWatchTimeout = null;
                clearGPSWatch();
                onGPSError('Position konnte nicht bestimmt werden.')
            }, 45000); // 45s
        }

        if (position.coords.accuracy < 10) {
            //Accuracy is less than 10 meters
            send(`set_target:deg:${lat} ${long}`);
            clearGPSWatch();
            callText.textContent = `Lokalisieren: 100%`;
            setDestinationButtons(true, false);
        } else {
            const currentAccuracy = Math.floor((10 / position.coords.accuracy) * 100);
            if (currentAccuracy > accuracy) accuracy = currentAccuracy;
            callText.textContent = `Lokalisieren: ${accuracy}%`;
            setDestinationButtons(true, false);
        }
    }, err => {
        onGPSError(err.message)
    }, { enableHighAccuracy: true, maximumAge: 100, timeout: 2000 });
}

function clearGPSWatch() {
    if (gpsWatch != null) {
        window.navigator.geolocation.clearWatch(gpsWatch);
        gpsWatch = null;
    }
    if (gpsWatchTimeout != null) {
        clearTimeout(gpsWatchTimeout);
        gpsWatchTimeout = null;
    }
    callButton.style.backgroundColor = '#2f81df';
    callText.textContent = 'CallMyEkart';
    accuracy = 0;
    setDestinationButtons(true, true);
}

function onGPSError(err) {
    console.error(`GPS-Error: ${err}`);
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000); // 5s
}

//Set Target
setButton.addEventListener('click', () => { setWaitingForInput(!onSetWaiting) }, { passive: true });

function setWaitingForInput(waiting) {
    if (waiting == onSetWaiting) return;
    if (waiting) {
        onSetWaiting = true;
        setText.textContent = 'Abbrechen';
        setDestinationButtons(false, true);
        displayFrame.style.backgroundImage = 'linear-gradient(to bottom right, #dfa22f, #b9472a)'
        setInfo.style.display = 'block';
        canvas.style.cursor = 'crosshair';
    } else {
        onSetWaiting = false;
        setText.textContent = 'Ziel setzen';
        setDestinationButtons(true, true);
        displayFrame.style.backgroundImage = null;
        setInfo.style.display = null;
        canvas.style.cursor = null;
    }
}

['click', 'touchstart'].forEach(event => {
    canvas.addEventListener(event, e => {
        if (!onSetWaiting) return;
        if (event == 'touchstart') e = e.touches[0]

        var pos = getMousePosition(e);
        send(`set_target:px:${pos.x} ${pos.y}`);

        setWaitingForInput(false);
    }, { passive: true });
})

function getMousePosition(event) {
    const scale = window.devicePixelRatio;
    var rect = canvas.getBoundingClientRect();

    return {
        x: Math.round(((event.clientX - rect.left) / (rect.right - rect.left) * canvas.width / scale) - canvas.width / (2 * scale)),
        y: -Math.round(((event.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height / scale) - canvas.height / (2 * scale))
    };
}

//Draw Target
function extractTargetMessage(message) {
    if (message == '-1') {
        targetX = 0;
        targetY = 0;
        hasTarget = false;
        if (isLocal) setDestinationButtons(false, false);
        if (gpsWatch == null) {
            callButton.style.backgroundColor = '#2f81df';
            callText.textContent = 'CallMyEkart';
            setDestinationButtons(true, true);
        }
        return;
    }

    hasTarget = true;
    values = message.split(' ');
    targetX = parseInt(values[0]);
    targetY = parseInt(values[1]);

    displayMap();
}

function drawTarget() {
    //Change SetTargetButton behavior
    if (callText.textContent != 'Stopp') {
        if (callButton.style.backgroundColor != 'rgb(205, 22, 22)')
            callButton.style.backgroundColor = '#cd3232';
        callText.textContent = 'Stopp';
        setDestinationButtons(true, false);
    }
    if (isLocal) setDestinationButtons(true, false);

    setTimeout(() => {
        const scale = window.devicePixelRatio;
        ctx.strokeStyle = '#323232';
        ctx.fillStyle = '#3232cd';
        ctx.lineWidth = 2 * scale;

        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(canvas.width / 2 + targetX * scale, canvas.height / 2 - targetY * scale);
        ctx.stroke()
        ctx.fillRect(canvas.width / 2 + targetX * scale - 6 * scale, canvas.height / 2 - targetY * scale - 6 * scale, 12 * scale, 12 * scale);
    }, 0);
}
