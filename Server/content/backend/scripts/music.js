const sound = require('play-sound')(opts = {});
const path = require('path');

const playlist = ['rickroll.mp3', 'mario.mp3', 'salsa.mp3', 'podcast.mp3'];

var currentMusic = null;
var isMuted = global.settings[0] == '0';

module.exports = {
    checkForMute,
    playMusic: changeMusic
}

setTimeout(() => {
    checkForMute();
    changeMusic();
}, 2000); //Play music after 2s

function checkForMute() {
    if ((global.settings[0] == '0') == isMuted) return;

    isMuted = !isMuted;
    if (isMuted)
        playMusic(0); //Mute sound
    else
        playMusic(parseInt(global.music)); //Play sound
}

function changeMusic() {
    playMusic(parseInt(global.music));
}

function playMusic(musicIndex) {
    if (currentMusic != null) {
        //Stop current music
        currentMusic.kill();
        currentMusic = null;
    }

    if (musicIndex != 0 && !isMuted)
        currentMusic = playMusicFile(playlist[musicIndex - 1]);
}

function playMusicFile(file) {
    return sound.play(path.join(global.path, `content/backend/sound/${file}`), { mplayer: ['-loop', 0] }, (err) => {
        if (err && err != 1) console.log(`Error while trying to play ${file}.`);
    });
}
