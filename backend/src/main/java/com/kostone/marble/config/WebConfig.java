package com.kostone.marble.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String abs = Paths.get(uploadDir).toAbsolutePath() + "/";
        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:" + abs);

        // SPA fallback: any unmatched, non-API, non-file GET request (e.g. a
        // browser refresh on /consultant/orders/<id>) serves index.html instead
        // of a 404. React Router then takes over client-side and its own
        // catch-all route redirects to /login (or the user's dashboard) based
        // on the JWT in localStorage.
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        if (resourcePath.startsWith("api/") || resourcePath.startsWith("files/")) {
                            return null;
                        }
                        Resource requested = location.createRelative(resourcePath);
                        if (requested.exists() && requested.isReadable()) {
                            return requested;
                        }
                        Resource index = new ClassPathResource("/static/index.html");
                        return index.exists() ? index : null;
                    }
                });
    }
}
