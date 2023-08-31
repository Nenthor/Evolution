import GPS from 'gps';
import { SerialPort } from 'serialport';
import { send } from './Communication.js';
import { getRotation, setDeclination } from './Compass.js';
import type { HardwareGps } from '../../src/lib/Types.js';

const INVALID_LIMIT = 10;

let gps: GPS;
let serial: SerialPort;
let lat = 0,
	long = 0;
let invalid_count = 0;
let first_hit = false

export default () => {
	if (gps || serial) return;

	serial = new SerialPort({ path: '/dev/serial0', baudRate: 9600 });
	serial.on('data', (data) => gps.updatePartial(data));

	gps = new GPS();
	gps.on('data', (data) => {
		if (!data.valid || !gps.state.lat || !gps.state.lon) {
				// Clear Coords if data not valid
				if (invalid_count >= INVALID_LIMIT) {
						invalid_count = 0
						send(getGpsString(false));
				}
				else invalid_count++;
				return;
		} else invalid_count = 0;
		if (lat == gps.state.lat && long == gps.state.lon)return;
		lat = gps.state.lat;
		long = gps.state.lon;

		if(!first_hit) {
				first_hit = true
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
		rotation: valid ? getRotation() : 0
	}
	return JSON.stringify(data);
}

export function forceUpdate() {
	send(getGpsString());
}
