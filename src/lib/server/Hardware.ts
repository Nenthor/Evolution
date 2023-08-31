import { IS_PI } from '$env/static/private';
import { type Socket, connect as connectToHardware } from 'net';

const isPI = IS_PI == 'true';
const port = 4000;
const reconnect_delay = 1000; // 1s

let client: Socket;
let reconnect: NodeJS.Timeout | null = null;
let onMessageCallback = (msg: string) => {};
let onHardwareReconnect = () => {};

['SIGINT', 'SIGTERM'].forEach((signal) => {
	process.on(signal, () => {
		if (reconnect) clearInterval(reconnect);
	});
});

export default () => {
	if (!isPI) console.log('Not running on Raspberry PI - Hardware is offline');
	if (!isPI || client) return;
	connect();
};

function connect() {
	client = connectToHardware({ port });

	//On Connection
	client.on('connect', () => {
		console.log('Hardware is connected');
		onHardwareReconnect();
		if (reconnect) {
			clearInterval(reconnect);
			reconnect = null;
		}
	});

	//On Close (server-side)
	client.on('close', () => {
		if (reconnect) return;

		console.log('Hardware has disconnected. Trying to reconnect...');
		reconnect = setInterval(() => {
			connect();
		}, reconnect_delay);
	});

	//On Error
	client.on('error', (err) => {
		if (err.message.includes('ECONNREFUSED')) return;
		console.log(err);
	});

	//On Message
	client.on('data', (data) => {
		let msg = data.toString().replaceAll('{', '={').split('=')
		msg.shift()
		msg.forEach((m) => onMessageCallback(m))
	});
}

export function send(msg: string) {
	if (client) client.write(msg);
}

export function onMessage(callback: (msg: string) => void) {
	onMessageCallback = callback;
}

export function onReconnect(callback: () => void) {
	onHardwareReconnect = callback;
}
