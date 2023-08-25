import { onClientExit, onMessage, startCommunication, stopCommunication } from './Communication.js';
import Light, { light } from './Light.js';
import Camera from './Camera.js';
import { exit } from 'process';

//Enable channels
Light();
Camera();

onMessage((message) => {
	const msg = message.split('=');

	switch (msg[0]) {
		case 'light':
			if (msg[1] == 'on') light.on();
			else light.off();
			break;
		default:
			console.log(`Message key not defined: ${msg[0]}`);
			break;
	}
});

//Cleanup on client exit
onClientExit(cleanup);

//Cleanup on exit
['SIGINT', 'SIGTERM'].forEach((signal) => {
	process.on(signal, () => {
		cleanup(true)
		setTimeout(() => {
			process.exit(0)
		}, 300);
	});
});

function cleanup(force = false) {
	light.off();
	if(force) stopCommunication();
}

startCommunication();
