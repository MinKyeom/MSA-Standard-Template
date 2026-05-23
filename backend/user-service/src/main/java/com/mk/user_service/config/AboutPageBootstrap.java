package com.mk.user_service.config;

import com.mk.user_service.entity.AboutPage;
import com.mk.user_service.repository.AboutPageRepository;
import com.mk.user_service.service.AboutPageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AboutPageBootstrap implements ApplicationRunner {

    private final AboutPageRepository aboutPageRepository;
    private final AboutPageService aboutPageService;

    @Override
    public void run(ApplicationArguments args) {
        if (aboutPageRepository.findById(AboutPage.SINGLETON_ID).isEmpty()) {
            aboutPageService.createDefaultPage();
            log.info("Default About page seeded in mk_user database.");
        }
    }
}
