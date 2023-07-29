import { getDisplayData, getMusicData } from '$lib/server/DataHub';
import type { PageServerLoad } from './$types';

export const load = (() => {
	return { display: JSON.stringify(getDisplayData()), music: JSON.stringify(getMusicData()) };
}) satisfies PageServerLoad;
