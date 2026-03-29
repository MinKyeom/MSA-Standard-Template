package com.mk.post_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@Table(name = "daily_visit")
public class DailyVisit {

    @Id
    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    @Column(name = "visit_count", nullable = false)
    private Long visitCount = 0L;

    @PrePersist
    protected void onCreate() {
        if (visitCount == null) visitCount = 0L;
    }
}
