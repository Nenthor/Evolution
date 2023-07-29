<script lang="ts">
	import { displayStore } from '$lib/Store';
	import { onMount } from 'svelte';

	$: data = $displayStore;

	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;
	let speedGradient: CanvasGradient;
	let is_ready = false;

	$: data.speed, update();
	$: data.reverse, update();

	onMount(() => {
		canvas.width = 500;
		canvas.height = 500;

		let pre_context = canvas.getContext('2d');
		if (pre_context) {
			context = pre_context;
		}

		speedGradient = context.createLinearGradient(0, 500, 0, 0);
		speedGradient.addColorStop(0, '#3232CD');
		speedGradient.addColorStop(1, '#64b9ff');

		is_ready = true;
		update();
		document.fonts.ready.then(update);
	});

	let current_speed = -1;
	function update() {
		if (current_speed == data.speed) return;
		if (is_ready) drawSpeedo(data.speed, 40);
	}

	function speedNeedle(rotation: number) {
		context.lineWidth = 3;

		context.save();
		context.translate(250, 250);
		context.rotate(rotation);
		context.strokeStyle = '#41dcf4';
		context.strokeRect(105, -0.5, 135, 1);
		context.restore();
	}

	function drawMiniNeedle(rotation: number, width: number, speed: number | string) {
		context.lineWidth = width;

		context.save();
		context.translate(250, 250);
		context.rotate(rotation);
		context.strokeStyle = '#333';
		context.fillStyle = '#333';
		context.strokeRect(210, -0.5, 20, 1);
		context.restore();

		let x = 250 + 180 * Math.cos(rotation);
		let y = 250 + 180 * Math.sin(rotation);

		context.font = '25px Comfortaa';
		context.fillText(speed.toString(), x, y);
	}

	function calculateSpeedAngle(x: number, a: number, b: number) {
		let degree = (a - b) * x + b;
		let radian = (degree * Math.PI) / 180;
		return radian;
	}

	function drawSpeedo(speed: number, topSpeed: number) {
		if (speed == undefined || topSpeed == undefined) return false;

		speed = Math.round(speed);

		//Clear
		context.clearRect(0, 0, canvas.width, canvas.height);

		//Background
		context.beginPath();
		context.fillStyle = '#000';
		context.arc(250, 250, 240, 0, 2 * Math.PI);
		context.fill();

		//Outer-Ring
		context.beginPath();
		context.strokeStyle = '#555';
		context.lineWidth = 1;
		context.arc(250, 250, 240, 0, 2 * Math.PI);
		context.stroke();

		//Middle Number
		context.fillStyle = '#FFF';
		context.font = 'bold 100px Comfortaa';
		context.textAlign = 'center';
		context.fillText(speed.toString(), 250, 290);

		//Reverse Gear
		context.font = '40px Comfortaa';
		if (!data.reverse) {
			context.fillStyle = '#333';
			context.fillText('R', 250, 460);
		} else {
			context.fillStyle = '#CD3232';
			context.fillText('R', 250, 460);
		}

		//Speed Numbers
		context.fillStyle = '#FFF';
		for (var i = 0; i <= topSpeed; i += 2.5) {
			//var rotation = calculateSpeedAngle(i / topSpeed, 83.07888, 34.3775) * Math.PI;
			var rotation = calculateSpeedAngle(i / topSpeed, 127, 45) * Math.PI;
			drawMiniNeedle(rotation, i % 5 == 0 ? 3 : 1, i % 5 == 0 ? i : '');
		}

		//Blur
		context.beginPath();
		context.lineWidth = 25;
		context.shadowBlur = 20;
		context.shadowColor = '#00c6ff';
		context.stroke();

		//Speed Limiter
		if (speed > topSpeed) {
			speed = topSpeed;
		}

		//SpeedBar
		context.beginPath();
		context.strokeStyle = speedGradient;
		context.arc(
			250,
			250,
			228,
			0.782 * Math.PI,
			calculateSpeedAngle(speed / topSpeed, 127, 45) * Math.PI
		);
		context.stroke();

		//SpeedNeedle
		speedNeedle(calculateSpeedAngle(speed / topSpeed, 127, 45) * Math.PI);
		context.shadowBlur = 0;

		//Inner-Ring
		context.beginPath();
		context.strokeStyle = '#555';
		context.lineWidth = 10;
		context.arc(250, 250, 100, 0, 2 * Math.PI);
		context.stroke();
	}
</script>

<canvas class="speedometer" bind:this={canvas} />

<style>
	.speedometer {
		max-height: 100%;
		max-width: 100%;
		z-index: 3;
	}
</style>
