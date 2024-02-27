<script lang="ts">
	import { displayStore, musicStore } from '$lib/Store';
	import type { DisplayData } from '$lib/Types';

	$: data = $displayStore;
	$: music = $musicStore;

	function getCurrentSong(current_song: number, data: DisplayData) {
		if (current_song != -1 && data.settings.find((s) => s.name == 'music')?.status)
			return music.songs[current_song].title;
		else return '-';
	}
</script>

<div class="container">
	<div class="text_box">
		<div class="title">Musik</div>
		<div class="text">{getCurrentSong(music.current_song, data)}</div>
	</div>
	<div class="text_box">
		<div class="title">Koordinaten</div>
		<div class="text">{data.coords_txt}</div>
	</div>
	<div class="text_box">
		<div class="title">Verbindung</div>
		<div class="text">{data.connection_quality}</div>
	</div>
</div>

<style>
	.container {
		width: calc(100% - 20px);
		height: 50px;
		padding: 0 10px;
		background-color: white;
		border-top-left-radius: 40px;
		border-top-right-radius: 40px;
		text-align: center;
		display: grid;
		grid-template-columns: 2fr 3fr 2fr;
		gap: 20px;
		overflow: hidden;
	}

	.text_box {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		line-height: normal;
		
	}

	.title {
		font-weight: bold;
		font-size: clamp(0.5rem, 3vw, 1rem);
	}

	.text {
		font-size: clamp(0.5rem, 1.75vw, 1rem);
		white-space: nowrap;
	}
</style>
