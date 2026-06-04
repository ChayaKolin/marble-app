package com.kostone.marble.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Serves uploaded files (photos, PDFs) via /files/** without auth.
 * Registered as a standard Spring MVC controller so Spring Security's
 * AntPathRequestMatcher can match and permitAll it correctly.
 *
 * Security: files are served to anyone with the URL — acceptable for
 * non-sensitive project documents and site photos.
 */
@RestController
@RequestMapping("/files")
public class FileServeController {

    private final Path uploadRoot;

    public FileServeController(@Value("${app.upload-dir:uploads}") String uploadDir) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath();
    }

    @GetMapping("/**")
    public ResponseEntity<Resource> serveFile(HttpServletRequest request) {
        // Extract path after /files/
        String servletPath = request.getRequestURI();
        String filePath = servletPath.substring("/files/".length());

        try {
            Path resolvedPath = uploadRoot.resolve(filePath).normalize();

            // Security: prevent path traversal outside upload root
            if (!resolvedPath.startsWith(uploadRoot)) {
                return ResponseEntity.badRequest().build();
            }

            Resource resource = new UrlResource(resolvedPath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = detectContentType(filePath);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                    .body(resource);

        } catch (MalformedURLException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    private String detectContentType(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".pdf"))  return MediaType.APPLICATION_PDF_VALUE;
        if (lower.endsWith(".png"))  return MediaType.IMAGE_PNG_VALUE;
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return MediaType.IMAGE_JPEG_VALUE;
        if (lower.endsWith(".gif"))  return MediaType.IMAGE_GIF_VALUE;
        if (lower.endsWith(".webp")) return "image/webp";
        return MediaType.APPLICATION_OCTET_STREAM_VALUE;
    }
}
