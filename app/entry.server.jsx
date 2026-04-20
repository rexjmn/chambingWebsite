import { renderToReadableStream } from 'react-dom/server';
import { ServerRouter } from 'react-router';
import { isbot } from 'isbot';

// Polyfill browser-only APIs para que los componentes no exploten durante SSR
if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  };
}
if (typeof globalThis.sessionStorage === 'undefined') {
  globalThis.sessionStorage = globalThis.localStorage;
}
if (typeof globalThis.window === 'undefined') {
  globalThis.window = globalThis;
}

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
