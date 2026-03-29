package com.mk.post_service.repository;

import com.mk.post_service.entity.VisitCounter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VisitCounterRepository extends JpaRepository<VisitCounter, Long> {
}
