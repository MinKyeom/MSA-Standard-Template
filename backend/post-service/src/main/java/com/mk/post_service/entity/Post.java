package com.mk.post_service.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter @Setter
@Table(name = "posts", indexes = @Index(name = "idx_post_created_at", columnList = "createdAt"))
// @Table(name = "posts")
public class Post {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    // @Lob
    @Column(columnDefinition = "TEXT") //PostgreSQL 오류 방지
    private String content; 

    // ⭐ 수정: User 엔티티와의 관계 제거
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "user_id") 
    // private User user; // 삭제
    
    // ⭐ 추가: 작성자의 ID만 저장
    @Column(name = "author_id", nullable = false, length = 50) 
    private String authorId; 

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "view_count", nullable = false)
    private Long viewCount = 0L;

    /** true면 목록·검색·공개 상세에 노출되지 않음 (작성자만 임시저장 API로 접근) */
    @Column(name = "draft", nullable = false)
    private boolean draft = false;

    /** 기존 공개 글을 수정하기 위한 임시저장의 원본 글 ID */
    @Column(name = "draft_source_post_id")
    private Long draftSourcePostId;

    /** 메인·목록 카드 썸네일 (외부 URL). 비어 있으면 기본 플레이스홀더 */
    @Column(name = "card_cover_image_url", length = 2048)
    private String cardCoverImageUrl;

    /** 카드 배경 짧은 동영상 URL(선택). 설정 시 이미지보다 우선 */
    @Column(name = "card_cover_video_url", length = 2048)
    private String cardCoverVideoUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category; 

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "post_tag",
        joinColumns = @JoinColumn(name="post_id"),
        inverseJoinColumns = @JoinColumn(name="tag_id")
    )
    private Set<Tag> tags = new HashSet<>(); 

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}