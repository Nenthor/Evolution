import type { RequestHandler } from './$types';

export const GET = (() => {
	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue();
			controller.close();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			Connection: 'keep-alive',
			'Cache-Control': 'no-cache'
		}
	});
}) satisfies RequestHandler;
