package com.url.shortener.controller;

import com.url.shortener.dtos.ClickEventDTO;
import com.url.shortener.dtos.UrlMappingDTO;
import com.url.shortener.models.User;
import com.url.shortener.service.ShortUrlService;
import com.url.shortener.service.UrlAnalyticsService;
import com.url.shortener.service.UserService;
import lombok.AllArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/urls")
@AllArgsConstructor
public class UrlMappingController {
    private final ShortUrlService shortUrlService;
    private final UrlAnalyticsService urlAnalyticsService;
    private final UserService userService;

    @PostMapping("/shorten")
    @PreAuthorize("hasRole('USER')")
    public UrlMappingDTO createShortUrl(@RequestBody Map<String,String>request, Principal principal) {
        User user = userService.findByUsername(principal.getName());
        return shortUrlService.createShortUrl(request.get("originalUrl"),user);
    }

    @GetMapping("/myurls")
    @PreAuthorize("hasRole('USER')")
    public List<UrlMappingDTO> getMyUrls(Principal principal) {
        User user = userService.findByUsername(principal.getName());
        return shortUrlService.getUrlsByUser(user);
    }


    @GetMapping("/analytics/{shortUrl}")
    @PreAuthorize("hasRole('USER')")
    public List<ClickEventDTO> getUrlAnalytics(@PathVariable String shortUrl,
                                               @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
                                               @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {


        return urlAnalyticsService.getClickEventsByDate(shortUrl, startDate, endDate);

    }

}