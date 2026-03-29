package com.mk.post_service.dto;

import com.mk.post_service.entity.Post;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PostRequest {
    private String title;
    private String content;
    private String categoryName;
    private List<String> tagNames;
    /** 기존 공개 글 수정용 임시저장 연결 키 */
    private Long draftSourcePostId;

    private String cardCoverImageUrl;
    private String cardCoverVideoUrl;

    public Post toEntity() {
        Post post = new Post();
        post.setTitle(this.title);
        post.setContent(this.content);
        post.setCardCoverImageUrl(this.cardCoverImageUrl);
        post.setCardCoverVideoUrl(this.cardCoverVideoUrl);
        return post;
    }
}
