package com.mk.post_service.controller;

import com.mk.post_service.dto.PostRequest;
import com.mk.post_service.dto.PostResponse;
import com.mk.post_service.security.SecurityUtils;
import com.mk.post_service.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/post-drafts")
@RequiredArgsConstructor
public class DraftPostController {

    private final PostService postService;

    @PostMapping
    public PostResponse createDraft(@RequestBody PostRequest request) {
        String userId = SecurityUtils.getAuthenticatedUserId();
        String role = SecurityUtils.getAuthenticatedUserRole();
        if (role == null || !"ROLE_ADMIN".equals(role)) {
            throw new org.springframework.security.access.AccessDeniedException("임시 저장은 관리자만 가능합니다.");
        }
        return postService.createDraft(request, userId);
    }

    @PutMapping("/{id:\\d+}")
    public PostResponse updateDraft(@PathVariable Long id, @RequestBody PostRequest request) {
        String userId = SecurityUtils.getAuthenticatedUserId();
        String role = SecurityUtils.getAuthenticatedUserRole();
        if (role == null || !"ROLE_ADMIN".equals(role)) {
            throw new org.springframework.security.access.AccessDeniedException("임시 저장 수정은 관리자만 가능합니다.");
        }
        return postService.updateDraft(id, request, userId);
    }

    @GetMapping("/mine")
    public Page<PostResponse> getMyDrafts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String userId = SecurityUtils.getAuthenticatedUserId();
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        return postService.getMyDrafts(userId, pageable);
    }

    @GetMapping("/{id:\\d+}")
    public PostResponse getDraft(@PathVariable Long id) {
        String userId = SecurityUtils.getAuthenticatedUserId();
        return postService.getDraftByIdForAuthor(id, userId);
    }

    @GetMapping("/for-post/{postId}")
    public PostResponse getLatestDraftForPost(@PathVariable Long postId) {
        String userId = SecurityUtils.getAuthenticatedUserId();
        return postService.getLatestDraftForSourcePost(postId, userId);
    }

    @PostMapping("/{id:\\d+}/publish")
    public PostResponse publishDraft(@PathVariable Long id) {
        String userId = SecurityUtils.getAuthenticatedUserId();
        String role = SecurityUtils.getAuthenticatedUserRole();
        if (role == null || !"ROLE_ADMIN".equals(role)) {
            throw new org.springframework.security.access.AccessDeniedException("게시 권한은 관리자만 있습니다.");
        }
        return postService.publishDraft(id, userId);
    }
}
