package com.mk.post_service.controller;

import com.mk.post_service.dto.VisitStatsResponse;
import com.mk.post_service.service.VisitService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts/visits")
@RequiredArgsConstructor
public class VisitController {

    private final VisitService visitService;

    @PostMapping("/record")
    public VisitStatsResponse recordVisit() {
        return visitService.recordVisitAndGetStats();
    }

    @GetMapping("/stats")
    public VisitStatsResponse getStats() {
        return visitService.getStats();
    }
}
