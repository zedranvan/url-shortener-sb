package com.url.shortener.controller;

import com.url.shortener.dtos.ClickEventDTO;
import com.url.shortener.dtos.UrlMappingDTO;
import com.url.shortener.models.User;
import com.url.shortener.service.ShortUrlService;
import com.url.shortener.service.UrlAnalyticsService;
import com.url.shortener.service.UserService;
import lombok.AllArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
                                               @RequestParam("startDate") String startDate,
                                               @RequestParam("endDate") String endDate) {


        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        LocalDateTime startDateTime = LocalDateTime.parse(startDate,formatter);
        LocalDateTime endDateTime = LocalDateTime.parse(endDate,formatter);
        return urlAnalyticsService.getClickEventsByDate(shortUrl,startDateTime,endDateTime);
    }

}