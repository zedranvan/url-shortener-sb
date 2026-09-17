package com.url.shortener.controller;

import com.url.shortener.service.UrlRedirectService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@AllArgsConstructor
public class RedirectController {

    private final UrlRedirectService urlMappingService;

    @GetMapping("/{shortUrl}")
    public ResponseEntity<Void> redirect(@PathVariable String shortUrl) {
        String targetUrl = urlMappingService.getOriginalUrl(shortUrl);
        return targetUrl != null
                ? ResponseEntity.status(302).location(URI.create(targetUrl)).build()
                : ResponseEntity.notFound().build();
    }
}