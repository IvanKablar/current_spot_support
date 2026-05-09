export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Auto-routing only on the bare root path
    if (url.pathname === "/") {
      const userAgent = request.headers.get("User-Agent") || "";
      const acceptLang = request.headers.get("Accept-Language") || "";
      const cookie = request.headers.get("Cookie") || "";

      const isBot = /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|whatsapp|telegram|discord|linkedinbot|embedly|preview/i.test(userAgent);
      const isApple = !isBot && /Macintosh|iPhone|iPad|iPod/.test(userAgent);

      const langCookie = cookie.match(/lang=(en|de)/);
      const platformCookie = cookie.match(/platform=(ios|wearos)/);

      // Resolve language preference
      let lang = "en";
      if (langCookie) {
        lang = langCookie[1];
      } else if (/^de|,\s*de/i.test(acceptLang)) {
        lang = "de";
      }

      // Platform override — honor cookie first
      if (platformCookie) {
        if (platformCookie[1] === "ios") {
          return Response.redirect(new URL(lang === "de" ? "/ios.de.html" : "/ios.html", url.origin), 302);
        }
        // "wearos" cookie → fall through to serve Wear OS page (or redirect DE)
      } else if (isApple) {
        // No platform cookie, Apple device → send to iOS page
        return Response.redirect(new URL(lang === "de" ? "/ios.de.html" : "/ios.html", url.origin), 302);
      }

      // Non-Apple: redirect DE users to German Wear OS homepage
      if (lang === "de") {
        return Response.redirect(new URL("/index.de.html", url.origin), 302);
      }
    }

    // Serve the actual asset
    const response = await env.ASSETS.fetch(request);

    // Remember explicit language + platform choice via cookies
    const setCookie = (lang, platform) => {
      const newResponse = new Response(response.body, response);
      newResponse.headers.append("Set-Cookie", `lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`);
      newResponse.headers.append("Set-Cookie", `platform=${platform}; Path=/; Max-Age=31536000; SameSite=Lax`);
      return newResponse;
    };

    if (url.pathname === "/index.html")     return setCookie("en", "wearos");
    if (url.pathname === "/index.de.html")  return setCookie("de", "wearos");
    if (url.pathname === "/ios.html")       return setCookie("en", "ios");
    if (url.pathname === "/ios.de.html")    return setCookie("de", "ios");

    return response;
  }
};