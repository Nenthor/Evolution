var obstacles = [0, 0, 0];

//Server data
var socket = new WebSocket(`ws://${location.host}`);

addSocketEvents();
function addSocketEvents() {
    socket.addEventListener('open', () => {
        socket.send('get_camera');
    }, { passive: true });

    socket.addEventListener('close', () => {
        console.warn('Server has closed. Retrying...');
        reconnect();
    });

    socket.addEventListener('message', event => {
        const data = String(event.data).split(':');
        switch (data[0]) {
            case 'camera':
                obstacles = getObstacles(data[1]);
                drawCamera();
                break;
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

function getObstacles(data) {
    return [parseInt(data[0]), parseInt(data[1]), parseInt(data[2])];
}

//Draw Camera
const canvas = document.querySelector('canvas');

const ctx = canvas.getContext('2d');
const width = canvas.width, height = canvas.height;
const middleX = width / 2, middleY = height - width / 15;
const angels = [190, 235, 305, 350], radius = [0.4, 0.7, 1.0];
const emptyColor = '#aaa', obstacleColor = '#cd3232';

function drawCamera() {
    ctx.clearRect(0, 0, width, height);
    //Boxes
    for (let column = 0; column < 3; column++) {
        for (let row = 2; row >= 0; row--) {
            drawBox(getColor(column, row), angels[column] - column, angels[column + 1] - column, radius[row] * middleY)
        }
    }

    //Middle Circle
    ctx.fillStyle = "#0d85d4";
    ctx.beginPath();
    ctx.arc(width / 2, middleY, width / 15, 0, 2 * Math.PI, true);
    ctx.fill();
}

function drawBox(color, startAngle, endAngle, radius) {
    ctx.fillStyle = color;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.25;
    ctx.beginPath();
    startAngle *= (Math.PI / 180);
    endAngle *= (Math.PI / 180);
    ctx.moveTo(middleX, middleY);
    ctx.arc(middleX, middleY, radius, startAngle, endAngle, false);
    ctx.fill();
    ctx.stroke();

    ctx.lineTo(middleX, middleY);
    ctx.stroke();
}

function getColor(column, row) {
    if (obstacles[column] * -1 + 2 < row) return obstacleColor;
    return emptyColor;
}

drawCamera();
