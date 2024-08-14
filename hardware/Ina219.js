import Ina219Board from 'ina219-async';
import pinlayout from '../src/lib/server/data/pinlayout.json' assert { type: 'json' };
import { send } from './Communication.js';

const SPEED_UPDATE_INTERVAL = 300; // ms
const BATTERY_UPDATE_INTERVAL = 10_000; // ms

const MIN_BATTERY_V = 69;
const MAX_BATTERY_V = 84;
const V_DIVIDER_BATTERY = 6.66;

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

const speedHistory = [];
const SPEED_SAMPLES = 3;
async function getSpeed() {
	if (!speed) return;

	const volt = await speed.getBusVoltage_V();
	if (volt === undefined || volt === null) return;

	let newSpeed = Math.floor((volt / MAX_SPEED_V) * MAX_SPEED_KMH);
	if (newSpeed <= 3) newSpeed = 0; // Ignore low speeds to avoid false positives
	newSpeed = Math.min(MAX_SPEED_KMH, Math.max(0, newSpeed));

	speedHistory.push(newSpeed);
	if (speedHistory.length > SPEED_SAMPLES) speedHistory.shift();
	// Ignore if speed is 0 for 3 consecutive readings to avoid false positives
	if (newSpeed == 0 && !speedHistory.every((s) => s == 0)) return;

	const avgSpeed = Math.round(speedHistory.reduce((a, b) => a + b) / speedHistory.length);

	const data = {
		type: 'speed',
		speed: avgSpeed
	};

	send(JSON.stringify(data));
}

let lowestBattery = 100;
async function getBattery() {
	if (!battery) return;

	const volt = await battery.getBusVoltage_V();
	if (volt === undefined || volt === null) return;

	let newBattery = Math.ceil(
		((volt * V_DIVIDER_BATTERY - MIN_BATTERY_V) / (MAX_BATTERY_V - MIN_BATTERY_V)) * 100
	);
	newBattery = Math.min(100, Math.max(0, newBattery));

	if (newBattery < lowestBattery) lowestBattery = newBattery;
	else newBattery = lowestBattery; // Avoid false positives

	const data = {
		type: 'battery',
		battery: newBattery
	};

	send(JSON.stringify(data));
}
