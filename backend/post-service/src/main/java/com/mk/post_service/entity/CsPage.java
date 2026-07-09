package com.mk.post_service.entity;


import org.hibernate.annotations.Columns;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name="cs_page")
public class CsPage {

  // DB의 싱글톤과 동일한 개념(단 하나만 존재하는 테이블의 ID를 관리하기 위해)
  // AboutPage와 다른 DB라 동일하게 작성해도 문제 없음
  public static final String SINGLETON_ID = "main";

  @Id
  @Column(length = 32)
  private String id;

  @Column(nullable = false, length =200)
  private String title

  // Markdown text 필드
  @Column(nullable = false, columnDefinition = "TEXT")
  private String content;

  @Column(nullable = false)
  private LocalDateTime updatedAt;



}
