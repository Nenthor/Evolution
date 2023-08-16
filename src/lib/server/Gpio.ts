import { Gpio as GPIO } from 'pigpio';

export class DistanceSensor {
	private id;
	private trigger;
	private echo;
	private interval;

	private MICROSECDONDS_PER_CM = 1e6 / 34321;
	private filter: number[] = [];

	constructor(
		id: number,
		trigger: number,
		echo: number,
		callback = (id: number, distance: number) => {},
		delay = 60,
		filter_level = 5
	) {
		this.id = id;
		this.trigger = new GPIO(trigger, { mode: GPIO.OUTPUT });
		this.echo = new GPIO(echo, { mode: GPIO.INPUT, alert: true });

		//Default trigger to LOW
		this.trigger.digitalWrite(0);

		//Measure distance
		let start_tick: number;
		this.echo.on('alert', (level, tick) => {
			if (level == 1) start_tick = tick;
			else {
				let delta = (tick >> 0) - (start_tick >> 0);
				let distance = delta / (2 * this.MICROSECDONDS_PER_CM);
				this.filter.push(distance);

				if (this.filter.length >= filter_level) {
					let median = this.getMedian(this.filter);
					callback(this.id, Math.round(median));
					this.filter.splice(0);
				}
			}
		});

		this.interval = setInterval(() => {
			// Set trigger to HIGH for 10μs
			this.trigger.trigger(10, 1);
		}, delay);
	}

	public getID() {
		return this.id;
	}

	public clear() {
		clearInterval(this.interval);
		this.echo.removeAllListeners('alert');
		this.trigger.digitalWrite(0);
	}

	private getMedian(array: number[]) {
		if (array.length == 0) throw new Error('No Filter values');

		array.sort((a, b) => a - b);
		let half = Math.floor(array.length / 2);

		if (array.length % 2) return array[half];
		else return (array[half - 1] + array[half]) / 2;
	}
}

export class Light {
	private light;

	constructor(pin: number, default_state: 0 | 1 = 0) {
		this.light = new GPIO(pin, { mode: GPIO.OUTPUT });
		this.light.digitalWrite(default_state);
	}

	public switch() {
		let state = this.light.digitalRead();
		state == 0 ? this.on() : this.off();
	}

	public on() {
		this.light.digitalWrite(1);
	}

	public off() {
		this.light.digitalWrite(0);
	}
}
