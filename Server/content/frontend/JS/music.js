const playButton = document.getElementById("navbar_playButton");
const musicItems = document.getElementsByClassName("display_musicItem");

//Server data
const socket = new WebSocket(`ws://${location.host}`);
var music = 0;

socket.addEventListener('open', () => {
    socket.send('get_music');
}, { passive: true });

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
    if (index == music - 1) return;
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
    musicItems[index].style.backgroundColor = "#16AA16";
}

function saveData(index) {
    socket.send(`set_music:${index}`);
    music = index;
}