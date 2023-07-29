// See https://kit.svelte.dev/docs/types#app

import type { CameraData, DisplayData, MapData, MusicData } from '$lib/Types';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {}
		interface PageData {
			display?: string;
			music?: string;
			camera?: string;
			map?: string;
		}
		// interface Platform {}
	}
}

export {};
