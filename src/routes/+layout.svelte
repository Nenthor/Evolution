<slot />

<style global>
	@font-face {
		font-family: 'comfortaa';
		src: url(/fonts/comfortaa/comfortaa.woff2) format('woff2'),
			url(/fonts/comfortaa/comfortaa.woff) format('woff');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'montserrat';
		src: url(/fonts/montserrat/montserrat_semibold.woff2) format('woff2'),
			url(/fonts/montserrat/montserrat_semibold.woff) format('woff');
		font-weight: 500;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'montserrat';
		src: url(/fonts/montserrat/montserrat_regular.woff2) format('woff2'),
			url(/fonts/montserrat/montserrat_regular.woff) format('woff');
		font-weight: 400;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'montserrat';
		src: url(/fonts/montserrat/montserrat_light.woff) format('truetype'),
			url(/fonts/montserrat/montserrat_light.woff) format('woff');
		font-weight: 300;
		font-style: normal;
		font-display: swap;
	}

	@font-face {
		font-family: 'roboto';
		src: url(/fonts/roboto/roboto.woff2) format('woff2'),
			url(/fonts/roboto/roboto.woff) format('woff');
		font-weight: normal;
		font-style: normal;
		font-display: swap;
	}

	* {
		margin: 0;
		padding: 0;
		font-family: montserrat;
	}

	html {
		min-height: 100%;
	}

	body {
		min-height: 100%;
		background-color: #161616;
	}

	#content {
		min-height: 100%;
	}

	a {
		-webkit-user-drag: none;
	}

	a:visited {
		text-decoration: none;
	}

	div,
	button {
		-webkit-tap-highlight-color: rgba(255, 255, 255, 0);
	}

	p,
	a,
	h1,
	h2,
	h3,
	h4,
	h5 {
		color: white;
	}

	::-webkit-scrollbar {
		width: 5px;
	}

	::-webkit-scrollbar-track {
		background: #323232;
	}

	::-webkit-scrollbar-thumb {
		background: white;
	}

	::-webkit-scrollbar-thumb:hover {
		background: #555;
	}
</style>
