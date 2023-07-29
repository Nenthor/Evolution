import { getDisplayData, getMusicData } from '$lib/server/DataHub';
import type { PageServerLoad } from './$types';

export const load = (() => {
	return { music: JSON.stringify(getMusicData()), display: JSON.stringify(getDisplayData()) };
}) satisfies PageServerLoad;
