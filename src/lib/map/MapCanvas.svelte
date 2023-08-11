<script lang="ts">
	import type SocketClient from '$lib/SocketClient';
	import { mapStore } from '$lib/Store';
	import { onMount } from 'svelte';

	export let pass_data: { map_socket: SocketClient; mobileHeightFix: () => void };

	$: data = $mapStore;

	$: data, update();

	//Draw Camera
	const images: { x: number; y: number; image: HTMLImageElement }[] = [];

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let zoom = 1;

	//map canvas
	onMount(() => {
		const ctx_new = canvas.getContext('2d');
		if (ctx_new) ctx = ctx_new;

		update();
		window.addEventListener(
			'resize',
			() => {
				pass_data.mobileHeightFix();
				update();
			},
			{ passive: true }
		);

		window.addEventListener('wheel', (e) => {
			if (e.deltaY == 0) return;
			// >0 up | <0 down
			setZoom(-e.deltaY / 1000);
		});

		let old_dist = 0;
		canvas.addEventListener('touchend', () => (old_dist = 0));
		canvas.addEventListener('touchmove', (e) => {
			if (e.targetTouches.length != 2 || !pass_data.map_socket) return;

			let dist = Math.hypot(
				e.touches[0].pageX - e.touches[1].pageX,
				e.touches[0].pageY - e.touches[1].pageY
			);

			if (old_dist != 0) {
				let delta = dist - old_dist;

				if (delta >= 1 || delta <= -1) setZoom(delta / 500);
			}

			old_dist = dist;
		});
	});

	function update() {
		if (!canvas) return;
		if (data.hasLocation) {
			fix_dpi();
			displayMap();
			cleanup();
		} else unload();
	}

	function unload() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		images.splice(0, images.length);
	}

	function fix_dpi() {
		let dpi = window.devicePixelRatio;
		const canvas_element = document.getElementById('canvas');
		if (!canvas_element) return;

		let style_height = parseFloat(
			getComputedStyle(canvas_element).getPropertyValue('height').slice(0, -2)
		);
		let style_width = parseFloat(
			getComputedStyle(canvas_element).getPropertyValue('width').slice(0, -2)
		);

		canvas_element.removeAttribute('height');
		canvas_element.removeAttribute('width');
		canvas_element.setAttribute('height', `${style_height * dpi}`);
		canvas_element.setAttribute('width', `${style_width * dpi}`);
	}

	function displayMap() {
		if (!canvas || !data.hasLocation) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		let searches = [];

		for (let x = -1; x <= 1; x++) {
			for (let y = -1; y <= 1; y++) {
				let search = { x: data.imageX + x, y: data.imageY + y };

				if (x == 0 && y == 0) searches.unshift(search);
				else searches.push(search);
			}
		}

		//Search for cached images
		for (let search of searches) {
			let image = images.find((img) => img.x == search.x && img.y == search.y);
			if (image) {
				drawImage(image.image, image.x - data.imageX, image.y - data.imageY);
			} else loadGeoDataImage(search.x, search.y);
		}
	}

	function cleanup() {
		images.forEach((image, index) => {
			if (Math.abs(data.imageY - image.y) > 1 || Math.abs(data.imageX - image.x) > 1) {
				images.splice(index, 1);
			}
		});
	}

	function loadGeoDataImage(x: number, y: number) {
		if (x < 0 || y < 0 || x > 25 || y > 25) return;

		const image = new Image();
		image.src = `/images/navigation/geodata_${x}_${y}.webp`;

		image.onerror = () => console.warn(`Could not load geodata_${x}_${y}.webp.`);
		image.onload = () => {
			drawImage(image, x - data.imageX, y - data.imageY);

			for (const index in images) {
				const image = images[index];
				if (image.x == x && image.y == y) return;
			}
			images.push({ x: x, y: y, image: image });
		};
	}

	function drawImage(image: HTMLImageElement, x: number, y: number) {
		//drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)   pixelX=1455;pixelY=1355
		const scale = window.devicePixelRatio * zoom;

		let dx = x * image.width * scale - data.pixelX * scale + canvas.width / 2;
		let dy = y * image.width * scale - data.pixelY * scale + canvas.height / 2;

		ctx.drawImage(
			image,
			0, //sx
			0, //sy
			image.width, //sWidth
			image.width, //sHeight
			dx, //dx
			dy, //dy
			image.width * scale, //dWidth
			image.height * scale //dHeight
		);
	}

	function setZoom(change: number) {
		zoom = Math.min(2.5, Math.max(0.5, zoom + change));
		update();
	}
</script>

<svelte:head>
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
	/>
</svelte:head>

<div class="box">
	<canvas id="canvas" bind:this={canvas} />
	<div class="zoom">
		<button class="zoom_button" on:click={() => setZoom(0.4)}>+</button>
		<button class="zoom_button" on:click={() => setZoom(-0.4)}>-</button>
	</div>
</div>

<style>
	.box {
		width: 100%;
		height: 100%;
	}

	#canvas {
		width: 100%;
		height: 100%;
	}

	.zoom {
		position: absolute;
		bottom: 5px;
		right: 5px;
		height: 150px;
		width: 75px;
	}

	.zoom_button {
		background-color: white;
		height: 65px;
		width: 65px;
		margin: 5px;
		border: 2px solid #0d85d4;
		border-radius: 10px;
		cursor: pointer;
		color: #0d85d4;
		font-size: 3.5rem;
		font-weight: bold;
		font-family: comfortaa;
		transition: background-color 0.3s ease, color 0.3s ease;
	}

	.zoom_button:hover {
		background-color: #0d85d4;
		color: white;
	}
</style>
