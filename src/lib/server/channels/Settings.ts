import type { DisplayData, HardwareLight, MusicData } from '$lib/Types';
import { exec } from 'child_process';
import { checkMusicSetting } from './Sound';
import { send } from '../Hardware';

export function checkSettings(settings: DisplayData['settings'], music: MusicData) {
	checkMusicSetting(settings, music);
	checkLight(settings);
}

export function shutdown() {
	console.log('Shutting down...');
	exec('poweroff');
}

export function checkLight(settings: DisplayData['settings']) {
	const light_setting = settings.find((s) => s.name == 'car_light');
	if (!light_setting) return
	const data: HardwareLight = {
		type: 'light',
		status: light_setting.status ? 'on' : 'off'
	}
	send(JSON.stringify(data))
}
