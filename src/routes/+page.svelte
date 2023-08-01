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
</div>

<Footer />

<style>
	.container {
		margin-top: 75px;
		height: calc(100vh - (75px + 50px));
		width: 100%;
		display: grid;
		grid-template-columns: 1fr 2fr 1fr;
		gap: 20px;
		overflow: hidden;
	}
</style>
