import { Light } from './Gpio.js';
import pinlayout from '../../src/lib/server/data/pinlayout.json' assert { type: 'json' };

export let light: Light;
export default () => {
	if (light) return;
	light = new Light(pinlayout.LIGHTS);
	console.log('Light is online');
};
