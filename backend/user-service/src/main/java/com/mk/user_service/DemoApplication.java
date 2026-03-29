package com.mk.user_service;

import java.util.Collections;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(DemoApplication.class);
        // 포트 설정
        app.setDefaultProperties(Collections.singletonMap("server.port", "8081"));
        // 앱 실행
        app.run(args);
    }
}
