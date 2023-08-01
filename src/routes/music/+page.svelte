<script lang="ts">
	import Navbar from '$lib/Navbar.svelte';
	import { musicStore, displayStore } from '$lib/Store';
	import { onMount, onDestroy } from 'svelte';
	import SocketClient from '$lib/SocketClient';
	import type { PageData } from './$types';
	import type { DisplayData } from '$lib/Types';

	export let data: PageData;
	let music_socket: SocketClient;
	let display_socket: SocketClient;
	let container: HTMLDivElement;

	$: music = $musicStore;
	$: display = $displayStore;

	onMount(() => {
		musicStore.set(JSON.parse(data.music));
		displayStore.set(JSON.parse(data.display));

		music_socket = new SocketClient('music', data.socket_port);
		music_socket.onMessage((message) => musicStore.set(JSON.parse(message)));

		display_socket = new SocketClient('display', data.socket_port);
		display_socket.onMessage((message) => displayStore.set(JSON.parse(message)));

		let offset = 75;
		container.style.height = `${window.innerHeight - offset}px`;

		window.addEventListener('resize', () => {
			container.style.height = `${window.innerHeight - offset}px`;
		});
	});

	onDestroy(() => {
		if (music_socket) music_socket.close();
	});

	$: setSliderVolume(music.volume, display.settings);

	function setMusic(index: number) {
		if (music.current_song == index) music.current_song = -1;
		else music.current_song = index;

		musicStore.set(music);
		if (music_socket) music_socket.send(`music=${JSON.stringify(music)}`);
	}

	const steps = 3;
	const volume_images: { [index: number]: HTMLImageElement } = {};
	let max = 100;
	let min = 0;
	let slider: HTMLInputElement;

	onMount(() => {
		setSliderVolume(music.volume, display.settings);
		slider.addEventListener('input', () =>
			setSliderVolume(parseInt(slider.value), display.settings)
		);
		preloadVolumeImages();
	});

	function setSliderVolume(value: number, settings: DisplayData['settings']) {
		if (!slider) return;

		let img_i = 0;
		let music_setting = settings.find((s) => s.name == 'music');
		if (value != 0 && music.current_song != -1 && music_setting?.status) {
			for (let i = 1; i <= steps; i++) {
				if ((value - min) / (max - min) <= i / steps) {
					img_i = i;
					break;
				}
			}
		}

		try {
			slider.style.setProperty('--img', `url(${volume_images[img_i].src})`);
		} catch (error) {
			slider.style.setProperty('--img', `url('/images/sound/${img_i}.webp')`);
		}

		slider.value = value.toString();
		if (music.volume != value) {
			music.volume = value;
			musicStore.set(music);
			if (music_socket) music_socket.send(`music=${JSON.stringify(music)}`);
		}
	}

	function getRandomSong() {
		return Math.floor(Math.random() * music.songs.length);
	}

	function preloadVolumeImages() {
		for (let i = 0; i <= steps; i++) {
			let img = new Image();
			img.onload = () => (volume_images[i] = img);
			img.src = `/images/sound/${i}.webp`;
		}
	}
</script>

<Navbar>
	{#if music.current_song == -1}
		<li>
			<a href="/music?play" on:click|preventDefault={() => setMusic(getRandomSong())}>Play</a>
		</li>
	{:else}
		<li><a href="/music?stop" on:click|preventDefault={() => setMusic(-1)}>Stopp</a></li>
	{/if}
	<li><a href="/">Zurück</a></li>
</Navbar>

<div class="container" bind:this={container}>
	<div class="volume">
		<input type="range" {min} {max} value={music.volume} class="slider" bind:this={slider} />
	</div>
	<ul class="list">
		{#each music.songs as song, i}
			<button class="song {i == music.current_song ? 'selected' : ''}" on:click={() => setMusic(i)}>
				<div class="img" style="background-image: url({song.img});" />
				<span class="title">{song.title}</span>
			</button>
		{/each}
	</ul>
</div>

<style>
	:root {
		--img: url('/images/sound/2.webp');
	}

	.container {
		margin-top: 75px;
		height: calc(100vh - 75px);
		width: 100%;
		color: white;
	}

	.volume {
		width: 100%;
		height: 50px;
		padding: 10px 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #323232;
	}

	.slider {
		-webkit-appearance: none;
		appearance: none;
		width: clamp(100px, 90%, 500px);
		height: 50%;
		border-radius: 25px;
		outline: transparent;
		background-image: linear-gradient(to right, #3242cd, #45adf3);
		border: 2px solid white;
	}

	.slider::-webkit-slider-thumb {
		aspect-ratio: 1 / 1;
		-webkit-appearance: none;
		appearance: none;
		height: 50px;
		border: 5px solid white;
		background: white;
		cursor: pointer;
		border-radius: 50%;
		background-image: var(--img);
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
	}

	.slider::-moz-range-thumb {
		width: clamp(50px, 10%, 100px);
		height: 25px;
		background: #4596f3;
		cursor: pointer;
		border-radius: 25px;
	}

	.list {
		padding: 0 10px;
		height: calc(100% - 60px - 20px);
		width: calc(100% - 30px);
		list-style: none;
		overflow-y: auto;
		border: 5px solid #4596f3;
	}

	.song {
		width: 100%;
		height: 100px;
		background-color: #646464;
		margin: 10px 0;
		border-radius: 50px;
		display: flex;
		align-items: center;
		cursor: pointer;
		overflow: hidden;
		border: transparent;
	}

	.song:first-child {
		margin-top: 5px;
	}

	.song:last-child {
		margin-bottom: 5px;
	}

	.selected {
		background-color: #2b2;
	}

	.img {
		min-width: min(200px, 30vw);
		height: 100%;
		margin-right: 20px;
		background-size: cover;
		background-repeat: no-repeat;
		background-position: center;
	}

	.title {
		font-size: min(1.5rem, 7vw);
		text-align: center;
		color: white;
		margin-right: 20px;
	}
</style>
