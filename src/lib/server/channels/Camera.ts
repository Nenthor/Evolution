import pinlayout from '../data/pinlayout.json' assert { type: 'json' };
import { IS_PI } from '$env/static/private';
import { DistanceSensor } from '../Gpio';
import { getCameraData, setCameraData } from '../DataHub';

const LEVELS = [300, 200, 100];
const isPi = IS_PI == 'true';
let camera: DistanceSensor[] = [];

export default function start() {
	if (!isPi) return;

	for (const pins of pinlayout.distance_sensor) {
		let sensor = new DistanceSensor(pins.ID, pins.TRIGGER, pins.ECHO, onSignal);
		camera.push(sensor);
	}

	console.log('Camera is online');
}

function onSignal(id: number, distance: number) {
	let data = getCameraData();

	for (let i = LEVELS.length; i >= 0; i--) {
		if (i == 0 || distance < LEVELS[i - 1]) {
			if (data.obstacles[id] == i) return;

			data.obstacles[id] = i;
			setCameraData(data);
			return;
		}
	}
}
