package com.mk.auth_service.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * 로그인·OAuth 공통: 로컬 HTTP vs HTTPS 운영에 맞는 Set-Cookie (AuthController 와 동일 규칙).
 */
public final class AuthCookieSupport {

    private AuthCookieSupport() {}

    public static boolean isHttps(HttpServletRequest request) {
        String proto = request.getHeader("X-Forwarded-Proto");
        if (proto != null) {
            return "https".equalsIgnoreCase(proto);
        }
        return request.isSecure();
    }

    public static String domainAttr(HttpServletRequest request, String cookieDomainConfig) {
        if (cookieDomainConfig == null) {
            return "";
        }
        String d = cookieDomainConfig.trim();
        if (d.isEmpty()) {
            return "";
        }
        String host = request.getServerName();
        if (host == null || host.isBlank()) {
            return "";
        }
        String normalizedHost = host.toLowerCase();
        if ("localhost".equals(normalizedHost) || normalizedHost.matches("^\\d+\\.\\d+\\.\\d+\\.\\d+$")) {
            return "";
        }
        String normalizedDomain = d.startsWith(".") ? d.substring(1) : d;
        if (!normalizedHost.equals(normalizedDomain) && !normalizedHost.endsWith("." + normalizedDomain)) {
            return "";
        }
        if (!d.startsWith(".") && !"localhost".equalsIgnoreCase(d) && d.contains(".")) {
            d = "." + d;
        }
        return "; Domain=" + d;
    }

    public static void addAuthCookie(
            HttpServletRequest request,
            HttpServletResponse response,
            String name,
            String value,
            int maxAgeSeconds,
            String cookieDomainConfig
    ) {
        boolean https = isHttps(request);
        String sameSite = https ? "None" : "Lax";
        String secureAttr = https ? "; Secure" : "";
        String cookieValue =
                name + "=" + value
                        + "; Path=/"
                        + domainAttr(request, cookieDomainConfig)
                        + "; HttpOnly"
                        + "; Max-Age=" + maxAgeSeconds
                        + "; SameSite=" + sameSite
                        + secureAttr;
        response.addHeader("Set-Cookie", cookieValue);
    }

    public static void clearAuthCookie(
            HttpServletRequest request,
            HttpServletResponse response,
            String name,
            String cookieDomainConfig
    ) {
        boolean https = isHttps(request);
        String sameSite = https ? "None" : "Lax";
        String secureAttr = https ? "; Secure" : "";
        String deleteCookie =
                name + "="
                        + "; Path=/"
                        + domainAttr(request, cookieDomainConfig)
                        + "; HttpOnly"
                        + "; Max-Age=0"
                        + "; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
                        + "; SameSite=" + sameSite
                        + secureAttr;
        response.addHeader("Set-Cookie", deleteCookie);
    }
}
