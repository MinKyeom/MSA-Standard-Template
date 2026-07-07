package com.mk.post_service.entity;


import jakarta.persistence.*;
import lombok.*;


@Entity
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name="cs_page")
public class CsPage {

  // DB의 싱글톤과 동일한 개념(단 하나만 존재하는 테이블의 ID를 관리하기 위해)
  // AboutPage와 다른 DB라 동일하게 작성해도 문제 없음
  public static final String SINGLETON_ID = "main";

  @Column(name= "author_id", nullable = false, length=50)
  private String authorId;

  @Column(name="view_count", nullable =false)
  private Long viewCount = 0L;

}
