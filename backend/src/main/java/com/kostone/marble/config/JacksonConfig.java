package com.kostone.marble.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/**
 * Ensures JSON decimal numbers are parsed as BigDecimal (not double) throughout
 * the application. Prevents floating-point precision loss on financial and
 * dimensional values before the data even reaches the service layer.
 */
@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                // Parse all JSON decimal numbers as BigDecimal, not double
                .enable(DeserializationFeature.USE_BIG_DECIMAL_FOR_FLOATS)
                // Serialize BigDecimal as plain string (no scientific notation)
                .enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                .registerModule(new JavaTimeModule());
    }
}
