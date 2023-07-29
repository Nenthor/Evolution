import { loadSettings } from '$lib/server/DataHub';
import { start as startSocketServer } from '$lib/server/SocketServer';
import type { Handle } from '@sveltejs/kit';

let first_connection = false;
export const handle: Handle = (async ({ event, resolve }) => {
	await checkForFirstConnection();
	return resolve(event);
}) satisfies Handle;

async function checkForFirstConnection() {
	if (!first_connection) {
		first_connection = true;
		await loadSettings();
		startSocketServer();
	}
}
