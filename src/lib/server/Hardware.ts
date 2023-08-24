import { IS_PI } from '$env/static/private';
import { Socket, connect as connectToHardware } from 'net';

const isPI = IS_PI == 'true';
const port = 4000;
const reconnect_delay = 1500; // 2s

let client: Socket;
let reconnect: NodeJS.Timer | null = null;
let onMessageCallback = (msg: string) => {};

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
	client.on('data', (data) => onMessageCallback(data.toString()));
}

export function send(msg: string) {
	if (client) client.write(msg);
}

export function onMessage(callback: (msg: string) => void) {
	onMessageCallback = callback;
}
