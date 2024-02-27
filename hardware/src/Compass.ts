import Compasss from 'compass-hmc5883l';
import Geomagnetism from 'geomagnetism';

const DELAY = 1000;
const OFFSET = 270;

let compass: Compasss;
let interval: NodeJS.Timeout;
let rotation = 0;
let options = {
	sampleRate: '30',
	declination: 4.1,
	scale: '2.5' // 0.88, 1.3, 1.9, 2.5, 4.0, 4.7, 5.6, or 8.1
};

export default () => {
	if (compass) return;

	try {
		compass = new Compasss(1, options);
	} catch (error) {
		console.log('Compass not connected.');
		compass = null;
		return;
	}
	setRefreshLoop();
	console.log('Compass is online');
};

export function setDeclination(lat: number, long: number) {
	if (!compass) return;
	const declination = Geomagnetism.model().point([lat, long]).decl;
	compass.setDeclination(declination);
}

export function cleanup() {
	if (interval) clearInterval(interval);
}

export function getRotation() {
	return rotation;
}

function setRefreshLoop() {
	interval = setInterval(() => {
		// Get the compass values between x and y.  Heading is returned in degrees.
		compass.getHeadingDegrees('x', 'y', (err: any, heading: number) => {
			if (err) {
				console.log(err);
				return;
			}

			rotation = Math.floor(heading) + OFFSET;
			if (rotation > 360) rotation -= 360;
			else if (rotation < 0) rotation += 360;
		});
	}, DELAY);
}
