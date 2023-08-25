import ioClient from 'socket.io-client';
import type { Channel } from '$lib/server/SocketServer';

export default class SocketClient {
	private socket;

	constructor(channel: Channel, port: string) {
		this.socket = ioClient(`${window.location.hostname}:${port}`);
		this.socket.on('connect', () => this.socket.emit('join', channel))
	}

	public close() {
		if (this.socket.connected) this.socket.close();
	}

	public send(message: string) {
		this.socket.emit('message', message);
	}

	public onMessage(callback: (message: string) => void) {
		this.socket.on('message', callback);
	}
}
