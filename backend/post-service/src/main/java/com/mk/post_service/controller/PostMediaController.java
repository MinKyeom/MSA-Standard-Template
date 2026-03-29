package com.mk.post_service.controller;

import com.mk.post_service.media.PostCoverStorageService;
import com.mk.post_service.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/posts/media")
@RequiredArgsConstructor
public class PostMediaController {

    private final PostCoverStorageService postCoverStorageService;

    /**
     * 포스트 카드 썸네일(이미지·짧은 동영상) 업로드.
     * - 인증 필수 (SecurityConfig: GET 외 요청은 authenticated)
     * - 관리자 권한은 프론트 작성 페이지에서 이미 차단하지만, 서버에서도 방어합니다.
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadCover(@RequestParam("file") MultipartFile file) {
        String role = SecurityUtils.getAuthenticatedUserRole();
        if (role == null || !"ROLE_ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("message", "포스트 미디어 업로드 권한은 관리자만 있습니다."));
        }
        try {
            String url = postCoverStorageService.store(file);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "업로드 처리 중 오류가 발생했습니다."));
        }
    }
}
