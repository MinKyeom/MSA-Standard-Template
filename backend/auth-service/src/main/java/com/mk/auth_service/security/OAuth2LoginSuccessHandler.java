package com.mk.auth_service.security;

import com.mk.auth_service.entity.AuthUser;
import com.mk.auth_service.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

/**
 * OAuth2(Google/Kakao) 로그인 성공 시: 사용자 조회/생성 → JWT 쿠키 설정 → 프론트엔드로 리다이렉트.
 */
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;
    private final TokenProvider tokenProvider;

    private static final String COOKIE_AUTH_TOKEN = "authToken";
    private static final String COOKIE_REFRESH_TOKEN = "refreshToken";

    @Value("${jwt.access-expiry-minutes:30}")
    private int accessExpiryMinutes;

    @Value("${jwt.refresh-expiry-days:7}")
    private int refreshExpiryDays;

    @Value("${app.cookie-domain:}")
    private String cookieDomain;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String registrationId = getRegistrationId(request);
        AuthUser.AuthProvider provider = toAuthProvider(registrationId);
        String subjectId = getSubjectId(oauth2User, registrationId);
        String email = getEmail(oauth2User);
        String name = getName(oauth2User);

        AuthUser user = authService.findOrCreateFromOAuth(provider, subjectId, email, name);
        String accessToken = tokenProvider.createAccessToken(user);
        String refreshToken = authService.saveRefreshToken(user.getId());

        AuthCookieSupport.addAuthCookie(
                request, response, COOKIE_AUTH_TOKEN, accessToken, accessExpiryMinutes * 60, cookieDomain);
        AuthCookieSupport.addAuthCookie(
                request,
                response,
                COOKIE_REFRESH_TOKEN,
                refreshToken,
                refreshExpiryDays * 24 * 60 * 60,
                cookieDomain);

        getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/?oauth=success");
    }

    private String getRegistrationId(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (uri == null) return "google";
        String marker = "/oauth2/code/";
        int i = uri.indexOf(marker);
        if (i < 0) {
            marker = "/login/oauth2/code/";
            i = uri.indexOf(marker);
        }
        if (i >= 0) {
            String rest = uri.substring(i + marker.length());
            int slash = rest.indexOf('/');
            return slash >= 0 ? rest.substring(0, slash) : rest;
        }
        return "google";
    }

    private AuthUser.AuthProvider toAuthProvider(String registrationId) {
        if (registrationId == null) return AuthUser.AuthProvider.GOOGLE;
        return switch (registrationId.toLowerCase()) {
            case "kakao" -> AuthUser.AuthProvider.KAKAO;
            case "google" -> AuthUser.AuthProvider.GOOGLE;
            case "github" -> AuthUser.AuthProvider.GITHUB;
            default -> AuthUser.AuthProvider.GOOGLE;
        };
    }

    private String getSubjectId(OAuth2User oauth2User, String registrationId) {
        if ("kakao".equalsIgnoreCase(registrationId) || "github".equalsIgnoreCase(registrationId)) {
            Object id = oauth2User.getAttribute("id");
            return id != null ? id.toString() : oauth2User.getName();
        }
        String sub = oauth2User.getAttribute("sub");
        return sub != null ? sub : oauth2User.getName();
    }

    private String getEmail(OAuth2User oauth2User) {
        String email = oauth2User.getAttribute("email");
        if (email != null) return email;
        Map<String, Object> kakaoAccount = oauth2User.getAttribute("kakao_account");
        if (kakaoAccount != null && kakaoAccount.get("email") != null) {
            return kakaoAccount.get("email").toString();
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private String getName(OAuth2User oauth2User) {
        String name = oauth2User.getAttribute("name");
        if (name != null) return name;
        Map<String, Object> kakaoAccount = oauth2User.getAttribute("kakao_account");
        if (kakaoAccount != null) {
            Object profileObj = kakaoAccount.get("profile");
            if (profileObj instanceof Map) {
                Object nickname = ((Map<?, ?>) profileObj).get("nickname");
                if (nickname != null) return nickname.toString();
            }
        }
        Object login = oauth2User.getAttribute("login");
        return login != null ? login.toString() : oauth2User.getName();
    }

}
