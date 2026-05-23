package com.mk.user_service.service;

import com.mk.user_service.dto.AboutPageRequest;
import com.mk.user_service.dto.AboutPageResponse;
import com.mk.user_service.entity.AboutPage;
import com.mk.user_service.repository.AboutPageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AboutPageService {

    private final AboutPageRepository aboutPageRepository;

    @Transactional(readOnly = true)
    public AboutPageResponse getAboutPage() {
        AboutPage page = aboutPageRepository.findById(AboutPage.SINGLETON_ID)
                .orElseGet(this::createDefaultPage);
        return AboutPageResponse.fromEntity(page);
    }

    @Transactional
    public AboutPageResponse updateAboutPage(AboutPageRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("제목은 비워둘 수 없습니다.");
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new IllegalArgumentException("본문은 비워둘 수 없습니다.");
        }

        AboutPage page = aboutPageRepository.findById(AboutPage.SINGLETON_ID)
                .orElseGet(this::createDefaultPage);

        page.setTitle(request.getTitle().trim());
        page.setContent(request.getContent());
        page.setUpdatedAt(LocalDateTime.now());

        return AboutPageResponse.fromEntity(aboutPageRepository.save(page));
    }

    @Transactional
    public AboutPage createDefaultPage() {
        LocalDateTime now = LocalDateTime.now();
        AboutPage page = AboutPage.builder()
                .id(AboutPage.SINGLETON_ID)
                .title("About me")
                .content(defaultMarkdownContent())
                .updatedAt(now)
                .build();
        return aboutPageRepository.save(page);
    }

    private static String defaultMarkdownContent() {
        return """
                # MinKowskiM

                **Think structurally, live beyond time.**

                안녕하세요. 백엔드, 프론트엔드, AI/ML에 관심을 두고 기록하는 개발 블로그 운영자입니다.

                ## What I do

                - **Backend**: Spring Boot, Spring Cloud, MSA, PostgreSQL, Kafka, Redis
                - **Frontend**: Next.js, React
                - **AI/ML**: 벡터 검색, 챗봇, 임베딩 기반 추천

                ## This blog

                이 블로그는 마이크로서비스 아키텍처를 직접 구성해 운영하는 실험장이자 학습 기록입니다.

                - API Gateway, Auth, User, Post, Search, AI Chat 서비스
                - 서비스별 PostgreSQL, Kafka 이벤트, Redis 캐시
                - [System Structure](/structure) 페이지에서 전체 구조를 확인할 수 있습니다

                ## Links

                - [GitHub](https://github.com/minkyeom)
                - [Miky's Daily Life](https://mikysdailylife.com/)

                ---

                *이 페이지는 관리자가 마크다운으로 수정할 수 있습니다.*
                """;
    }
}
