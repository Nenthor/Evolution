import type { Socket, Server } from 'net';
import { createServer } from 'net';

const port = 4000;
let server: Server;
let clients: Socket[] = [];
let onMessageCallback = (msg: string) => {};
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
		onForceUpdateCallback()

		client.on('close', () => {
			console.log('Client disconnected');
			clients.splice(id, 1);
			if (clients.length == 0) onResetCallback();
		});
		client.on('data', (data) => {
			let msg = data.toString().replaceAll('{', '={').split('=')
			msg.shift()
			msg.forEach((m) => onMessageCallback(m))
		});
	});
	server.listen(port, () => console.log('Communication channel is online'));
}

export function stopCommunication() {
	server.close();
}

export function send(msg: string) {
	for (const client of clients) {
		client.write(msg);
	}
}

export function onMessage(callback: (msg: string) => void) {
	onMessageCallback = callback;
}

export function onClientExit(callback: () => void) {
	onResetCallback = callback;
}

export function onForceUpdate(callback: () => void) {
	onForceUpdateCallback = callback;
}
