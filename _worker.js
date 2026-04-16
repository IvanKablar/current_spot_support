export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only redirect on root path — subpages handle their own lang links
    if (url.pathname === "/" || url.pathname === "/index.html") {
      // Check if user explicitly chose a language (cookie from lang switcher)
      const cookie = request.headers.get("Cookie") || "";
      const langMatch = cookie.match(/lang=(en|de)/);

      if (langMatch) {
        if (langMatch[1] === "de" && url.pathname !== "/index.de.html") {
          return Response.redirect(new URL("/index.de.html", url.origin), 302);
        }
        // en = default, serve index.html normally
      } else {
        // Auto-detect from Accept-Language header
        const acceptLang = request.headers.get("Accept-Language") || "";
        if (acceptLang.match(/^de|,\s*de/i)) {
          return Response.redirect(new URL("/index.de.html", url.origin), 302);
        }
      }
    }

    // Set lang cookie when user clicks language switcher links
    const response = await env.ASSETS.fetch(request);

    if (url.pathname === "/index.html" || url.pathname === "/") {
      const newResponse = new Response(response.body, response);
      newResponse.headers.append("Set-Cookie", "lang=en; Path=/; Max-Age=31536000; SameSite=Lax");
      return newResponse;
    }
    if (url.pathname === "/index.de.html") {
      const newResponse = new Response(response.body, response);
      newResponse.headers.append("Set-Cookie", "lang=de; Path=/; Max-Age=31536000; SameSite=Lax");
      return newResponse;
    }

    return response;
  }
};
