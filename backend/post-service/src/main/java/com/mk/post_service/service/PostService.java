package com.mk.post_service.service;

import com.mk.post_service.dto.*;
import com.mk.post_service.entity.*;
import com.mk.post_service.event.PostEventPayload;
import com.mk.post_service.repository.*;
import com.mk.post_service.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class PostService {
    private static final String TOPIC_POST_EVENTS = "post.events";

    private final PostRepository postRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final WebClient webClient;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${USER_SERVICE_URL:http://localhost:8081}")
    private String userServiceUrl;

    @Value("${search.service.url:http://search-service:8010}")
    private String searchServiceUrl;

    public PostService(
            PostRepository postRepository,
            CategoryRepository categoryRepository,
            TagRepository tagRepository,
            WebClient.Builder webClientBuilder,
            KafkaTemplate<String, Object> kafkaTemplate
    ) {
        this.postRepository = postRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.webClient = webClientBuilder.build();
        this.kafkaTemplate = kafkaTemplate;
    }

    public PostResponse createPost(PostRequest request, String authenticatedUserId) {
        Post post = request.toEntity();
        post.setAuthorId(authenticatedUserId);
        post.setDraft(false);
        post.setDraftSourcePostId(null);
        applyCategoryAndTags(post, request);

        Post savedPost = postRepository.save(post);
        PostResponse res = PostResponse.fromEntity(savedPost);

        // Search 서비스 임베딩 인덱싱: Kafka 발행 + 즉시 HTTP 인덱싱(검색 지연 방지)
        publishPostEvent(savedPost.getId(), savedPost.getTitle(), savedPost.getContent());
        syncSearchIndex(savedPost.getId(), savedPost.getTitle(), savedPost.getContent());

        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(authenticatedUserId));
        res.setAuthorNickname(nicknameMap.getOrDefault(authenticatedUserId, "작성자 알 수 없음"));
        return res;
    }

    public PostResponse updatePost(Long id, PostRequest request, String authenticatedUserId) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("게시글 없음"));
        if (!post.getAuthorId().equals(authenticatedUserId)) throw new RuntimeException("권한 없음");
        if (post.isDraft()) throw new RuntimeException("임시 저장 글은 post-drafts API로 수정하세요");

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setCardCoverImageUrl(request.getCardCoverImageUrl());
        post.setCardCoverVideoUrl(request.getCardCoverVideoUrl());
        applyCategoryAndTags(post, request);

        PostResponse res = PostResponse.fromEntity(post);

        // Search 서비스 갱신: Kafka 발행 + 즉시 HTTP 인덱싱
        publishPostEvent(post.getId(), post.getTitle(), post.getContent());
        syncSearchIndex(post.getId(), post.getTitle(), post.getContent());
        // 기존 글 업데이트가 최신 변경으로 확정되면, 같은 원본을 바라보는 임시저장은 정리
        postRepository.deleteByAuthorIdAndDraftTrueAndDraftSourcePostId(authenticatedUserId, post.getId());

        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(authenticatedUserId));
        res.setAuthorNickname(nicknameMap.getOrDefault(authenticatedUserId, "작성자 알 수 없음"));
        return res;
    }

    public void deletePost(Long id, String authenticatedUserId) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("게시글 없음"));
        if (!post.getAuthorId().equals(authenticatedUserId)) throw new RuntimeException("권한 없음");
        Category categoryToCheck = post.getCategory();
        Set<Tag> tagsToCheck = post.getTags() != null ? new HashSet<>(post.getTags()) : Collections.emptySet();
        postRepository.delete(post);
        removeSearchIndex(id);
        if (categoryToCheck != null && postRepository.countByCategoryAndDraftFalse(categoryToCheck) == 0) {
            categoryRepository.delete(categoryToCheck);
        }
        for (Tag tag : tagsToCheck) {
            if (postRepository.countByTagsAndDraftFalse(tag) == 0) {
                tagRepository.delete(tag);
            }
        }
    }

    /** 포스트 삭제 시 검색 서비스 인덱스에서 제거 */
    private void removeSearchIndex(Long postId) {
        try {
            webClient.delete()
                .uri(searchServiceUrl + "/api/search/index/" + postId)
                .retrieve()
                .toBodilessEntity()
                .timeout(Duration.ofSeconds(5))
                .onErrorResume(e -> {
                    log.warn("Search index 삭제 실패 (postId={}): {}", postId, e.getMessage());
                    return Mono.empty();
                })
                .subscribe();
        } catch (Exception e) {
            log.warn("Search index 삭제 요청 실패 (postId={}): {}", postId, e.getMessage());
        }
    }

    public PostResponse getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("게시글 없음"));
        if (post.isDraft()) {
            String viewer = SecurityUtils.getOptionalAuthenticatedUserId();
            if (viewer == null || !post.getAuthorId().equals(viewer)) {
                throw new RuntimeException("게시글 없음");
            }
        }
        if (!post.isDraft()) {
            post.setViewCount((post.getViewCount() == null ? 0L : post.getViewCount()) + 1L);
            postRepository.save(post);
        }

        PostResponse res = PostResponse.fromEntity(post);
        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(post.getAuthorId()));
        res.setAuthorNickname(nicknameMap.getOrDefault(post.getAuthorId(), "작성자 알 수 없음"));
        return res;
    }

    /** 조회수 기준 인기글 상위 N개 (메인 페이지용) */
    public List<PostResponse> getTopPopularPosts(int limit) {
        if (limit <= 0) return Collections.emptyList();
        List<Post> top = postRepository.findTopByViewCount(org.springframework.data.domain.PageRequest.of(0, limit));
        List<String> authorIds = top.stream().map(Post::getAuthorId).distinct().collect(Collectors.toList());
        Map<String, String> nicknameMap = getAuthorNicknamesMap(authorIds);
        return top.stream()
                .map(post -> {
                    PostResponse res = PostResponse.fromEntity(post);
                    res.setAuthorNickname(nicknameMap.getOrDefault(post.getAuthorId(), "작성자 알 수 없음"));
                    return res;
                })
                .collect(Collectors.toList());
    }

    // public Page<PostResponse> getAllPosts(Pageable pageable) {
    //     return mapPostPageToResponse(postRepository.findAll(pageable));
    // }
    public Page<PostResponse> getAllPosts(Pageable pageable) {
        return mapPostPageToResponse(postRepository.findAllWithDetails(pageable)); // 명칭 변경
    }


    public Page<PostResponse> getPostsByCategory(String categoryName, Pageable pageable) {
        if (categoryName == null || categoryName.trim().isEmpty()) {
            return mapPostPageToResponse(Page.empty(pageable));
        }
        return mapPostPageToResponse(postRepository.findByCategoryNameIgnoreCaseAndDraftFalse(categoryName.trim(), pageable));
    }

    public Page<PostResponse> getPostsByTag(String tagName, Pageable pageable) {
        return mapPostPageToResponse(postRepository.findByTagsNameAndDraftFalse(tagName, pageable));
    }

    /** 키워드(SQL) 검색 — 하이브리드 검색용. 제목·본문 LIKE 검색 결과를 snippet 형태로 반환. */
    public List<com.mk.post_service.dto.PostSearchResultDto> searchByKeyword(String q, int limit) {
        if (q == null || q.trim().isEmpty()) return Collections.emptyList();
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, Math.min(limit, 50));
        Page<Post> page = postRepository.searchByKeyword(q.trim(), pageable);
        return page.getContent().stream()
                .map(p -> {
                    String content = p.getContent() != null ? p.getContent() : "";
                    String snippet = content.length() > 200 ? content.substring(0, 200) + "..." : content;
                    return new com.mk.post_service.dto.PostSearchResultDto(p.getId(), p.getTitle(), snippet);
                })
                .collect(Collectors.toList());
    }

    public List<CategoryResponse> getAllCategoriesWithCount() {
        return categoryRepository.findAll().stream()
                .map(category -> CategoryResponse.fromEntity(category, postRepository.countByCategoryAndDraftFalse(category)))
                .collect(Collectors.toList());
    }

    public List<TagResponse> getAllTagsWithCount() {
        return tagRepository.findAll().stream()
                .map(tag -> TagResponse.builder()
                        .name(tag.getName())
                        .postCount(postRepository.countByTagsAndDraftFalse(tag))
                        .build())
                .collect(Collectors.toList());
    }

    public PostResponse createDraft(PostRequest request, String authenticatedUserId) {
        Long sourceId = request.getDraftSourcePostId();
        Post targetDraft = null;
        if (sourceId != null) {
            Post sourcePost = postRepository.findById(sourceId).orElseThrow(() -> new RuntimeException("원본 게시글 없음"));
            if (sourcePost.isDraft()) throw new RuntimeException("원본 게시글이 올바르지 않습니다");
            if (!sourcePost.getAuthorId().equals(authenticatedUserId)) throw new RuntimeException("권한 없음");
            targetDraft = postRepository
                    .findTopByAuthorIdAndDraftTrueAndDraftSourcePostIdOrderByUpdatedAtDesc(authenticatedUserId, sourceId)
                    .orElse(null);
        }

        if (targetDraft == null) {
            targetDraft = request.toEntity();
            targetDraft.setAuthorId(authenticatedUserId);
            targetDraft.setDraft(true);
            targetDraft.setDraftSourcePostId(sourceId);
        } else {
            targetDraft.setTitle(request.getTitle());
            targetDraft.setContent(request.getContent());
            targetDraft.setCardCoverImageUrl(request.getCardCoverImageUrl());
            targetDraft.setCardCoverVideoUrl(request.getCardCoverVideoUrl());
        }

        applyCategoryAndTags(targetDraft, request);
        Post saved = postRepository.save(targetDraft);
        PostResponse res = PostResponse.fromEntity(saved);
        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(authenticatedUserId));
        res.setAuthorNickname(nicknameMap.getOrDefault(authenticatedUserId, "작성자 알 수 없음"));
        return res;
    }

    public PostResponse updateDraft(Long id, PostRequest request, String authenticatedUserId) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("게시글 없음"));
        if (!post.isDraft()) throw new RuntimeException("임시 저장이 아닙니다");
        if (!post.getAuthorId().equals(authenticatedUserId)) throw new RuntimeException("권한 없음");

        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setCardCoverImageUrl(request.getCardCoverImageUrl());
        post.setCardCoverVideoUrl(request.getCardCoverVideoUrl());
        applyCategoryAndTags(post, request);

        PostResponse res = PostResponse.fromEntity(post);
        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(authenticatedUserId));
        res.setAuthorNickname(nicknameMap.getOrDefault(authenticatedUserId, "작성자 알 수 없음"));
        return res;
    }

    public Page<PostResponse> getMyDrafts(String authorId, Pageable pageable) {
        Page<Post> page = postRepository.findByAuthorIdAndDraftTrue(authorId, pageable);
        List<String> authorIds = page.getContent().stream().map(Post::getAuthorId).distinct().collect(Collectors.toList());
        Map<String, String> nicknameMap = getAuthorNicknamesMap(authorIds);
        return page.map(p -> {
            PostResponse res = PostResponse.fromEntity(p);
            res.setAuthorNickname(nicknameMap.getOrDefault(p.getAuthorId(), "작성자 알 수 없음"));
            return res;
        });
    }

    public PostResponse getDraftByIdForAuthor(Long id, String authorId) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("게시글 없음"));
        if (!post.isDraft() || !post.getAuthorId().equals(authorId)) throw new RuntimeException("게시글 없음");
        PostResponse res = PostResponse.fromEntity(post);
        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(post.getAuthorId()));
        res.setAuthorNickname(nicknameMap.getOrDefault(post.getAuthorId(), "작성자 알 수 없음"));
        return res;
    }

    public PostResponse publishDraft(Long id, String authenticatedUserId) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("게시글 없음"));
        if (!post.isDraft()) throw new RuntimeException("이미 게시된 글입니다");
        if (!post.getAuthorId().equals(authenticatedUserId)) throw new RuntimeException("권한 없음");
        if (post.getDraftSourcePostId() != null) {
            Post source = postRepository.findById(post.getDraftSourcePostId())
                    .orElseThrow(() -> new RuntimeException("원본 게시글 없음"));
            if (!source.getAuthorId().equals(authenticatedUserId)) throw new RuntimeException("권한 없음");
            source.setTitle(post.getTitle());
            source.setContent(post.getContent());
            source.setCardCoverImageUrl(post.getCardCoverImageUrl());
            source.setCardCoverVideoUrl(post.getCardCoverVideoUrl());
            source.setCategory(post.getCategory());
            source.setTags(post.getTags());
            postRepository.delete(post);
            publishPostEvent(source.getId(), source.getTitle(), source.getContent());
            syncSearchIndex(source.getId(), source.getTitle(), source.getContent());
            postRepository.deleteByAuthorIdAndDraftTrueAndDraftSourcePostId(authenticatedUserId, source.getId());
            PostResponse res = PostResponse.fromEntity(source);
            Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(authenticatedUserId));
            res.setAuthorNickname(nicknameMap.getOrDefault(authenticatedUserId, "작성자 알 수 없음"));
            return res;
        }

        post.setDraft(false);
        post.setDraftSourcePostId(null);
        postRepository.save(post);
        publishPostEvent(post.getId(), post.getTitle(), post.getContent());
        syncSearchIndex(post.getId(), post.getTitle(), post.getContent());
        PostResponse res = PostResponse.fromEntity(post);
        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(authenticatedUserId));
        res.setAuthorNickname(nicknameMap.getOrDefault(authenticatedUserId, "작성자 알 수 없음"));
        return res;
    }

    public PostResponse getLatestDraftForSourcePost(Long sourcePostId, String authorId) {
        Post source = postRepository.findById(sourcePostId).orElseThrow(() -> new RuntimeException("게시글 없음"));
        if (source.isDraft()) throw new RuntimeException("대상 게시글이 아닙니다");
        if (!source.getAuthorId().equals(authorId)) throw new RuntimeException("권한 없음");
        Post draft = postRepository
                .findTopByAuthorIdAndDraftTrueAndDraftSourcePostIdOrderByUpdatedAtDesc(authorId, sourcePostId)
                .orElse(null);
        if (draft == null) return null;
        PostResponse res = PostResponse.fromEntity(draft);
        Map<String, String> nicknameMap = getAuthorNicknamesMap(List.of(authorId));
        res.setAuthorNickname(nicknameMap.getOrDefault(authorId, "작성자 알 수 없음"));
        return res;
    }

    private Page<PostResponse> mapPostPageToResponse(Page<Post> postPage) {
        log.info("조회된 게시글 개수: {}", postPage.getContent().size());
        List<String> authorIds = postPage.stream()
                .map(Post::getAuthorId)
                .distinct()
                .collect(Collectors.toList());
        Map<String, String> nicknameMap = getAuthorNicknamesMap(authorIds);
        log.info("가져온 닉네임 맵: {}", nicknameMap);

        return postPage.map(post -> {
            PostResponse res = PostResponse.fromEntity(post);
            res.setAuthorNickname(nicknameMap.getOrDefault(post.getAuthorId(), "작성자 알 수 없음"));
            return res;
        });
    }

    /** Search 서비스가 소비하는 post.events 토픽으로 발행 (임베딩 인덱싱) */
    private void publishPostEvent(Long postId, String title, String content) {
        try {
            kafkaTemplate.send(TOPIC_POST_EVENTS, String.valueOf(postId),
                PostEventPayload.builder()
                    .postId(postId)
                    .title(title)
                    .content(content != null ? content : "")
                    .build());
        } catch (Exception e) {
            log.warn("Kafka post.events 발행 실패 (postId={}): {}", postId, e.getMessage());
        }
    }

    /** 포스트 저장/수정 직후 검색 서비스에 동기 인덱싱 요청 (글 작성 후 검색 즉시 반영) */
    private void syncSearchIndex(Long postId, String title, String content) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("postId", postId);
            body.put("title", title != null ? title : "");
            body.put("content", content != null ? content : "");
            webClient.post()
                .uri(searchServiceUrl + "/api/search/index")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .timeout(Duration.ofSeconds(8))
                .onErrorResume(e -> {
                    log.warn("Search sync index 실패 (postId={}): {}", postId, e.getMessage());
                    return Mono.empty();
                })
                .subscribe();
        } catch (Exception e) {
            log.warn("Search sync index 요청 실패 (postId={}): {}", postId, e.getMessage());
        }
    }

    private Map<String, String> getAuthorNicknamesMap(List<String> authorIds) {
        if (authorIds == null || authorIds.isEmpty()) return Collections.emptyMap();
        List<String> normalizedAuthorIds = authorIds.stream()
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .collect(Collectors.toList());
        if (normalizedAuthorIds.isEmpty()) return Collections.emptyMap();
        try {
            Map<String, String> result = webClient.post()
                    .uri(userServiceUrl + "/user/api/users/nicknames")
                    .bodyValue(normalizedAuthorIds)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, String>>() {})
                    .timeout(java.time.Duration.ofSeconds(5))
                    .onErrorReturn(Collections.emptyMap())    // 실패 시 빈 값 반환
                    .block();
            return result != null ? result : Collections.emptyMap();
        } catch (Exception e) {
            log.error("User Service 통신 실패: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    private void applyCategoryAndTags(Post post, PostRequest request) {
        String rawCategoryName = request.getCategoryName();
        String normalizedCategoryName = rawCategoryName != null ? rawCategoryName.trim() : null;
        if (normalizedCategoryName != null && !normalizedCategoryName.isEmpty()) {
            Category category = categoryRepository.findByNameIgnoreCase(normalizedCategoryName)
                    .orElseGet(() -> categoryRepository.save(Category.builder().name(normalizedCategoryName).build()));
            post.setCategory(category);
        } else {
            post.setCategory(null);
        }

        if (request.getTagNames() != null) {
            Set<Tag> tags = request.getTagNames().stream()
                    .map(name -> tagRepository.findByName(name)
                            .orElseGet(() -> tagRepository.save(Tag.builder().name(name).build())))
                    .collect(Collectors.toSet());
            post.setTags(tags);
        } else {
            post.setTags(new HashSet<>());
        }
    }
}