const playButton = document.getElementById("navbar_playButton");
const musicItems = document.getElementsByClassName("display_musicItem");

//Server data
var socket = new WebSocket(`ws://${location.host}`);
var music = 0;

addSocketEvents();
function addSocketEvents() {
    socket.addEventListener('open', () => {
        socket.send('get_music');
    }, { passive: true });

    socket.addEventListener('close', () => {
        console.warn('Server has closed. Retrying...');
        reconnect();
    });

    socket.addEventListener('message', event => {
        const data = String(event.data).split(':');
        switch (data[0]) {
            case 'music':
                music = parseInt(data[1]);
                updateMusic();
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

//Setup
playButton.addEventListener("click", function () { onPlayClick(); }, { passive: true });

for (let item = 0; item < musicItems.length; item++) {
    musicItems[item].addEventListener("click", function () { onClick(item); }, { passive: true });
}

function updateMusic() {
    if (music == 0) playButton.textContent = "Starten";
    else playButton.textContent = "Stoppen";

    musicColorReset();
    if (music != 0) musicSetColor(music - 1);
}

//TripleTap to Rickroll
const logo = document.getElementById('logo');
var tapCount = 0;
logo.addEventListener('click', () => {
    addTapcount();
    if (tapCount >= 3) {
        tapCount = 0;
        onClick(5);
    }
}, { passive: true });

function addTapcount() {
    tapCount++;
    setTimeout(() => {
        if (tapCount >= 1) tapCount--;
    }, 500); //Delay for 0.5s
}

//Buttons
function onPlayClick() {
    if (music == 0) {
        playButton.textContent = "Stoppen";
        var random = Math.floor(Math.random() * 4);

        musicColorReset();
        musicSetColor(random);
        saveData(random + 1);
    } else {
        playButton.textContent = "Starten";

        musicColorReset();
        saveData(0);
    }
}

function onClick(index) {
    if (index == music - 1) {
        onPlayClick();
        return;
    }
    if (music == 0) playButton.textContent = "Stoppen";
    musicColorReset();
    musicSetColor(index);

    saveData(index + 1);
}

function musicColorReset() {
    for (let item = 0; item < musicItems.length; item++) {
        musicItems[item].style.backgroundColor = "#646464";
    }
}

function musicSetColor(index) {
    if(index < musicItems.length)
        musicItems[index].style.backgroundColor = "#16AA16";
}

function saveData(index) {
    socket.send(`set_music:${index}`);
    music = index;
}
