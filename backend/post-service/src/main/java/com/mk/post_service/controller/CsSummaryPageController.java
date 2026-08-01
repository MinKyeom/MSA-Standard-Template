package com.mk.post_service.controller;

import com.mk.post_service.dto.CsSummaryPageRequest;
import com.mk.post_service.dto.CsSummaryPageResponse;
import com.mk.post_service.security.SecurityUtils;
import com.mk.post_service.service.CsSummaryPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

/**
 * CS 요약(포스터) 페이지 — 콘텐츠 도메인(post-service).
 * About(/user/about)과 달리 블로그·CS 카테고리와 같은 Bounded Context.
 */
@RestController
@RequestMapping("/api/cs")
@RequiredArgsConstructor
public class CsSummaryPageController {

    private final CsSummaryPageService csSummaryPageService;

    @GetMapping
    public ResponseEntity<CsSummaryPageResponse> getCsSummaryPage() {
        return ResponseEntity.ok(csSummaryPageService.getCsSummaryPage());
    }

    @PutMapping
    public ResponseEntity<CsSummaryPageResponse> updateCsSummaryPage(@RequestBody CsSummaryPageRequest request) {
        SecurityUtils.getAuthenticatedUserId();
        String role = SecurityUtils.getAuthenticatedUserRole();
        if (role == null || !"ROLE_ADMIN".equals(role)) {
            throw new AccessDeniedException("CS 요약 페이지 수정 권한은 관리자만 있습니다.");
        }
        return ResponseEntity.ok(csSummaryPageService.updateCsSummaryPage(request));
    }
}
