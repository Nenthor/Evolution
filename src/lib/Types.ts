export interface DisplayData {
	speed: number;
	reverse: boolean;
	battery: number;
	settings: {
		name: string;
		status: boolean;
	}[];
	coords_txt: string;
	connection_quality: string;
}

export interface MusicData {
	volume: number;
	current_song: number;
	songs: {
		title: string;
		img: string;
		url: string;
	}[];
}

export interface CameraData {
	obstacles: number[];
}

export interface MapData {
	hasLocation: boolean;
	imageX: number;
	imageY: number;
	pixelX: number;
	pixelY: number;
	rotation: number;
}

export interface Settings {
	settings: DisplayData['settings'];
	volume: MusicData['volume'];
	current_song: MusicData['current_song'];
}
