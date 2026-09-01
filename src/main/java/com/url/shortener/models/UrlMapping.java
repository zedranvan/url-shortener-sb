package com.url.shortener.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@ToString(exclude = {"clickEvents", "user"}) // 排除双向关联字段，防止死循环
@Table(
        name = "url_mapping",
        indexes = {
                // columnList 必须使用数据库物理字段名（下划线命名）
                @Index(name = "idx_short_url", columnList = "short_url", unique = true),
                @Index(name = "idx_user_id", columnList = "user_id")
        }
)
public class UrlMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "original_url", nullable = false, columnDefinition = "TEXT")
    private String originalUrl;

    // 移除 @Column 上的 unique = true，由 @Table 中的 @Index 统一维护
    @Column(name = "short_url", nullable = false, length = 16)
    private String shortUrl;

    @Column(name = "click_count", nullable = false)
    private int clickCount = 0;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @ManyToOne(fetch = FetchType.LAZY) // 建议配置懒加载，提升单表查询性能
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "urlMapping", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ClickEvent> clickEvents;
}