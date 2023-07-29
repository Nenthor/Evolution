<script lang="ts">
	import type SocketClient from '$lib/SocketClient';
	import { displayStore } from '$lib/Store';

	export let display_socket: SocketClient;

	$: data = $displayStore;

	function getStatusString(status: boolean) {
		return status ? 'on' : 'off';
	}

	function onClick(index: number) {
		data.settings[index].status = !data.settings[index].status;
		displayStore.set(data);
		if (display_socket) display_socket.send(`settings=${JSON.stringify(data.settings)}`);
	}
</script>

<div class="container">
	<ul class="settings">
		{#each data.settings as setting, i}
			<button class="button" on:click={() => onClick(i)}>
				<div class="image {getStatusString(setting.status)}" id={setting.name} />
			</button>
		{/each}
	</ul>
</div>

<style>
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.settings {
		aspect-ratio: 1 / 4;
		height: min(80%, 490px);
		padding: 5px;
		background-color: #666;
		border-radius: 60px;
		list-style-type: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-evenly;
	}

	.button {
		aspect-ratio: 1 / 1;
		height: calc(25% - 5px);
		flex-grow: 1;
		background-color: white;
		border: transparent;
		margin: 5px 0;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.image {
		aspect-ratio: 1 / 1;
		width: clamp(75%, 80px, 90%);
		background-repeat: no-repeat;
		background-size: contain;
		transition: filter 0.2s linear;
	}

	#music {
		background-image: url('/images/music.webp');
	}

	#car_light {
		background-image: url('/images/car_light.webp');
	}

	#remote_controll {
		background-image: url('/images/remote_controll.webp');
	}

	#shutdown {
		filter: none;
		width: 100%;
		background-color: #cd3232;
		background-image: url('/images/shutdown.webp');
	}

	.on {
		filter: grayscale(0%);
	}

	.off {
		filter: grayscale(100%);
	}
</style>
