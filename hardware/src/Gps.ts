import GPS from 'gps';
import { SerialPort } from 'serialport';
import { send } from './Communication.js';

const INVALID_LIMIT = 10;

let gps: GPS;
let serial: SerialPort;
let lat = 0,
	long = 0;
let invalid_count = 0;

export default () => {
	if (gps || serial) return;

	serial = new SerialPort({ path: '/dev/serial0', baudRate: 9600 });
	serial.on('data', (data) => gps.updatePartial(data));

	gps = new GPS();
	gps.on('data', (data) => {
		if (!data.valid || !gps.state.lat || !gps.state.lon) {
			if (invalid_count >= INVALID_LIMIT) {
				lat = 0;
				long = 0;
				send(`gps=${JSON.stringify({ lat, long })}`);
			} else invalid_count++;
			return;
		} else invalid_count = 0;
		if (lat == gps.state.lat && long == gps.state.lon) return;
		lat = gps.state.lat;
		long = gps.state.lon;

		send(`gps=${JSON.stringify({ lat, long })}`);
	});
};
