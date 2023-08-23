import { Light } from './Gpio.js';

console.log('Hardware is online.');

process.on('message', (msg) => {
	console.log('Console' + msg);
	process.send('HEY: ' + msg);
});

const light = new Light(12);

light.on();

setTimeout(() => {
	light.off();
}, 1000);
