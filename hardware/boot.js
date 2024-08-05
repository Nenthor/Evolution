import Camera, { cleanup as cameraCleanup, forceUpdate as forceUpdateCamera } from './Camera.js';
import {
	onClientExit,
	onForceUpdate,
	onMessage,
	startCommunication,
	stopCommunication
} from './Communication.js';
import Compass, { cleanup as compassCleanup } from './Compass.js';
import GPS, { forceUpdate as forceUpdateGPS } from './Gps.js';
import Light, { light } from './Light.js';

//Enable channels
Light();
Camera();
GPS();
Compass();

onMessage((msg) => {
	let data = JSON.parse(msg);
	if (!data) throw Error('Message has not the right format');

	switch (data.type) {
		case 'light':
			data.status == 'on' ? light.on() : light.off();
			break;
		default:
			console.log(`Message key not defined: ${msg[0]}`);
			break;
	}
});

onForceUpdate(() => {
	forceUpdateGPS();
	forceUpdateCamera();
});

//Cleanup on client exit
onClientExit(cleanup);

//Cleanup on exit
['SIGINT', 'SIGTERM'].forEach((signal) => {
	process.on(signal, () => {
		cleanup(true);
		setTimeout(() => {
			process.exit(0);
		}, 300);
	});
});

function cleanup(force = false) {
	light.off();
	cameraCleanup();
	compassCleanup();
	if (force) stopCommunication();
}

startCommunication();
