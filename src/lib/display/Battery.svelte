<script lang="ts">
	import { displayStore } from '$lib/Store';

	$: data = $displayStore;
</script>

<div class="container">
	<div class="battery">
		<div class="inner_box">
			<div class="status" style="height: {data.battery}%;" />
		</div>
		<p class="percentage">{data.battery}%</p>
	</div>
</div>

<style>
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.battery {
		aspect-ratio: 3 / 5;
		max-width: 150px;
		width: 25vmin;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		padding: 10px 5px;
		background-color: #646464;
		border-radius: 30px;
	}

	.inner_box {
		margin: 10px 20px 5px 20px;
		padding: 5px;
		width: calc(100% - 30px);
		flex-grow: 1;
		border: 4px solid #161616;
		border-radius: 20px;
		overflow-y: hidden;
		display: flex;
		align-items: end;
	}

	.inner_box::after {
		content: '';
		position: absolute;
		width: 20%;
		height: 10px;
		top: 10px;
		left: calc(50% - 15px);
		background-color: #161616;
		border-top-left-radius: 5px;
		border-top-right-radius: 5px;
	}

	.status {
		background-image: linear-gradient(#97fdac, #02b647);
		width: 100%;
		height: 100%;
		border-radius: 10px;
	}

	.percentage {
		text-align: center;
		font-weight: bold;
		font-size: 1.75rem;
	}
</style>
