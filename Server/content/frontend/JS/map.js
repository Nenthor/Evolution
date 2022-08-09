//Server data
const socket = new WebSocket(`ws://${location.host}`);
const imageWidth = 2816;
var currentX = 0, currentY = 0;
var pixelX = 0, pixelY = 0;
var destinationX = 0, destinationY = 0;
var hasData = false;

socket.addEventListener('open', () => {
    send('get_navigation');
}, { passive: true });

socket.addEventListener('message', event => {
    const data = String(event.data).split(':');
    switch (data[0]) {
        case 'set_navigation':
            extractNavigationMessage(data[1]);
            if (hasData) displayMap();
            break;
        default:
            break;
    }
}, { passive: true });

function send(message) {
    socket.send(message);
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

    if ((destinationX != 0 || destinationY != 0) && x == 0 && y == 0) {
        ctx.beginPath();
        ctx.arc(destinationX, destinationY, 10, 0, 2 * Math.PI);
        ctx.fillStyle = "rgb(32, 32, 32)";
        ctx.fill();
    }
}

window.addEventListener('resize', () => {
    fix_dpi();
    displayMap();
}, { passive: true });

//canvas onclick
const destinationButton = document.getElementById('destinationButton');
const destinationText = document.getElementById('destinationText');
const mapBackground = document.getElementById('mapBackground');

mapBackground.style.backgroundImage = 'linear-gradient(to bottom right, #2f81df, #2a5cb9)';
destinationText.style.display = 'none';
canvas.style.cursor = 'default';

var setDestination = false;

destinationButton.addEventListener('click', () => {
    if (setDestination) {
        setDestination = false;
        destinationText.style.display = 'none';
        canvas.style.cursor = 'default';
        mapBackground.style.backgroundImage = 'linear-gradient(to bottom right, #2f81df, #2a5cb9)';
    } else {
        setDestination = true;
        destinationText.style.display = 'flex';
        canvas.style.cursor = 'pointer';
        mapBackground.style.backgroundImage = 'linear-gradient(to bottom right, #e77e05, #973007)';
    }
}, { passive: true });

["mousedown", "touchstart"].forEach(event => {
    canvas.addEventListener(event, e => {
        getCursorPosition(e);
    }, { passive: true })
});

function getCursorPosition(event) {
    if (!setDestination) return;

    const rect = canvas.getBoundingClientRect();
    destinationX = Math.round(event.clientX - rect.left);
    destinationY = Math.round(event.clientY - rect.top);

    displayMap();
}
