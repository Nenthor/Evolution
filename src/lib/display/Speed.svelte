<script lang="ts">
	import Speedometer from './Speedometer.svelte';
</script>

<div class="container">
	<div class="frame">
		<div class="placeholder" />
		<Speedometer />
	</div>
</div>

<style>
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.frame {
		position: relative;
		aspect-ratio: 1 / 1;
		height: min(60vmin, 500px);
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #323232;
		border-radius: 50% 50% 50px 50px;
		z-index: 2;
	}

	.placeholder {
		position: absolute;
		aspect-ratio: 1 / 1;
		width: 95.5%;
		background-color: black;
		border-radius: 50%;
		z-index: 1;
	}
</style>
