package com.mk.auth_service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String OAUTH_DISABLED = "__oauth_disabled__";

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    @Value("${spring.security.oauth2.client.registration.google.client-id:__oauth_disabled__}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.kakao.client-id:__oauth_disabled__}")
    private String kakaoClientId;

    @Value("${spring.security.oauth2.client.registration.github.client-id:__oauth_disabled__}")
    private String githubClientId;

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        var chain = http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/login", "/signup", "/send-code", "/verify-code", "/refresh", "/extend",
                        "/find-username/send", "/find-username/verify", "/reset-password/send", "/reset-password/verify").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .anyRequest().authenticated()
                );

        // OAuth2: client-id가 설정된 경우에만 oauth2Login 활성화 (미설정 시 __oauth_disabled__)
        boolean oauthEnabled =
                (googleClientId != null && !googleClientId.isBlank() && !OAUTH_DISABLED.equals(googleClientId))
                || (kakaoClientId != null && !kakaoClientId.isBlank() && !OAUTH_DISABLED.equals(kakaoClientId))
                || (githubClientId != null && !githubClientId.isBlank() && !OAUTH_DISABLED.equals(githubClientId));

        if (oauthEnabled) {
            chain.oauth2Login(oauth2 -> oauth2.successHandler(oAuth2LoginSuccessHandler));
        }

        chain.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return chain.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
                "https://minkowskim.com",
                "https://www.minkowskim.com",
                "https://dev.minkowskim.com",
                "http://localhost:3000",
                "http://localhost:4000",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:4000",
                "http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}