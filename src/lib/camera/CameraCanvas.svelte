<script lang="ts">
	import { cameraStore } from '$lib/Store';
	import { onMount } from 'svelte';

	$: data = $cameraStore;

	//Draw Camera
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let width: number, height: number;
	let middleX: number, middleY: number;

	const angels = [190, 235, 305, 350],
		radius = [0.4, 0.7, 1.0],
		emptyColor = '#aaa',
		obstacleColor = '#cd3232';

	onMount(() => {
		const ctx_new = canvas.getContext('2d');
		if (ctx_new) ctx = ctx_new;

		update();

		window.addEventListener('resize', () => update);
	});

	function update() {
		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;

		width = canvas.width;
		height = canvas.height;

		middleX = width / 2;
		middleY = height - width / 15;

		drawCamera();
	}

	function drawCamera() {
		ctx.clearRect(0, 0, width, height);
		//Boxes
		for (let column = 0; column < 3; column++) {
			for (let row = 2; row >= 0; row--) {
				drawBox(
					getColor(column, row),
					angels[column] - column,
					angels[column + 1] - column,
					radius[row] * middleY
				);
			}
		}

		//Middle Circle
		ctx.fillStyle = '#0d85d4';
		ctx.beginPath();
		ctx.arc(width / 2, middleY, width / 15, 0, 2 * Math.PI, true);
		ctx.fill();
	}

	function drawBox(color: string, startAngle: number, endAngle: number, radius: number) {
		ctx.fillStyle = color;
		ctx.strokeStyle = '#fff';
		ctx.lineWidth = 2.25;
		ctx.beginPath();
		startAngle *= Math.PI / 180;
		endAngle *= Math.PI / 180;
		ctx.moveTo(middleX, middleY);
		ctx.arc(middleX, middleY, radius, startAngle, endAngle, false);
		ctx.fill();
		ctx.stroke();

		ctx.lineTo(middleX, middleY);
		ctx.stroke();
	}

	function getColor(column: number, row: number) {
		if (data.obstacles[column] * -1 + 2 < row) return obstacleColor;
		return emptyColor;
	}
</script>

<canvas class="canvas" bind:this={canvas} />

<style>
	.canvas {
		width: 100%;
		height: 100%;
	}
</style>
