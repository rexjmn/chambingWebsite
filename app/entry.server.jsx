import { renderToReadableStream } from 'react-dom/server';
import { ServerRouter } from 'react-router';
import { isbot } from 'isbot';

export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  routerContext,
) {
  let shellRendered = false;

  const stream = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error) {
        responseStatusCode = 500;
        if (shellRendered) console.error(error);
      },
    }
  );
  shellRendered = true;

  // Bots y crawlers esperan el HTML completo antes de recibir respuesta
  if (isbot(request.headers.get('user-agent') ?? '')) {
    await stream.allReady;
  }

  responseHeaders.set('Content-Type', 'text/html');
  return new Response(stream, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
