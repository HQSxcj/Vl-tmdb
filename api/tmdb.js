const API_ORIGIN = 'https://api.themoviedb.org';
const IMAGE_ORIGIN = 'https://image.tmdb.org';

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  let { pathname, search, origin } = url;

  if (pathname.startsWith('/api/tmdb')) {
    pathname = pathname.replace('/api/tmdb', '');
  }

  if (!pathname || pathname === '/') {
    const pathParam = url.searchParams.get('path') || '';
    if (pathParam) {
      pathname = pathParam.startsWith('/') ? pathParam : '/' + pathParam;
      const sp = new URLSearchParams(url.searchParams);
      sp.delete('path');
      search = sp.toString() ? '?' + sp.toString() : '';
    }
  }

  if (pathname.startsWith('/3/') || pathname.startsWith('/4/')) {
    return proxy(request, `${API_ORIGIN}${pathname}${search}`);
  }

  if (pathname.startsWith('/t/p/')) {
    return proxy(request, `${IMAGE_ORIGIN}${pathname}${search}`);
  }

  if (url.hostname.includes('fanart.tv')) {
    return proxy(request, url.toString());
  }

  return new Response('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

async function proxy(incomingRequest, targetUrl) {
  const hop = new Set([
    'connection','keep-alive','transfer-encoding','proxy-connection',
    'upgrade','proxy-authenticate','proxy-authorization','te','trailers'
  ]);

  const reqHeaders = new Headers();
  for (const [k, v] of incomingRequest.headers) {
    if (!hop.has(k.toLowerCase()) && k.toLowerCase() !== 'host') {
      reqHeaders.append(k, v);
    }
  }

  const isImage = targetUrl.includes('image.tmdb.org') ||
                  targetUrl.includes('fanart.tv');

  const init = {
    method: incomingRequest.method,
    headers: reqHeaders,
    body: needsBody(incomingRequest.method) ? incomingRequest.body : undefined,
    redirect: isImage ? 'follow' : 'manual'
  };

  const upstream = await fetch(targetUrl, init);

  const resHeaders = new Headers();
  for (const [k, v] of upstream.headers) {
    if (!hop.has(k.toLowerCase())) {
      resHeaders.append(k, v);
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: resHeaders
  });
}

function needsBody(m) {
  m = m.toUpperCase();
  return m !== 'GET' && m !== 'HEAD';
}