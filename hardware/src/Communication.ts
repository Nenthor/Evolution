import { Socket, Server, createServer } from 'net';

const port = 4000;
let server: Server;
let clients: Socket[] = [];
let onMessageCallback = (msg: string) => {};

export function startCommunication() {
	if (server) return;

	server = createServer();

	server.on('error', (err) => console.log(err));
	server.on('close', () => console.log('Communication channel is offline'));
	server.on('connection', (client) => {
		console.log('Client connected');
		const id = clients.length;
		clients.push(client);

		client.on('close', () => {
			console.log('Client disconnected');
			clients.splice(id, 1);
		});
		client.on('data', (data) => {
			onMessageCallback(data.toString());
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
