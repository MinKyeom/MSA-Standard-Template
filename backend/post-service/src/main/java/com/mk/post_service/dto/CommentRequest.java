package com.mk.post_service.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CommentRequest {
    private String content;
    /** 답글 대상 댓글 ID (같은 게시글 내, 제한 없음) */
    private Long parentCommentId;
}