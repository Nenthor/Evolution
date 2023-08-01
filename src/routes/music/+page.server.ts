import { getDisplayData, getMusicData } from '$lib/server/DataHub';
import type { PageServerLoad } from './$types';
import { dev } from '$app/environment';
import { SOCKET_PORT_DEV as DEV_PORT, SOCKET_PORT_PROD as PROD_PORT } from '$env/static/private';

const socket_port = dev ? DEV_PORT : PROD_PORT;

export const load = (() => {
	return {
		socket_port,
		music: JSON.stringify(getMusicData()),
		display: JSON.stringify(getDisplayData())
	};
}) satisfies PageServerLoad;
