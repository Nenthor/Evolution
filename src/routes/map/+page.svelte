<script lang="ts">
	import Navbar from '$lib/Navbar.svelte';
	import { mapStore } from '$lib/Store';
	import MapCanvas from '$lib/map/MapCanvas.svelte';
	import { onDestroy, onMount } from 'svelte';
	import SocketClient from '$lib/SocketClient';
	import type { PageData } from './$types';

	export let data: PageData;
	let map_socket: SocketClient;
	let container: HTMLDivElement;
	let pass_data: {
		map_socket: SocketClient;
		mobileHeightFix: () => void;
	};

	$: map = $mapStore;

	onMount(() => {
		mapStore.set(JSON.parse(data.map));

		map_socket = new SocketClient('map', data.socket_port);
		map_socket.onMessage((message) => mapStore.set(JSON.parse(message)));

		let offset = 75 + 12;
		container.style.height = `${window.innerHeight - offset}px`;

		function mobileHeightFix() {
			container.style.height = `${window.innerHeight - offset}px`;
		}

		pass_data = { map_socket, mobileHeightFix };
	});

	// Dots animation
	$: setWaitingAnimation(map.hasLocation);
	let dots = '';
	let interval: NodeJS.Timer | null;

	function setWaitingAnimation(hasLocation: boolean) {
		if (!hasLocation) {
			interval = setInterval(() => {
				if (dots == '...') dots = '';
				else dots += '.';
			}, 500);
		} else {
			if (interval) clearInterval(interval);
			interval = null;
		}
	}

	//Needle Rotation
	function getRotation(deg: number) {
		return deg - 45;
	}

	//cleanup
	onDestroy(() => {
		if (interval) clearInterval(interval);
		if (map_socket) map_socket.close();
	});
</script>

<Navbar>
	<li><a href="/">Zurück</a></li>
</Navbar>

<div class="container" bind:this={container}>
	<p class="placeholder {map.hasLocation ? 'off' : 'on'}">Lokalisieren{dots}</p>
	<img
		class="needle {map.hasLocation ? 'on' : 'off'}"
		src="/images/needle.webp"
		alt="Hier"
		draggable="false"
		style="transform: rotate({getRotation(map.rotation)}deg)"
	/>
	<MapCanvas {pass_data} />
</div>

<style>
	.container {
		position: relative;
		margin-top: 75px;
		height: calc(100vh - (75px + 12px));
		width: calc(100% - 12px);
		border: solid 6px #0d85d4;
		overflow: hidden;
	}

	.placeholder {
		position: absolute;
		font-family: roboto;
		font-size: min(2rem, 8vw);
		font-weight: bold;
		width: 100%;
		line-height: 50px;
		top: calc(50% - 25px);
		text-align: center;
		z-index: -1;
	}

	.needle {
		aspect-ratio: 1 / 1;
		width: 32px;
		position: absolute;
		left: calc(50% - 16px);
		top: calc(50% - 16px);
		filter: saturate(1.5);
		transition: transform ease 0.3s;
	}

	.on {
		display: block;
	}

	.off {
		display: none;
	}
</style>
