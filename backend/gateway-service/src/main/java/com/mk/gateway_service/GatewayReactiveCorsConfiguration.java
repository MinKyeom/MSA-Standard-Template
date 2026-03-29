package com.mk.gateway_service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

/**
 * CORS 허용 출처를 {@code gateway.cors.allowed-origins}(쉼표 구분)로 주입합니다.
 * 운영 도메인은 GitHub Secrets / 서버 {@code .env}의 {@code CORS_ALLOWED_ORIGINS}로만 관리합니다.
 */
@Configuration
public class GatewayReactiveCorsConfiguration {

    @Bean
    public CorsWebFilter gatewayCorsWebFilter(
            @Value("${gateway.cors.allowed-origins:http://localhost:3000,http://localhost:4000}") String allowedOriginsRaw
    ) {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOriginsRaw.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .collect(Collectors.toList());
        origins.forEach(config::addAllowedOrigin);
        // 로컬: localhost vs 127.0.0.1·포트 혼용 시 Origin 불일치로 CORS 차단 방지 (헬스·공개 GET 등)
        config.addAllowedOriginPattern("http://localhost:*");
        config.addAllowedOriginPattern("http://127.0.0.1:*");
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.addAllowedHeader("*");
        config.setExposedHeaders(Arrays.asList("Set-Cookie", "Authorization", "X-Trace-Id"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsWebFilter(source);
    }
}
