package com.aimentor.domain.profile.entity;

import com.aimentor.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

/** 자기소개서 엔티티 */
@Entity
@Table(name = "cover_letters")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CoverLetter extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Lob
    private String content;

    public void update(String title, String content) {
        this.title   = title;
        this.content = content;
    }
}
