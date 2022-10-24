//Server data
var socket = new WebSocket(`ws://${location.host}`);

addSocketEvents();
function addSocketEvents() {
    socket.addEventListener('open', () => {
        send('add_debuglistener');
    }, { passive: true });

    socket.addEventListener('close', () => {
        console.warn('Server has closed. Retrying...');
        reconnect();
    });

    socket.addEventListener('message', event => {
        const data = String(event.data).split(':');
        switch (data[0]) {
            case 'set_memoryusage':
                setMemoryUsage(parseInt(data[1]));
                break;
            case 'set_cpuusage':
                setCpuUsage(parseInt(data[1]));
                break;
            case 'set_systemload':
                setSystemLoad(parseInt(data[1]));
                break;
            case 'add_debugmessage':
                const incoming = data[1] == 'IN';
                createElement(data[2], incoming);
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

function send(message) {
    socket.send(message);
}

window.addEventListener('beforeunload', () => {
    send('remove_debuglistener');
}, { passive: true });


//Memory & CPU update
const memory = document.getElementById('memory');
const cpu = document.getElementById('cpu');
const systemload = document.getElementById('systemload');

function setMemoryUsage(usage) {
    memory.textContent = `${memory.textContent.split(':')[0]}: ${usage}%`;
}

function setCpuUsage(usage) {
    cpu.textContent = `${cpu.textContent.split(':')[0]}: ${usage}%`;
}

function setSystemLoad(usage) {
    systemload.textContent = `${systemload.textContent.split(':')[0]}: ${usage}%`;
}

//Log-form
const logFormatButton = document.getElementsByClassName('log_fromButton');
const formSelected = document.getElementById('formSelected');
formSelected.style.display = 'none';
formSelected.style.left = 'auto';

var logFormat = 'Normal';

for (let index = 0; index < logFormatButton.length; index++) {
    logFormatButton[index].addEventListener('click', () => changeLogFormat(index), { passive: true });
    if (logFormatButton[index].textContent == logFormat) changeLogFormat(index);
}

function changeLogFormat(selectedIndex) {
    for (let index = 0; index < logFormatButton.length; index++) {
        if (index == selectedIndex) logFormatButton[index].style.color = '#fff';
        else logFormatButton[index].style.color = '#161616';
    }

    formSelected.style.display = 'inline-block';
    formSelected.style.left = `${100 / logFormatButton.length * selectedIndex}%`;

    if (socket.readyState == WebSocket.OPEN)
        send(`set_importance:${selectedIndex}`);
}

//Add messages to log
const loglist = document.getElementById('loglist');

function createElement(textContent, incoming) {
    const dataDirection = incoming ? '↓' : '↑';

    const listElement = document.createElement('li');
    listElement.classList.add('log_item');

    const textElement = document.createElement('p');
    textElement.classList.add('log_text');
    textElement.textContent = `[${getTime()}] ${dataDirection} >\t${textContent}`;
    listElement.prepend(textElement);

    loglist.prepend(listElement);
}

function getTime() {
    const date = new Date();
    const hours = (date.getHours() < 10 ? '0' : '') + date.getHours();
    const minutes = (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    const seconds = (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
    return `${hours}:${minutes}:${seconds}`;
}

//clear log
const clearLog = document.getElementById('clearLog');
clearLog.addEventListener('click', () => {
    loglist.innerHTML = '';
}, { passive: true });
