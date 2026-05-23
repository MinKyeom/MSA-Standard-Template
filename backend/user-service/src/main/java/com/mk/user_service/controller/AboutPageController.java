package com.mk.user_service.controller;

import com.mk.user_service.dto.AboutPageRequest;
import com.mk.user_service.dto.AboutPageResponse;
import com.mk.user_service.security.SecurityUtils;
import com.mk.user_service.service.AboutPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/user/about")
@RequiredArgsConstructor
public class AboutPageController {

    private final AboutPageService aboutPageService;

    @GetMapping
    public ResponseEntity<AboutPageResponse> getAboutPage() {
        return ResponseEntity.ok(aboutPageService.getAboutPage());
    }

    @PutMapping
    public ResponseEntity<AboutPageResponse> updateAboutPage(@RequestBody AboutPageRequest request) {
        SecurityUtils.getAuthenticatedUserId();
        String role = SecurityUtils.getAuthenticatedUserRole();
        if (role == null || !"ROLE_ADMIN".equals(role)) {
            throw new AccessDeniedException("About 페이지 수정 권한은 관리자만 있습니다.");
        }
        return ResponseEntity.ok(aboutPageService.updateAboutPage(request));
    }
}
