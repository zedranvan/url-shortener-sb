package com.url.shortener.service;

import com.url.shortener.dtos.ClickEventDTO;
import com.url.shortener.models.ClickEvent;
import com.url.shortener.models.UrlMapping;
import com.url.shortener.models.User;
import com.url.shortener.repository.ClickEventRepository;
import com.url.shortener.repository.UrlMappingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor

public class UrlAnalyticsService {
    private final UrlMappingRepository urlMappingRepository;
    private final ClickEventRepository  clickEventRepository;
    public List<ClickEventDTO> getClickEventsByDate(String shortUrl, LocalDateTime start, LocalDateTime end) {
        UrlMapping urlMapping = urlMappingRepository.findByShortUrl(shortUrl);
        if(urlMapping == null) return List.of();
        return clickEventRepository.findByUrlMappingAndClickDateBetween(urlMapping,start,end).stream()
                .collect(Collectors.groupingBy(click -> click.getClickDate()
                        .toLocalDate(),Collectors.counting()))
                .entrySet().stream()
                .map(entry -> new ClickEventDTO(entry.getKey(),entry.getValue()))
                .toList();
    }

    public Map<LocalDate,Long>getTotalClicksByUserAndDate(User user, LocalDate start,LocalDate end){
        List<UrlMapping> urlMappings = urlMappingRepository.findByUser(user);
        List<ClickEvent>clickEvents = clickEventRepository.findByUrlMappingInAndClickDateBetween(
                urlMappings,start.atStartOfDay(),end.plusDays(1).atStartOfDay()
        );
        return clickEvents.stream().collect(Collectors.groupingBy(clickEvent -> clickEvent.getClickDate().toLocalDate(),Collectors.counting()));
    }

}

