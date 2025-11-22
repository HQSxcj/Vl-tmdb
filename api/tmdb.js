const API_ORIGIN = 'https://api.themoviedb.org';
const IMAGE_ORIGIN = 'https://image.tmdb.org';

export const config = { runtime: 'edge' };

export default async function handler(request, context) {
  const url = new URL(request.url);
  let { pathname, search } = url;

  if (pathname.startsWith('/api/tmdb')) {
    pathname = pathname.replace('/api/tmdb', '');
  }

  if (!pathname || pathname === '/') {
    const pathParam = url.searchParams.get('path') || '';
    if (pathParam) {
      pathname = pathParam.startsWith('/') ? pathParam : '/' + pathParam;
      const newSearchParams = new URLSearchParams(url.searchParams);
      newSearchParams.delete('path');
      search = newSearchParams.toString() ? '?' + newSearchParams.toString() : '';
    }
  }

  if (pathname.startsWith('/3/') || pathname.startsWith('/4/')) {
    const target = `${API_ORIGIN}${pathname}${search}`;
    return proxy(request, target);
  }

  if (pathname.startsWith('/t/p/')) {
    const target = `${IMAGE_ORIGIN}${pathname}${search}`;
    return proxy(request, target, true);
  }

  if (
    pathname.includes('fanart.tv') ||
    pathname.includes('imdb.com') ||
    pathname.includes('omdbapi.com') ||
    pathname.includes('thetvdb.com')
  ) {
    const target = url.href;
    return proxy(request, target, true);
  }

  return new Response('OK: use /3/... or /4/... for API, /t/p/... for images, or full image URL for other providers', {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

async function proxy(incomingRequest, targetUrl, isImage = false) {
  const hopByHop = new Set([
    'connection',
    'keep-alive',
    'transfer-encoding',
    'proxy-connection',
    'upgrade',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers'
  ]);

  const reqHeaders = new Headers();
  for (const [k, v] of incomingRequest.headers) {
    if (!hopByHop.has(k.toLowerCase()) && k.toLowerCase() !== 'host') {
      reqHeaders.append(k, v);
    }
  }

  if (isImage) reqHeaders.set('User-Agent', 'Mozilla/5.0 (compatible; Cf-Image-Proxy/1.0)');

  const init = {
    method: incomingRequest.method,
    headers: reqHeaders,
    body: needsBody(incomingRequest.method) ? incomingRequest.body : undefined,
    redirect: isImage ? 'follow' : 'manual'
  };

  const upstreamRes = await fetch(targetUrl, init);

  const resHeaders = new Headers();
  for (const [k, v] of upstreamRes.headers) {
    if (!hopByHop.has(k.toLowerCase())) {
      resHeaders.append(k, v);
    }
  }

  if (isImage) {
    resHeaders.set('Access-Control-Allow-Origin', '*');
    resHeaders.set('Cache-Control', 'public, max-age=86400');
  }

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: resHeaders
  });
}

function needsBody(method) {
  const m = method.toUpperCase();
  return m !== 'GET' && m !== 'HEAD';
}