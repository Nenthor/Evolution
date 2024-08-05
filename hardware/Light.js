import pinlayout from '../src/lib/server/data/pinlayout.json' assert { type: 'json' };
import { Light } from './Gpio.js';

export let light;
export default () => {
	if (light) return;
	light = new Light(pinlayout.LIGHTS);
	console.log('Light is online');
};
