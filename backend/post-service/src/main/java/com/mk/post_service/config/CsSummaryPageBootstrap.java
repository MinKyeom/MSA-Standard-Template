package com.mk.post_service.config;

import com.mk.post_service.entity.CsSummaryPage;
import com.mk.post_service.repository.CsSummaryPageRepository;
import com.mk.post_service.service.CsSummaryPageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CsSummaryPageBootstrap implements ApplicationRunner {

    private final CsSummaryPageRepository csSummaryPageRepository;
    private final CsSummaryPageService csSummaryPageService;

    @Override
    public void run(ApplicationArguments args) {
        if (csSummaryPageRepository.findById(CsSummaryPage.SINGLETON_ID).isEmpty()) {
            csSummaryPageService.createDefaultPage();
            log.info("Default CS summary page seeded in post-service database.");
        }
    }
}
