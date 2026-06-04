package com.kostone.marble.service.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

/**
 * Stores uploaded files to the local filesystem under app.upload-dir.
 * In Railway production, app.upload-dir should point to a persisted volume mount,
 * or this service should be replaced with an object storage adapter.
 */
@Service
@Slf4j
public class FileStorageService {

    private final Path uploadDir;

    public FileStorageService(@Value("${app.upload-dir:uploads}") String uploadDirStr) {
        this.uploadDir = Paths.get(uploadDirStr).toAbsolutePath();
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create upload directory: " + uploadDir, e);
        }
    }

    /**
     * Saves a multipart file and returns a relative URL path for storage in the DB.
     * E.g. "/files/layouts/abc123.pdf"
     */
    public String store(MultipartFile file, String subfolder) {
        String filename = UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());
        Path destination = uploadDir.resolve(subfolder).resolve(filename);
        try {
            Files.createDirectories(destination.getParent());
            file.transferTo(destination);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file: " + filename, e);
        }
        log.info("Stored file: {}", destination);
        return "/files/" + subfolder + "/" + filename;
    }

    private String sanitize(String name) {
        if (name == null) return "file";
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
