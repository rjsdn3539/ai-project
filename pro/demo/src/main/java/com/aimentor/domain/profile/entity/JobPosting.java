package com.aimentor.domain.profile.entity;

import com.aimentor.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

/** 채용공고 엔티티 */
@Entity
@Table(name = "job_postings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class JobPosting extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String position;

    @Lob
    private String description;

    private String fileUrl; // S3 URL

    public void update(String company, String position, String description, String fileUrl) {
        this.company     = company;
        this.position    = position;
        this.description = description;
        if (fileUrl != null) this.fileUrl = fileUrl;
    }
}
