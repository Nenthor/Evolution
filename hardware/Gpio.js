import { Gpio as GPIO } from 'pigpio';

/**
 * Class for Distance Sensor
 * @param id - ID of the sensor
 * @param trigger - Trigger pin
 * @param echo - Echo pin
 * @param callback - Callback function for distance measurement
 * @param delay - Delay between measurements
 * @param filter_level - Number of measurements to filter
 */
export class DistanceSensor {
	id;
	trigger;
	echo;
	interval;

	MICROSECDONDS_PER_CM = 1e6 / 34321;
	filter = [];

	constructor(id, trigger, echo, callback = (id, distance) => {}, delay = 60, filter_level = 5) {
		this.id = id;
		this.trigger = new GPIO(trigger, { mode: GPIO.OUTPUT });
		this.echo = new GPIO(echo, { mode: GPIO.INPUT, alert: true });

		//Default trigger to LOW
		this.trigger.digitalWrite(0);

		//Measure distance
		let start_tick;
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

	getID() {
		return this.id;
	}

	clear() {
		clearInterval(this.interval);
		this.echo.removeAllListeners('alert');
		this.trigger.digitalWrite(0);
	}

	getMedian(array) {
		if (array.length == 0) throw new Error('No Filter values');

		array.sort((a, b) => a - b);
		let half = Math.floor(array.length / 2);

		if (array.length % 2) return array[half];
		else return (array[half - 1] + array[half]) / 2;
	}
}

/**
 * Class for Light
 * @param pin - Pin number
 * @param default_state - Default state of the light
 */
export class Light {
	light;

	constructor(pin, default_state = 0) {
		this.light = new GPIO(pin, { mode: GPIO.OUTPUT });
		this.light.digitalWrite(default_state);
	}

	switch() {
		let state = this.light.digitalRead();
		state == 0 ? this.on() : this.off();
	}

	on() {
		this.light.digitalWrite(1);
	}

	off() {
		this.light.digitalWrite(0);
	}
}
