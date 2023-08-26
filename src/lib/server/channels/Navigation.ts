import { getDisplayData, getMapData, setDisplayData, setMapData } from '../DataHub';
import map_data from '../data/navigation.json' assert { type: 'json' };

let current_index = -1;

export default function start() {
	console.log('Navigation is online');
	update(48.081667, 11.661944);
}

export function parseGpsMessage(msg: string) {
	const data = JSON.parse(msg);
	update(data.lat, data.long);
}

function update(lat: number, long: number) {
	current_index = findImage(lat, long, current_index);
	if (current_index != -1) {
		updateNavigation(lat, long, current_index);
		updateCoordsText(lat, long);
	} else {
		console.log('Navigation not available...');
		clearNavigation();
		updateCoordsText();
	}
}

function updateCoordsText(lat = 0, long = 0) {
	let coords = `${degreeToDMS(lat)}N ${degreeToDMS(long)}E`;
	let display = getDisplayData();
	display.coords_txt = current_index != -1 ? coords : 'Lokalisieren...';
	setDisplayData(display);
}

function degreeToDMS(degree: number) {
	let d = Math.floor(degree);
	let m = Math.floor((degree - d) * 60);
	let s = Math.round(((degree - d) * 60 - m) * 60);
	return `${d}°${m}'${s}"`;
}

function findImage(lat: number, long: number, index: number) {
	if (!isMatchingImage(lat, long, index)) {
		for (let i in map_data.geodata) {
			if (isMatchingImage(lat, long, parseInt(i))) return parseInt(i);
		}
		return -1;
	} else return index;
}

function isMatchingImage(lat: number, long: number, index: number) {
	if (index == -1) return false;
	const img = map_data.geodata[index];

	if (img.startLat < lat || img.endLat > lat) return false;
	if (img.startLong > long || img.endLong < long) return false;
	return true;
}

function updateNavigation(lat: number, long: number, index: number) {
	const img = map_data.geodata[index];
	setMapData({
		hasLocation: true,
		imageX: parseInt(img.filename.split('_')[1]),
		imageY: parseInt(img.filename.split('_')[2]),
		pixelX: Math.round((long - img.startLong) / map_data.settings.widthPixelLong),
		pixelY: Math.round((lat - img.startLat) / map_data.settings.widthPixelLat),
		rotation: getMapData().rotation
	});
}

function clearNavigation() {
	setMapData({
		hasLocation: false,
		imageX: 0,
		imageY: 0,
		pixelX: 0,
		pixelY: 0,
		rotation: getMapData().rotation
	});
}
