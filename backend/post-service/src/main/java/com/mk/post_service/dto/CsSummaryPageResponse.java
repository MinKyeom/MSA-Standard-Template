package com.mk.post_service.dto;

import com.mk.post_service.entity.CsSummaryPage;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CsSummaryPageResponse {
    private final String title;
    private final String content;
    private final LocalDateTime updatedAt;

    public static CsSummaryPageResponse fromEntity(CsSummaryPage page) {
        return CsSummaryPageResponse.builder()
                .title(page.getTitle())
                .content(page.getContent())
                .updatedAt(page.getUpdatedAt())
                .build();
    }
}
