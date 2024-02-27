import { DIR, IS_PI } from '$env/static/private';
import type { DisplayData, MusicData } from '$lib/Types';
import { exec } from 'child_process';
import { join } from 'path';
import soundPlayer from 'play-sound';
import { exit } from 'process';
import { getMusicData, setMusicData } from '../DataHub';

const isPI = IS_PI == 'true';
const TIMEOUT = 500; // in ms
const player = soundPlayer({ player: 'mpg123' });
let current_song: any,
	current_volume = 0,
	current_index = -1,
	current_status = false;

export default function start() {
	if (!isPI) {
		console.log('Not running on Raspberry PI - Sound is offline');
		return;
	}
	console.log('Sound is online');

	process.stdin.resume();
	process.removeAllListeners();
	['SIGINT', 'SIGTERM'].forEach((signal) => {
		process.on(signal, () => {
			current_status = false;
			stopSong();
			exit();
		});
	});
}

export function checkMusicSetting(settings: DisplayData['settings'], music: MusicData) {
	let status = settings.find((s) => s.name == 'music')?.status || false;
	if (current_status != status) {
		current_status = status;
		if (current_status) playMusic(music);
		else stopSong();
	}
}

export function playMusic(music: MusicData) {
	if (!isPI) return;

	//Change volume
	if (
		current_volume != music.volume ||
		(music.current_song != -1 && current_index != music.current_song)
	) {
		current_volume = music.volume;
		const volume_adj = music.current_song == -1 ? 0 : music.songs[music.current_song].volume_adj;
		changeVolume(music.volume + volume_adj);

		if (current_index == music.current_song) return;
	}

	//Play new song
	stopSong();
	current_index = music.current_song;
	if (music.current_song == -1 || !current_status) return;

	let url = join(DIR, 'static', music.songs[music.current_song].url);
	current_song = player.play(url, (err) => {
		if (err) throw err;
		if (current_index != music.current_song || !current_status) return;
		nextSong();
	});
}

function nextSong() {
	if (!isPI) return;
	let music = getMusicData();
	music.current_song++;
	if (music.current_song == music.songs.length) music.current_song = 0;
	playMusic(music);
	setMusicData(music);
}

function stopSong() {
	if (!isPI) return;
	if (current_song) {
		current_song.kill();
		current_song = null;
	}
}

let timeout = false;
let change = false;
function changeVolume(new_volume: number) {
	if (!isPI) return;
	let volume = Math.round((new_volume / 100) * 90 + 10);
	if (new_volume == 0) volume = 0;
	if (!timeout) {
		timeout = true;
		exec(`amixer -q -M sset PCM ${volume}%`);
		setTimeout(() => {
			timeout = false;
			if (change) changeVolume(current_volume);
			change = false;
		}, TIMEOUT);
	} else change = true;
}
