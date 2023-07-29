import { getCameraData } from '$lib/server/DataHub';
import type { PageServerLoad } from './$types';

export const load = (() => {
	return { camera: JSON.stringify(getCameraData()) };
}) satisfies PageServerLoad;
