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

      const langCookie = cookie.match(/lang=(en|de|nl|sv|no)/);
      const platformCookie = cookie.match(/platform=(ios|wearos)/);

      // Resolve language preference (cookie wins, otherwise Accept-Language)
      let lang = "en";
      if (langCookie) {
        lang = langCookie[1];
      } else if (/^de|,\s*de/i.test(acceptLang)) {
        lang = "de";
      } else if (/^nl|,\s*nl/i.test(acceptLang)) {
        lang = "nl";
      } else if (/^sv|,\s*sv/i.test(acceptLang)) {
        lang = "sv";
      } else if (/^(no|nb|nn)|,\s*(no|nb|nn)/i.test(acceptLang)) {
        lang = "no";
      }

      // iOS landing only exists in EN/DE — non-Apple langs fall back to EN iOS page
      const iosTarget = lang === "de" ? "/ios.de.html" : "/ios.html";
      const wearTarget = (
        lang === "de" ? "/index.de.html" :
        lang === "nl" ? "/index.nl.html" :
        lang === "sv" ? "/index.sv.html" :
        lang === "no" ? "/index.no.html" :
        null
      );

      // Platform override — honor cookie first
      if (platformCookie) {
        if (platformCookie[1] === "ios") {
          return Response.redirect(new URL(iosTarget, url.origin), 302);
        }
        // "wearos" cookie → fall through to serve Wear OS page (or redirect to localized one)
      } else if (isApple) {
        // No platform cookie, Apple device → send to iOS page
        return Response.redirect(new URL(iosTarget, url.origin), 302);
      }

      // Non-Apple: redirect localized users to their Wear OS homepage
      if (wearTarget) {
        return Response.redirect(new URL(wearTarget, url.origin), 302);
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
    if (url.pathname === "/index.nl.html")  return setCookie("nl", "wearos");
    if (url.pathname === "/index.sv.html")  return setCookie("sv", "wearos");
    if (url.pathname === "/index.no.html")  return setCookie("no", "wearos");
    if (url.pathname === "/ios.html")       return setCookie("en", "ios");
    if (url.pathname === "/ios.de.html")    return setCookie("de", "ios");

    return response;
  }
};
