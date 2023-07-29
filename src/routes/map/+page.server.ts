import { getMapData } from '$lib/server/DataHub';
import type { PageServerLoad } from './$types';

export const load = (() => {
	return { map: JSON.stringify(getMapData()) };
}) satisfies PageServerLoad;
