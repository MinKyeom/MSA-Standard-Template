package com.mk.post_service.service;

import com.mk.post_service.dto.VisitStatsResponse;
import com.mk.post_service.entity.DailyVisit;
import com.mk.post_service.entity.VisitCounter;
import com.mk.post_service.repository.DailyVisitRepository;
import com.mk.post_service.repository.VisitCounterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class VisitService {

    private static final Long COUNTER_ID = 1L;

    private final VisitCounterRepository visitCounterRepository;
    private final DailyVisitRepository dailyVisitRepository;

    public VisitStatsResponse recordVisitAndGetStats() {
        VisitCounter counter = visitCounterRepository.findById(COUNTER_ID)
                .orElseGet(() -> visitCounterRepository.save(new VisitCounter()));

        counter.setTotalVisits((counter.getTotalVisits() == null ? 0L : counter.getTotalVisits()) + 1L);
        visitCounterRepository.save(counter);

        LocalDate today = LocalDate.now();
        DailyVisit dailyVisit = dailyVisitRepository.findById(today)
                .orElseGet(() -> {
                    DailyVisit created = new DailyVisit();
                    created.setVisitDate(today);
                    created.setVisitCount(0L);
                    return created;
                });
        dailyVisit.setVisitCount((dailyVisit.getVisitCount() == null ? 0L : dailyVisit.getVisitCount()) + 1L);
        dailyVisitRepository.save(dailyVisit);

        return new VisitStatsResponse(dailyVisit.getVisitCount(), counter.getTotalVisits());
    }

    @Transactional(readOnly = true)
    public VisitStatsResponse getStats() {
        long total = visitCounterRepository.findById(COUNTER_ID)
                .map(VisitCounter::getTotalVisits)
                .orElse(0L);

        long today = dailyVisitRepository.findById(LocalDate.now())
                .map(DailyVisit::getVisitCount)
                .orElse(0L);

        return new VisitStatsResponse(today, total);
    }
}
