<script lang="ts">
	import Navbar from '$lib/Navbar.svelte';
	import CameraCanvas from '$lib/camera/CameraCanvas.svelte';
	import { onMount, onDestroy } from 'svelte';
	import SocketClient from '$lib/SocketClient';
	import type { PageData } from './$types';
	import { cameraStore } from '$lib/Store';

	export let data: PageData;
	let camera_socket: SocketClient;
	let container: HTMLDivElement;

	onMount(() => {
		cameraStore.set(JSON.parse(data.camera));

		camera_socket = new SocketClient('camera', data.socket_port);
		camera_socket.onMessage((message) => cameraStore.set(JSON.parse(message)));

		let offset = 75;
		container.style.height = `${window.innerHeight - offset}px`;

		window.addEventListener('resize', () => {
			container.style.height = `${window.innerHeight - offset}px`;
		});
	});

	onDestroy(() => {
		if (camera_socket) camera_socket.close();
	});
</script>

<Navbar>
	<li><a href="/">Zurück</a></li>
</Navbar>

<div class="container" bind:this={container}>
	<div class="frame">
		<CameraCanvas />
	</div>
</div>

<style>
	.container {
		margin-top: 75px;
		height: calc(100vh - 75px);
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.frame {
		aspect-ratio: 2 / 1;
		width: 100vmin;
		background-color: #323232;
		padding: 10px;
		border-radius: 20px;
		border: solid 5px #0d85d4;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
	}
</style>
