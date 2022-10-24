//Server data
var socket = getWebsocket();
const imageWidth = 2816;
const images = [];
var isLocal = location.protocol == 'http:';
var currentX = 0, currentY = 0;
var pixelX = 0, pixelY = 0;
var targetX = 0, targetY = 0;
var hasData = false, hasTarget = false, hasLoaded = 0;
var gpsWatch = null, gpsWatchTimeout = null;

addSocketEvents();
function addSocketEvents() {
    socket.addEventListener('open', () => {
        send('get_navigation');
        send('get_target');
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
                checkMapImages()
                break;
            case 'target':
                const firstTarget = !hasTarget
                extractTargetMessage(data[1]);
                if (firstTarget && hasTarget && hasData && hasLoaded == 3)
                    drawTarget()
                else if (hasData)
                    displayMap();
                break;
            default:
                break;
        }
    }, { passive: true });
}
function send(message) {
    if (socket.readyState == WebSocket.OPEN) {
        socket.send(message);
    }
}

function getWebsocket() {
    const protocol = location.protocol == 'http:' ? 'ws' : 'wss';
    return new WebSocket(`${protocol}://${location.host}`);
}

function reconnect() {
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
    hasLoaded = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    getChachedImage(currentX, currentY);

    var x = pixelX > imageWidth / 2 ? 1 : -1;
    var y = pixelY > imageWidth / 2 ? 1 : -1;

    getChachedImage(currentX, currentY + y);
    getChachedImage(currentX + x, currentY);
    getChachedImage(currentX + x, currentY + y);
}

function getChachedImage(x, y) {
    if (x == -1 || x == 26 || y == -1 || y == 26) return;
    for (const index in images) {
        const image = images[index];
        if (image.x == x && image.y == y) {
            drawImage(image.image, x - currentX, y - currentY);
            return;
        }
    }
    loadGeoDataImage(x, y);
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

    image.onerror = () => console.log(`Could not load geodata_${x}_${y}.webp.`);
    image.onload = () => {
        if (x - currentX == 0 && y - currentY == 0)
            ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawImage(image, x - currentX, y - currentY);
    };
    images.push({ x: x, y: y, image: image });
}

function drawImage(image, x, y) {
    //drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)   pixelX=1455;pixelY=1355
    const scale = window.devicePixelRatio * 0.75;

    ctx.drawImage(image, 0, 0, image.width, image.height, x * image.width * scale - pixelX * scale + canvas.width / 2, y * image.width * scale - pixelY * scale + canvas.height / 2, image.width * scale, image.height * scale);

    hasLoaded++;
    if (hasTarget && hasLoaded == 3) drawTarget()
}

window.addEventListener('resize', () => {
    if (!hasData) return;
    fix_dpi();
    displayMap();
}, { passive: true });

//Call Ekart button
const destinationButton = document.getElementById('destinationButton');
const destinationText = document.getElementById('destinationText');
const errorMessage = document.getElementById('errorMessage');

destinationButton.style.backgroundColor = '#444';
destinationButton.style.cursor = 'default';
errorMessage.style.display = 'none';
var destination = null;

if (!navigator.geolocation) {
    //geolocation api is not available
    destinationButton.style.display = 'none';
}

function checkButtonStatus() {
    if (hasData && destinationText.textContent == 'Stopp') {
        destinationButton.style.backgroundColor = '#cd3232';
        destinationButton.style.cursor = 'pointer';
    } else if (hasData) {
        destinationButton.style.backgroundColor = '#2f81df';
        destinationButton.style.cursor = 'pointer';
    } else {
        destinationButton.style.backgroundColor = '#444';
        destinationButton.style.cursor = 'default';
    }
}

destinationButton.addEventListener('click', () => {
    if (!hasData) return;
    if (destinationText.textContent == 'Berechnen...') return;
    if (gpsWatch != null) return;
    if (hasTarget) {
        //Stop-Button
        return;
    }
    getDestination();
}, { passive: true });

function getDestination() {
    clearGPSWatch();
    gpsWatch = navigator.geolocation.watchPosition(position => {
        const lat = position.coords.latitude;
        const long = position.coords.longitude;

        if (gpsWatchTimeout == null) {
            gpsWatchTimeout = setTimeout(() => {
                gpsWatchTimeout = null;
                clearGPSWatch();
                onGPSError('Unable to get accurate position.')
            }, 30000); // 30s
        }

        if (position.coords.accuracy < 10) {
            //Accuracy is less than 10 meters
            send(`set_target:${lat} ${long}`);
            clearGPSWatch();
            destinationText.textContent = `Berechnen...`;
        } else {
            accuracy = Math.floor((10 / position.coords.accuracy) * 100);
            destinationText.textContent = `Lokalisieren: ${accuracy}%`;
        }
    }, err => {
        onGPSError(err.message)
    }, { enableHighAccuracy: true, maximumAge: 500, timeout: 2000 });
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
    if (destinationText.textContent != 'Berechnen...') {
        destinationButton.style.backgroundColor = '#2f81df';
        destinationText.textContent = 'CallMyEkart';
    }
}

function onGPSError(err) {
    console.error(`GPS-Error: ${err}`);
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000); // 5s
}

function extractTargetMessage(message) {
    clearGPSWatch();
    if (message == '-1') {
        targetX = 0;
        targetY = 0;
        hasTarget = false;
        return;
    }

    hasTarget = true;
    values = message.split(' ');
    targetX = parseInt(values[0]);
    targetY = parseInt(values[1]);

    destinationText.textContent = 'Berechnen...';
}

function drawTarget() {
    setTimeout(() => {
        const scale = window.devicePixelRatio;
        ctx.strokeStyle = '#323232';
        ctx.fillStyle = '#3232cd';
        ctx.lineWidth = 2 * scale;

        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(canvas.width / 2 + targetX * scale + 6 * scale, canvas.height / 2 - targetY * scale + 6 * scale);
        ctx.stroke()
        ctx.fillRect(canvas.width / 2 + targetX * scale, canvas.height / 2 - targetY * scale, 12 * scale, 12 * scale);

        //Change SetTargetButton behavior
        destinationButton.style.backgroundColor = '#cd3232';
        destinationText.textContent = 'Stopp';
    }, 0);
}
