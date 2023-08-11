import type { DisplayData, MapData, CameraData, MusicData } from '$lib/Types';
import { writable } from 'svelte/store';

let music_data: MusicData = {
	volume: 0,
	current_song: -1,
	songs: []
};

let display_data: DisplayData = {
	battery: 0,
	reverse: false,
	speed: 0,
	settings: [
		{
			name: 'music',
			status: false
		},
		{
			name: 'car_light',
			status: false
		},
		{
			name: 'remote_controll',
			status: false
		},
		{
			name: 'shutdown',
			status: false
		}
	],
	coords_txt: 'Lokalisieren...',
	connection_quality: '?'
};

let camera_data: CameraData = {
	obstacles: [0, 0, 0]
};

let map_data: MapData = {
	hasLocation: false,
	imageX: 0,
	imageY: 0,
	pixelX: 0,
	pixelY: 0,
	rotation: 0
};

export const displayStore = writable(display_data);
export const cameraStore = writable(camera_data);
export const mapStore = writable(map_data);
export const musicStore = writable(music_data);
