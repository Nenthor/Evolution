import Ina219Board from 'ina219-async';
import pinlayout from '../src/lib/server/data/pinlayout.json' assert { type: 'json' };
import { send } from './Communication.js';

const SPEED_UPDATE_INTERVAL = 333; // ms
const BATTERY_UPDATE_INTERVAL = 10_000; // ms

const MIN_BATTERY_V = 69;
const MAX_BATTERY_V = 84;

const MAX_SPEED_V = 20;
const MAX_SPEED_KMH = 30;

let speed;
let battery;
let speedInterval;
let batteryInterval;

export default async () => {
	if (!speed) {
		try {
			speed = Ina219Board(intToHex(pinlayout.ADRESS_SPEED), 1);
			await speed.calibrate32V1A();
			speedInterval = setInterval(async () => await getSpeed(), SPEED_UPDATE_INTERVAL);
			console.log('Speed online');
		} catch (error) {
			speed = undefined;
			console.log('Speed not connected');
		}
	}
	if (!battery) {
		try {
			battery = Ina219Board(intToHex(pinlayout.ADRESS_BATTERY), 1);
			await battery.calibrate32V1A();
			speedInterval = setInterval(async () => await getBattery(), BATTERY_UPDATE_INTERVAL);
			console.log('Battery online');
		} catch (error) {
			battery = undefined;
			console.log('Battery not connected');
		}
	}
};

export function cleanup() {
	if (speedInterval) clearInterval(speedInterval);
	if (batteryInterval) clearInterval(batteryInterval);
	if (speed) speed.closeSync();
	if (battery) battery.closeSync();
}

function intToHex(n) {
	return parseInt(`0x${n}`, 16);
}

async function getSpeed() {
	if (!speed) return;

	const volt = await speed.getBusVoltage_V();

	const data = {
		type: 'speed',
		speed: (volt / MAX_BATTERY_V) * MAX_SPEED_KMH
	};

	send(JSON.stringify(data));
}

async function getBattery() {
	if (!battery) return;

	const volt = await battery.getBusVoltage_V();

	const data = {
		type: 'battery',
		battery: ((volt - MIN_BATTERY_V) / (MAX_BATTERY_V - MIN_BATTERY_V)) * 100
	};

	send(JSON.stringify(data));
}
