import { createServer } from 'net';

const port = 4000;

let server;
let clients = [];
let onMessageCallback = (msg) => {};
let onResetCallback = () => {};
let onForceUpdateCallback = () => {};

export function startCommunication() {
	if (server) return;

	server = createServer();

	server.on('error', (err) => console.log('ERROR:' + err));
	server.on('close', () => console.log('Communication channel is offline'));
	server.on('connection', (client) => {
		console.log('Client connected');
		const id = clients.length;
		clients.push(client);
		onForceUpdateCallback();

		client.on('close', () => {
			console.log('Client disconnected');
			clients.splice(id, 1);
			if (clients.length == 0) onResetCallback();
		});
		client.on('data', (data) => {
			let msg = data.toString().replaceAll('{', '={').split('=');
			msg.shift();
			msg.forEach((m) => onMessageCallback(m));
		});
	});
	server.listen(port, () => console.log('Communication channel is online'));
}

export function stopCommunication() {
	server.close();
}

/**
 * Send a message to all connected clients
 * @param {string} msg
 */
export function send(msg) {
	for (const client of clients) {
		client.write(msg);
	}
}

/**
 * Register a callback for incoming messages
 * @param {(msg: string) => void} callback
 */
export function onMessage(callback) {
	onMessageCallback = callback;
}

/**
 * Register a callback for client exit
 * @param {() => void} callback
 */
export function onClientExit(callback) {
	onResetCallback = callback;
}

/**
 * Register a callback for force update
 * @param {() => void} callback
 */
export function onForceUpdate(callback) {
	onForceUpdateCallback = callback;
}
