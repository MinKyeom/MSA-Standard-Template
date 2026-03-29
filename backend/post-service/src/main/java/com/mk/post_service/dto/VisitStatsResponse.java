package com.mk.post_service.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class VisitStatsResponse {
    private long today;
    private long total;
}
