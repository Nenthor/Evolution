<script lang="ts">
	import Navbar from '$lib/Navbar.svelte';
	import SocketClient from '$lib/SocketClient';
	import Battery from '$lib/display/Battery.svelte';
	import Footer from '$lib/display/Footer.svelte';
	import Settings from '$lib/display/Settings.svelte';
	import Speed from '$lib/display/Speed.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { displayStore, musicStore } from '$lib/Store';
	import type { PageData } from './$types';

	export let data: PageData;
	let display_socket: SocketClient, music_socket: SocketClient;
	let container: HTMLDivElement;

	$: display = $displayStore;

	onMount(() => {
		displayStore.set(JSON.parse(data.display));
		musicStore.set(JSON.parse(data.music));

		display_socket = new SocketClient('display', data.socket_port);
		display_socket.onMessage((message) => displayStore.set(JSON.parse(message)));

		music_socket = new SocketClient('music', data.socket_port);
		music_socket.onMessage((message) => musicStore.set(JSON.parse(message)));

		let offset = 75 + 50;
		container.style.height = `${window.innerHeight - offset}px`;

		window.addEventListener('resize', () => {
			container.style.height = `${window.innerHeight - offset}px`;
		});
	});

	onDestroy(() => {
		if (display_socket) display_socket.close();
		if (music_socket) music_socket.close();
	});

	function onShutdownButton(shutdown: boolean) {
		let shutdown_index = display.settings.findIndex((s) => s.name == 'shutdown');
		if (shutdown_index == -1) return;

		// Update store
		display.settings[shutdown_index].status = false;
		displayStore.set(display);

		//Send to server
		if (!display_socket) return;
		display_socket.send(`settings=${JSON.stringify(display.settings)}`);
		if (shutdown) display_socket.send('shutdown');
	}
</script>

<Navbar>
	<li><a href="/music">Musik</a></li>
	<li><a href="/camera">Kamera</a></li>
	<li><a href="/map">Karte</a></li>
</Navbar>

<div class="container" bind:this={container}>
	<Settings {display_socket} />
	<Speed />
	<Battery />
	{#if display.settings.find((s) => s.name == 'shutdown')?.status}
		<div class="shutdown">
			<p>Wollen Sie das System herunterfahren?</p>
			<ul>
				<button class="shutdown_button yes" on:click={() => onShutdownButton(true)}>Ja</button>
				<button class="shutdown_button no" on:click={() => onShutdownButton(false)}>Nein</button>
			</ul>
		</div>
	{/if}
</div>

<Footer />

<style>
	.container {
		position: relative;
		margin-top: 75px;
		height: calc(100vh - (75px + 50px));
		width: 100%;
		display: grid;
		grid-template-columns: 1fr 2fr 1fr;
		gap: 20px;
		overflow: hidden;
	}

	.shutdown {
		position: absolute;
		height: min(90%, 400px);
		width: min(90%, 750px);
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 99;
		border-radius: 75px;
		background-color: rgba(64, 64, 64, 0.85);
		-webkit-backdrop-filter: blur(5px);
		backdrop-filter: blur(5px);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		border: 5px solid #0d85d4;
		overflow: hidden;
	}

	.shutdown > p {
		text-align: center;
		font-size: min(4vw, 2rem);
		font-weight: bold;
		margin-bottom: min(75px, 7vh);
	}

	.shutdown > ul {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: min(100%, 500px);
	}

	.shutdown_button {
		width: 200px;
		height: 60px;
		border-radius: 30px;
		border: transparent;
		cursor: pointer;
		font-size: 1.5rem;
		font-weight: bold;
		color: white;
	}

	.yes {
		background-color: #32cd32;
	}

	.no {
		background-color: #cd3232;
	}
</style>
