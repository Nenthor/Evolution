import type { DisplayData, MusicData } from '$lib/Types';
import { exec } from 'child_process';
import { checkMusicSetting } from './Sound';
import { Light } from '../Gpio';
import pinlayout from '../data/pinlayout.json' assert { type: 'json' };
import { IS_PI } from '$env/static/private';

const isPi = IS_PI == 'true';
let light: Light;

export default function start() {
	if (!isPi) return;
	light = new Light(pinlayout.LIGHTS);
	console.log('Light is online');
}

export function checkSettings(settings: DisplayData['settings'], music: MusicData) {
	checkMusicSetting(settings, music);
	if (isPi) checkLight(settings);
}

export function shutdown() {
	console.log('Shutting down...');
	exec('poweroff');
}

function checkLight(settings: DisplayData['settings']) {
	const light_setting = settings.find((s) => s.name == 'car_light');
	if (light_setting) light_setting.status ? light.on() : light.off();
}
