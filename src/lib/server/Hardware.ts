import { ChildProcess, fork } from 'child_process';
import { DIR, IS_PI } from '$env/static/private';
import { join } from 'path';

const isPI = IS_PI == 'true';
let hardware: ChildProcess;

export default () => {
	if (!isPI) return;
	hardware = fork(join(DIR, 'hardware/build/boot.js'));

	hardware.on('message', (msg) => {
		console.log(msg);
	});

	hardware.send('Nice');
};

export function send(msg: string) {
	hardware.send(msg);
}
