export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Only auto-detect language on bare root path
    if (url.pathname === "/") {
      const cookie = request.headers.get("Cookie") || "";
      const langMatch = cookie.match(/lang=(en|de)/);

      if (langMatch) {
        if (langMatch[1] === "de") {
          return Response.redirect(new URL("/index.de.html", url.origin), 302);
        }
      } else {
        const acceptLang = request.headers.get("Accept-Language") || "";
        if (acceptLang.match(/^de|,\s*de/i)) {
          return Response.redirect(new URL("/index.de.html", url.origin), 302);
        }
      }
    }

    // Serve the page
    const response = await env.ASSETS.fetch(request);

    // Set lang cookie when user explicitly visits a language version
    if (url.pathname === "/index.html") {
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
