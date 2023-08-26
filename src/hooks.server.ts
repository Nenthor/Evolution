import { loadSettings } from '$lib/server/DataHub';
import { start as startSocketServer } from '$lib/server/SocketServer';
import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';

let first_connection = false;

if (!dev) await checkForFirstConnection();

export const handle: Handle = (async ({ event, resolve }) => {
	if (dev) await checkForFirstConnection();
	return resolve(event);
}) satisfies Handle;

async function checkForFirstConnection() {
	if (!first_connection) {
		first_connection = true;
		await loadSettings();
		startSocketServer();
	}
}
