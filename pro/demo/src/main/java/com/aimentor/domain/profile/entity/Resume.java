package com.aimentor.domain.profile.entity;

import com.aimentor.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

/** 이력서 엔티티 */
@Entity
@Table(name = "resumes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Resume extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Lob
    private String content;

    private String fileUrl; // S3 URL

    public void update(String title, String content, String fileUrl) {
        this.title   = title;
        this.content = content;
        if (fileUrl != null) this.fileUrl = fileUrl;
    }
}
