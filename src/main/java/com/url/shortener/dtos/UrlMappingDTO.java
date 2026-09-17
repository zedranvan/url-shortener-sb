package com.url.shortener.dtos;

import com.url.shortener.models.UrlMapping;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class UrlMappingDTO {
    private Long id;
    private String originalUrl;
    private String shortUrl;
    private int clickCount;
    private LocalDateTime createdDate;
    private String username;

    public static UrlMappingDTO from(UrlMapping mapping) {
        if (mapping == null) {
            return null;
        }
        return UrlMappingDTO.builder()
                .id(mapping.getId())
                .originalUrl(mapping.getOriginalUrl())
                .shortUrl(mapping.getShortUrl())
                .clickCount(mapping.getClickCount())
                .createdDate(mapping.getCreatedDate())
                .username(mapping.getUser() != null
                        ? mapping.getUser().getUsername() : null)
                .build();

    }
}