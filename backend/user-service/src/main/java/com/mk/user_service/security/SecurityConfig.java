package com.mk.user_service.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // http
        //         .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        //         .csrf(AbstractHttpConfigurer::disable)
        //         .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        //         .authorizeHttpRequests(auth -> auth
        //                 // 닉네임 중복 체크나 내부 API는 인증 없이 허용 가능
        //                 .requestMatchers("/user/check-nickname", "/user/api/**").permitAll()
        //                 // 그 외 마이페이지(/user/me) 등은 인증 필요
        //                 .anyRequest().authenticated()

        //         )
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 닉네임 부분 보안 설정 보강하기
                        // PostgreSQL로 교체
                        // .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // 회원가입, 로그인, 로그아웃 허용
                        .requestMatchers("/user/signup", "/user/signin", "/user/logout").permitAll()
                        // ⭐ 실시간 아이디 및 닉네임 중복 체크 경로 허용 추가
                        .requestMatchers("/user/check-username", "/user/check-nickname").permitAll()
                        .requestMatchers(HttpMethod.POST,"/user/api/users/nicknames").permitAll()
                        // 내 정보 조회 및 닉네임 목록 조회 허용
                        .requestMatchers(HttpMethod.GET, "/user/me", "/user/nicknames").permitAll()
                        .requestMatchers("/user/send-code", "/user/verify-code","/user/send-verification").permitAll() // ⭐ 이 줄을 추가하세요!
                        // 내부 서비스 호출 경로 허용 (PostService 등에서 사용)
                        .requestMatchers("/user/api/**").permitAll() // 혹은 이 패턴으로 전체 허용
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("https://minkowskim.com", "https://www.minkowskim.com", "https://dev.minkowskim.com", "http://localhost:3000", "http://localhost:4000", "http://localhost:5173"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}