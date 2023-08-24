import { DistanceSensor } from './Gpio.js';
import type { CameraData } from '../../src/lib/Types.js';
import pinlayout from '../../src/lib/server/data/pinlayout.json' assert { type: 'json' };
import { send } from './Communication.js';

const LEVELS = [300, 200, 100];
let camera: DistanceSensor[] = [];
let obstacles: CameraData['obstacles'] = [];

export default function start() {
	for (const pins of pinlayout.distance_sensor) {
		let sensor = new DistanceSensor(pins.ID, pins.TRIGGER, pins.ECHO, onSignal);
		camera.push(sensor);
		obstacles.push(0);
	}

	console.log('Camera is online');
}

function onSignal(id: number, distance: number) {
	for (let i = LEVELS.length; i >= 0; i--) {
		if (i == 0 || distance < LEVELS[i - 1]) {
			if (obstacles[id] == i) return;

			obstacles[id] = i;
			send(`camera=${JSON.stringify(obstacles)}`);
			return;
		}
	}
}
