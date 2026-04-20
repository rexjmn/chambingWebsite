import { renderToReadableStream } from 'react-dom/server';
import { ServerRouter } from 'react-router';
import { isbot } from 'isbot';

// Polyfill browser-only APIs — corre al cargar el módulo del servidor,
// antes de que cualquier componente React intente renderizarse.
const _storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
};

if (typeof globalThis.localStorage === 'undefined') globalThis.localStorage = _storage;
if (typeof globalThis.sessionStorage === 'undefined') globalThis.sessionStorage = _storage;

if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    location: { search: '', href: '/', pathname: '/', hash: '', origin: '' },
    navigator: { language: 'es', languages: ['es', 'en'], userAgent: '' },
    localStorage: _storage,
    sessionStorage: _storage,
    document: { cookie: '' },
    history: { replaceState: () => {}, pushState: () => {}, state: null },
    screen: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    innerWidth: 1280,
    innerHeight: 800,
  };
}

if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = { language: 'es', languages: ['es', 'en'], userAgent: '' };
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = { cookie: '', querySelector: () => null, getElementsByTagName: () => [] };
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
