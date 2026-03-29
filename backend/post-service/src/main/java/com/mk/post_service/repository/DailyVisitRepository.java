package com.mk.post_service.repository;

import com.mk.post_service.entity.DailyVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface DailyVisitRepository extends JpaRepository<DailyVisit, LocalDate> {
}
