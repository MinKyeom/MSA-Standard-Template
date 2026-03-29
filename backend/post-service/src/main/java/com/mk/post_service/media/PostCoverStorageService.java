package com.mk.post_service.media;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class PostCoverStorageService {

    private static final long MAX_IMAGE_BYTES = 8L * 1024 * 1024;
    private static final long MAX_VIDEO_BYTES = 24L * 1024 * 1024;

    private static final Map<String, String> MIME_TO_EXT = Map.ofEntries(
            Map.entry("image/jpeg", ".jpg"),
            Map.entry("image/jpg", ".jpg"),
            Map.entry("image/png", ".png"),
            Map.entry("image/gif", ".gif"),
            Map.entry("image/webp", ".webp"),
            Map.entry("video/mp4", ".mp4"),
            Map.entry("video/webm", ".webm")
    );

    @Value("${app.post.cover-upload-dir:./data/post-covers}")
    private String uploadDir;

    @PostConstruct
    public void ensureDir() throws IOException {
        Files.createDirectories(Paths.get(uploadDir));
    }

    /**
     * 저장 후 프론트에서 그대로 쓸 수 있는 경로 (동일 출처 상대 경로).
     */
    public String store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어 있습니다.");
        }
        String ct = file.getContentType();
        if (ct == null) {
            throw new IllegalArgumentException("Content-Type이 없습니다.");
        }
        ct = ct.toLowerCase(Locale.ROOT).split(";")[0].trim();
        String ext = MIME_TO_EXT.get(ct);
        if (ext == null) {
            throw new IllegalArgumentException("허용되지 않는 형식입니다. 이미지(jpeg,png,gif,webp) 또는 짧은 동영상(mp4,webm)만 가능합니다.");
        }
        boolean video = ct.startsWith("video/");
        long max = video ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
        if (file.getSize() > max) {
            throw new IllegalArgumentException(video ? "동영상은 최대 24MB까지 업로드할 수 있습니다." : "이미지는 최대 8MB까지 업로드할 수 있습니다.");
        }

        String name = UUID.randomUUID() + ext;
        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path dest = dir.resolve(name).normalize();
        if (!dest.startsWith(dir)) {
            throw new IOException("잘못된 경로입니다.");
        }

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
        }
        return "/api/posts/media/files/" + name;
    }
}
