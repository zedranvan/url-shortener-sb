package com.url.shortener.utils;

import com.google.common.hash.BloomFilter;
import com.google.common.hash.Funnels;
import com.url.shortener.models.UrlMapping;
import com.url.shortener.repository.UrlMappingRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ShortUrlBloomFilter {
    private final UrlMappingRepository urlMappingRepository;
    private BloomFilter<String>bloomFilter;
    @PostConstruct
    public void init() {
        bloomFilter = BloomFilter.create(
                Funnels.stringFunnel(StandardCharsets.UTF_8),
                1000000,
                0.0001
        );
        List<UrlMapping> allUrls = urlMappingRepository.findAll();
        for(UrlMapping urlMapping : allUrls) {
            if(urlMapping.getShortUrl() !=null) {
                bloomFilter.put(urlMapping.getShortUrl());
            }
        }
        log.info("布隆过滤器初始化完成，总共预热{}条短链条数据",allUrls.size());
    }

    public void add(String shortUrl) {
        bloomFilter.put(shortUrl);
    }

    public boolean mightContain(String shortUrl){
        return bloomFilter.mightContain(shortUrl);
    }

}
