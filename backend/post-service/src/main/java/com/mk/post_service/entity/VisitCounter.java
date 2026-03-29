package com.mk.post_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "visit_counter")
public class VisitCounter {

    @Id
    @Column(name = "counter_id", nullable = false)
    private Long counterId = 1L;

    @Column(name = "total_visits", nullable = false)
    private Long totalVisits = 0L;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (counterId == null) counterId = 1L;
        if (totalVisits == null) totalVisits = 0L;
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }
}
