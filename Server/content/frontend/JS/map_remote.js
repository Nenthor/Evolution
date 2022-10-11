//Server data
const socket = new WebSocket(`wss://${location.host}`);
const imageWidth = 2816;
var currentX = 0, currentY = 0;
var pixelX = 0, pixelY = 0;
var targetX = 0, targetY = 0;
var hasData = false, hasTarget = false, hasLoaded = 0;

socket.addEventListener('open', () => {
    send('get_navigation');
    send('get_target');
    send('set_navigation:48.082 11.6625');
}, { passive: true });

socket.addEventListener('message', event => {
    const data = String(event.data).split(':');
    switch (data[0]) {
        case 'set_navigation':
            extractNavigationMessage(data[1]);
            if (hasData) displayMap();
            checkButtonStatus();
            break;
        case 'target':
            const firstTarget = !hasTarget
            extractTargetMessage(data[1]);

            if(firstTarget && hasTarget && hasData && hasLoaded == 3)
                drawTarget()
            else if(hasData) {
                displayMap();
            }
        default:
            break;
    }
}, { passive: true });

function send(message) {
    if (socket.readyState == WebSocket.OPEN) {
        socket.send(message);
    }
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

    loadGeoDataImage(currentX, currentY);

    var x = pixelX > imageWidth / 2 ? 1 : -1;
    var y = pixelY > imageWidth / 2 ? 1 : -1;

    loadGeoDataImage(currentX, currentY - y);
    loadGeoDataImage(currentX + x, currentY);
    loadGeoDataImage(currentX + x, currentY - y);
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
    if (hasData) {
        destinationButton.style.backgroundColor = '#2f81df';
        destinationButton.style.cursor = 'pointer';
    } else {
        destinationButton.style.backgroundColor = '#444';
        destinationButton.style.cursor = 'default';
    }
}

destinationButton.addEventListener('click', () => {
    if (!hasData) return;
    getDestination();
}, { passive: true });

function getDestination() {
    navigator.geolocation.getCurrentPosition(location => {
        const lat = location.coords.latitude;
        const long = location.coords.longitude;
        send(`set_target:${lat} ${long}`);
    }, err => {
        console.error('GPS-Error:', err.message);
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000); // 5s
    }, { enableHighAccuracy: true, maximumAge: 500, timeout: 3000 });
}

function extractTargetMessage(message) {
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
}

function drawTarget() {
    setTimeout(() => {
        ctx.strokeStyle = '#323232';
        ctx.fillStyle = '#3232cd';
        ctx.lineWidth = 3;
    
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        ctx.lineTo(canvas.width / 2 + targetX + 6, canvas.height / 2 - targetY + 6);
        ctx.stroke()
        ctx.fillRect(canvas.width / 2 + targetX, canvas.height / 2 - targetY, 12, 12);    
    }, 500);
}
