import type { DisplayData, MapData, CameraData, MusicData, Settings } from '$lib/Types';
import { onMessage as onUserMessage, send } from './SocketServer';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import Sound, { playMusic } from './channels/Sound';
import Map from './channels/Navigation';
import { checkSettings, shutdown } from './channels/Settings';
import { DIR } from '$env/static/private';
import default_data from './data/default.json' assert { type: 'json' };
import Hardware, { onMessage as onHardwareMessage } from './Hardware';

const settings_url = join(DIR, 'src/lib/server/data/settings.json');

let music: MusicData = default_data.music;
let display: DisplayData = default_data.display;
let camera: CameraData = default_data.camera;
let map: MapData = default_data.map;

export function getDisplayData() {
	return display;
}

export function setDisplayData(new_data: DisplayData) {
	display = new_data;
	send('display', JSON.stringify(display));
}

export function getMusicData() {
	return music;
}

export function setMusicData(new_data: MusicData) {
	music = new_data;
	send('music', JSON.stringify(music));
}

export function getCameraData() {
	return camera;
}

export function setCameraData(new_data: CameraData) {
	camera = new_data;
	send('camera', JSON.stringify(camera));
}

export function getMapData() {
	return map;
}

export function setMapData(new_data: MapData) {
	map = new_data;
	send('map', JSON.stringify(map));
}

export async function loadSettings() {
	let data = await readFile(settings_url, 'utf-8');
	let settings: Settings = JSON.parse(data.toString());

	display.settings = settings.settings;
	music.volume = settings.volume;
	music.current_song = settings.current_song;

	setDisplayData(display);
	setMusicData(music);
	checkSettings(display.settings, music);
}

async function saveSettings() {
	let settings: Settings = {
		settings: display.settings,
		volume: music.volume,
		current_song: music.current_song
	};

	await writeFile(settings_url, JSON.stringify(settings, null, 2));
}

onUserMessage((message) => {
	let msg = message.split('=');
	if (msg.length > 2) return;

	switch (msg[0]) {
		case 'settings':
			display.settings = JSON.parse(msg[1]);
			checkSettings(display.settings, music);
			setDisplayData(display);
			break;
		case 'music':
			music = JSON.parse(msg[1]);
			playMusic(music);
			setMusicData(music);
			break;
		case 'shutdown':
			shutdown();
			break;
		case 'test':
			console.log(msg[1]);
			break;
		default:
			console.log(`${msg[0]} not available to user request`);
			break;
	}

	saveSettings();
});

onHardwareMessage((message) => {
	let msg = message.split('=');
	if (msg.length > 2) return;

	switch (msg[0]) {
		case 'camera':
			camera.obstacles = JSON.parse(msg[1]);
			setCameraData(camera);
			break;
		default:
			console.log(`${msg[0]} not available to hardware request`);
			break;
	}
});

//Enable channels
Hardware();
Sound();
Map();
