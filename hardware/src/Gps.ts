import GPS from 'gps';
import { SerialPort } from 'serialport';
import { send } from './Communication.js';
import { getRotation, setDeclination } from './Compass.js';
import type { HardwareGps } from '../../src/lib/Types.js';

let gps: GPS;
let serial: SerialPort;
let lat = 0,
	long = 0,
	deg = 0;
let first_hit = false;

export default () => {
	if (gps || serial) return;

	serial = new SerialPort({ path: '/dev/serial0', baudRate: 9600 });
	serial.on('data', (data) => gps.updatePartial(data));

	gps = new GPS();
	gps.on('data', (data) => {
		if (!data.valid || !gps.state.lat || !gps.state.lon) return;
		if (lat == gps.state.lat && long == gps.state.lon && deg == getRotation()) return;
		lat = gps.state.lat;
		long = gps.state.lon;
		deg = getRotation();

		if (!first_hit) {
			first_hit = true;
			setDeclination(lat, long);
		}

		send(getGpsString());
	});
	console.log('GPS is online');
};

function getGpsString(valid = true) {
	const data: HardwareGps = {
		type: 'gps',
		lat: valid ? lat : 0,
		long: valid ? long : 0,
		rotation: valid ? deg : 0
	};
	return JSON.stringify(data);
}

export function forceUpdate() {
	send(getGpsString());
}
