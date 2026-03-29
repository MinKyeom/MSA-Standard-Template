package com.mk.post_service.repository;

import com.mk.post_service.entity.Post;
import com.mk.post_service.entity.Category;
import com.mk.post_service.entity.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

    @Query(value = "SELECT p FROM Post p WHERE p.draft = false",
           countQuery = "SELECT COUNT(p) FROM Post p WHERE p.draft = false")
    Page<Post> findAllWithDetails(Pageable pageable);

    Page<Post> findByCategoryNameIgnoreCaseAndDraftFalse(String categoryName, Pageable pageable);

    Page<Post> findByTagsNameAndDraftFalse(String tagName, Pageable pageable);

    long countByCategoryAndDraftFalse(Category category);

    long countByTagsAndDraftFalse(Tag tag);

    /** 조회수 기준 인기글 (공개 글만) */
    @Query("SELECT p FROM Post p WHERE p.draft = false ORDER BY p.viewCount DESC")
    List<Post> findTopByViewCount(Pageable pageable);

    /** 키워드 검색 (공개 글만) */
    @Query("SELECT p FROM Post p WHERE p.draft = false AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(p.content) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Post> searchByKeyword(@Param("q") String q, Pageable pageable);

    Page<Post> findByAuthorIdAndDraftTrue(String authorId, Pageable pageable);

    List<Post> findByAuthorIdAndDraftTrueAndDraftSourcePostId(String authorId, Long draftSourcePostId);

    Optional<Post> findTopByAuthorIdAndDraftTrueAndDraftSourcePostIdOrderByUpdatedAtDesc(String authorId, Long draftSourcePostId);

    void deleteByAuthorIdAndDraftTrueAndDraftSourcePostId(String authorId, Long draftSourcePostId);
}
