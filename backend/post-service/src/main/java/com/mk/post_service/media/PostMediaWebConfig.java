package com.mk.post_service.media;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class PostMediaWebConfig implements WebMvcConfigurer {

    @Value("${app.post.cover-upload-dir:./data/post-covers}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String abs = Paths.get(uploadDir).toAbsolutePath().normalize().toString().replace("\\", "/");
        if (!abs.endsWith("/")) {
            abs = abs + "/";
        }
        registry.addResourceHandler("/api/posts/media/files/**")
                .addResourceLocations("file:" + abs);
    }
}
