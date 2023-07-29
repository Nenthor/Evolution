<script lang="ts">
	import { fly } from 'svelte/transition';

	let isOpen = false;
	let is_loading = true;
	function onClick() {
		isOpen = !isOpen;
	}

	let isMobileMenu = false;
	let total_width = 0,
		image_width = 0,
		list_width = 0;

	$: if (total_width != 0 && image_width != 0 && list_width != 0) {
		if (image_width + list_width >= total_width) isMobileMenu = true;
		else isMobileMenu = false;
		is_loading = false;
	}
</script>

<nav bind:clientWidth={total_width}>
	<a bind:clientWidth={image_width} href="/" id="title">
		<img id="title_img" src="/images/logo.webp" draggable="false" alt="Evolution" />
	</a>
	{#if isMobileMenu}
		<button id="nav_toggle" aria-label="Open mobile menu" on:click={onClick}>
			<span class="nav_bar {isOpen ? 'nav_bar_open' : ''}" />
			<span class="nav_bar {isOpen ? 'nav_bar_open' : ''}" />
			<span class="nav_bar {isOpen ? 'nav_bar_open' : ''}" />
		</button>
		{#if isOpen}
			<ul
				id="nav_list_open"
				style="display: flex;"
				transition:fly={{ y: -150, duration: 1000 }}
				bind:clientWidth={list_width}
			>
				<slot />
			</ul>
		{/if}
	{:else}
		<ul class={is_loading ? 'loading' : ''} id="nav_list" bind:clientWidth={list_width}>
			<slot />
		</ul>
	{/if}
</nav>

<style>
	nav {
		width: 100%;
		height: 75px;
		position: fixed;
		top: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: white;
		z-index: 1;
		overflow: hidden;
	}

	#title {
		text-decoration: none;
	}

	#title_img {
		height: 100px;
		margin-left: 5px;
		transform: translateY(1.75px);
	}

	#nav_list {
		list-style: none;
		color: #161616;
	}

	.loading {
		color: transparent !important;
	}

	#nav_toggle {
		display: inline-block;
		cursor: pointer;
		margin: 0 15px;
		color: #161616;
		border: none;
		background-color: transparent;
		-webkit-tap-highlight-color: rgba(255, 255, 255, 0);
	}

	.nav_bar {
		display: block;
		width: 30px;
		height: 3px;
		background-color: #161616;
		margin: 6px 0;
		border-radius: 25px;
		transition: transform 0.3s ease-out, opacity 0.3s ease-out;
	}

	.nav_bar_open:nth-child(1) {
		transform: translateX(-5px) rotate(-45deg) translateY(12.5px);
	}

	.nav_bar_open:nth-child(2) {
		opacity: 0;
	}

	.nav_bar_open:nth-child(3) {
		transform: translateX(-5px) rotate(45deg) translateY(-12.5px);
	}

	#nav_list_open {
		display: none;
		position: fixed;
		top: 75px;
		background-color: #333;
		width: 100%;
		animation: none;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	:global(#nav_list > li) {
		float: left;
		margin: 0 clamp(10px, 1vw, 15px);
		transition: transform 0.3s ease;
	}

	:global(#nav_item:hover) {
		transform: translateY(4px);
	}

	:global(#nav_list > li > a) {
		text-decoration: none;
		color: inherit;
		font-size: 1.25rem;
		text-align: center;
		font-weight: normal;
		transition: color 0.3s ease;
		padding: 50% 0;
	}

	:global(#nav_list > li > a:hover) {
		color: #3bc5e7;
		text-shadow: none;
	}

	:global(#nav_list_open > li) {
		height: fit-content;
		margin: 12.5px 0;
	}

	:global(#nav_list_open > li:hover) {
		transform: none;
	}

	:global(#nav_list_open > li > a) {
		text-decoration: none;
		color: white;
		font-size: 1.25rem;
		transition: color 0.3s ease;
	}

	:global(#nav_list_open > li > a:hover) {
		color: #3bc5e7;
		text-shadow: none;
	}
</style>
