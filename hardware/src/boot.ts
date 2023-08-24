import { onMessage, startCommunication } from './Communication.js';
import Light, { light } from './Light.js';
import Camera from './Camera.js';

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

startCommunication();
