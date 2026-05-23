package com.mk.user_service.dto;

import com.mk.user_service.entity.AboutPage;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AboutPageResponse {
    private final String title;
    private final String content;
    private final LocalDateTime updatedAt;

    public static AboutPageResponse fromEntity(AboutPage page) {
        return AboutPageResponse.builder()
                .title(page.getTitle())
                .content(page.getContent())
                .updatedAt(page.getUpdatedAt())
                .build();
    }
}
