package com.url.shortener.service;

import com.url.shortener.dtos.UrlMappingDTO;
import com.url.shortener.models.UrlMapping;
import com.url.shortener.models.User;
import com.url.shortener.repository.UrlMappingRepository;
import com.url.shortener.utils.Base62Util;
import com.url.shortener.utils.ShortUrlBloomFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ShortUrlService {

    private final UrlMappingRepository urlMappingRepository;
    private final StringRedisTemplate stringRedisTemplate;
    private final ShortUrlBloomFilter shortUrlBloomFilter;

    public UrlMappingDTO createShortUrl(String originalUrl, User user) {
        UrlMapping mapping = urlMappingRepository.save(
                UrlMapping.builder()
                        .originalUrl(originalUrl)
                        .shortUrl(UUID.randomUUID().toString().substring(0,8))
                        .user(user)
                        .createdDate(LocalDateTime.now())
                        .build()
        );
        String shortCode = Base62Util.encode(mapping.getId());
        mapping.setShortUrl(shortCode);
        urlMappingRepository.save(mapping);
        shortUrlBloomFilter.add(shortCode);
        stringRedisTemplate.opsForValue().set("short:"+shortCode,originalUrl,7, TimeUnit.DAYS);
        return UrlMappingDTO.from(mapping);

   }

   public List<UrlMappingDTO> getUrlsByUser(User user) {
        return urlMappingRepository.findByUser(user).stream()
                .map(UrlMappingDTO::from)
                .toList();
   }
}
