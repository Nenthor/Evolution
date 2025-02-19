import { Server as ioServer } from 'socket.io';
import { createServer as createHttpServer } from 'http';
import { dev } from '$app/environment';
import { SOCKET_PORT_DEV as DEV_PORT, SOCKET_PORT_PROD as PROD_PORT } from '$env/static/private';

export const channels = ['display', 'music', 'camera', 'map'] as const;
export type Channel = (typeof channels)[number];

let server: ioServer;
let callback = (message: string) => {};

export function start() {
	if (server) return;

	const http_server = createHttpServer().listen(dev ? DEV_PORT : PROD_PORT);
	server = new ioServer(http_server, {
		cors: { origin: '*' }
	});
	console.log('Websocket-Server is online');

	server.on('connection', (socket) => {
		socket.on('join', (room: string) => {
			if (!room || !isChannelType(room)) return;

			socket.join(room);
			socket.on('message', callback);
		});
	});
}

export function close() {
	if (server) server.close();
}

export function send(channel: Channel, message: string) {
	if (server) server.to(channel).emit('message', message);
}

export function onMessage(new_callback: (message: string) => void) {
	callback = new_callback;
}

function isChannelType(check: string): check is Channel {
	for (const channel of channels) if (channel == check) return true;
	return false;
}
