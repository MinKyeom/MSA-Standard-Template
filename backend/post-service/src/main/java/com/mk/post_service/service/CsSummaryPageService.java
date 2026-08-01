package com.mk.post_service.service;

import com.mk.post_service.dto.CsSummaryPageRequest;
import com.mk.post_service.dto.CsSummaryPageResponse;
import com.mk.post_service.entity.CsSummaryPage;
import com.mk.post_service.repository.CsSummaryPageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CsSummaryPageService {

    private final CsSummaryPageRepository csSummaryPageRepository;

    @Transactional(readOnly = true)
    public CsSummaryPageResponse getCsSummaryPage() {
        return csSummaryPageRepository.findById(CsSummaryPage.SINGLETON_ID)
                .map(CsSummaryPageResponse::fromEntity)
                .orElseGet(() -> CsSummaryPageResponse.builder()
                        .title("CS Notes")
                        .content("")
                        .updatedAt(null)
                        .build());
    }

    @Transactional
    public CsSummaryPageResponse updateCsSummaryPage(CsSummaryPageRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("제목은 비워둘 수 없습니다.");
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new IllegalArgumentException("본문은 비워둘 수 없습니다.");
        }

        CsSummaryPage page = csSummaryPageRepository.findById(CsSummaryPage.SINGLETON_ID)
                .orElseGet(this::createDefaultPage);

        page.setTitle(request.getTitle().trim());
        page.setContent(request.getContent());
        page.setUpdatedAt(LocalDateTime.now());

        return CsSummaryPageResponse.fromEntity(csSummaryPageRepository.save(page));
    }

    @Transactional
    public CsSummaryPage createDefaultPage() {
        LocalDateTime now = LocalDateTime.now();
        CsSummaryPage page = CsSummaryPage.builder()
                .id(CsSummaryPage.SINGLETON_ID)
                .title("CS Notes")
                .content(defaultMarkdownContent())
                .updatedAt(now)
                .build();
        return csSummaryPageRepository.save(page);
    }

    private static String defaultMarkdownContent() {
        return """
                # CS Notes

                면접·정처기·실무에서 쓰는 CS 개념을 포스터 형식으로 요약합니다.

                - 전체 원문(포스트): [/post/14](/post/14)
                - CS 카테고리 글: [/post?category=CS](/post?category=CS)
                - System Structure: [/structure](/structure)

                ---

                # CS 공부(정처기 실기 대비)

                ## 1장 요구사항 분석

                <br>
                <details>
                <summary>나선형 모형</summary>

                - 나선으로 돌면서 점진적으로 개발
                  폭포수 모형
                - 한 번 개발 끝나면 다음 단계
                  애자일 모형
                - 기민하고 유연하게 대처하면서 반복 개발 대응 방식
                - 협업이 포인트 빠른 대응
                </details>

                <br>

                <details>
                <summary> 기능요구사항</summary>

                - 출력값, 사용자 기능
                </details>

                <br>

                <details>
                <summary>  비기능 요구사항</summary>

                - 성능, 인터페이스 요구사항, 테스트 요구사항, 품질(가용성, 정합성, 대응성,이식성 등) , 제약사항

                </details>

                <br>

                <details>
                <summary>요구사항 분석</summary>

                - 사용자 요구사항 문서화
                </details>

                <br>

                <details>
                <summary>자료흐름도</summary>

                - 프로세스(데이터 변환),자료 흐름(이동), 자료 저장소(저장), 단말(출력)
                </details>

                <br>

                <details>
                <summary>HIPO</summary>

                - 시스템 실행 입출력 표현
                - 하향식 개발에 쓰임
                </details>

                <br>

                <details>
                <summary>연관 관계</summary>

                - 둘중 하나가 사라져도 영향이 없는 관계
                </details>

                <br>

                <details>
                <summary>집합관계</summary>

                - 부품 여부로 연관관계와 구분
                </details>

                <br>

                <details>
                <summary>의존관계</summary>

                - 연관관계에서 서로에게 영향을 주면 의존관계
                </details>

                <br>

                ### UML 다이어그램

                <br>

                <details>
                <summary>UML 뜻</summary>  
                - UML:Unified modeling language(통합모델링 언어)

                > 소프트웨어를 만들기 전에 그리는 설계도 표준규격

                </details>

                <br>

                <details>
                <summary>구조 다이어그램 vs 행위 다이어그램</summary>

                - 구조 다이어그램(정적): 시스템의 뼈대나 구성을 보여줌

                  > ex: 클래스, 패키지, 컴포넌트 다이어그램

                - 행위 다이어그램(동적):시스템이 어떻게 움직이고 사용자와 주고받는지 흐름을 보여줌

                  > ex: 유스케이스, 시퀀스 다이어그램

                </details>

                <br>

                <details>
                <summary>구조적 다이어그램</summary>

                - 클래스 다이어그램

                  > 클래스 관계 표현

                - 객체 다이어그램

                  > 클래스에 속한 객체들 사이의 관계로 표현됨  
                  > feat. 럼바우: 객체지향 분석 기법에서 객체 모델링

                - 컴포넌트 다이어그램

                  > 컴포넌트 간의 관계로 표현  
                  > 구현 단계

                - 배치 다이어그램

                  > 인프라,운영 관점  
                  > 결과물,

                - 복합체 구조 다이어그램

                  > 클래스, 컴포넌트 복합 구조를 표현

                - 패키지 다이어그램

                  > 클래스 다이어그램 vs 패키지 다이어그램
                  >
                  > > 클래스 다이어그램:나무  
                  > > ex) UserService가 UserRepository를 참조하고, UserRepository가 User 엔티티를 사용한다는 세부적인 클래스 간의 관계를 보여줍니다.  
                  > > 패키지 다이어그램: 숲  
                  > > 수십~수백 개에 달하는 클래스 간의 관계를 일일이 다 그리면 다이어그램이 너무 복잡해져서 아무도 알아볼 수 없는 '스파게티 도면'이 됩니다. 그래서 클래스들을 폴더(패키지)에 넣고, "Service 패키지가 Repository 패키지를 참조한다"처럼 거시적으로 묶어서 보여주는 것입니다.  
                  > > 해결하고자 하는 문제의 차이  
                  > >  두 다이어그램이 '관계'를 통해 확인하려는 목적이 다릅니다.

                  > > 클래스 다이어그램의 관계 관점  
                  > >  "이 객체가 저 객체의 메서드를 호출하거나 소유하는가?"  
                  > >  관심사: 상속, 객체 협력, 객체 간 메시지 전달 경로  
                  > >  질문: "Order 클래스가 Item 클래스의 목록을 리스트로 갖고 있는가?"
                  > > <br>
                  > > 패키지 다이어그램의 관계 관점  
                  > >  "이 모듈(폴더)이 저 모듈(폴더)에 통째로 의존하고 있는가?"  
                  > >  관심사: 아키텍처 규칙 준수, 모듈 간 결합도, 순환 의존성(Circular Dependency)  
                  > >  질문: "UI 영역(패키지)이 DB 처리 영역(패키지)을 직접 참조하는 구조적 실수를 범하고 있지 않은가?"

                  </details>

                <br>
                <details>
                <summary>행위 다이어그램</summary>

                - 유스케이스 다이어그램(Use Case Diagram)

                  > 사용자의 요구를 분석하는 것으로, 기능 모델링 작업 시 사용
                  > 사용자가 다른 외부 시스템들이 개발될 시스템을 이용해 수행할 수 있는 기능을 사용자 관점에서 표현한 것이다.

                  > feat.UAT(User Acceptance Testing)로 소프트웨어를 실제 운영 환경으로 배포하기 전에 이 시스템이 비즈니스 요구사항과 목적에 맞게 제대로 만들어졌는가?를 실제 사용자나 비즈니스 담당자가 직접 검증하는 최종 승인단계의 테스트

                - 순차 다이어그램

                  > 상호작용하는 시스템이나 객체들이 주고받는 메시지를 표현 할 때 사용

                - 커뮤니케이션 다이어그램

                  > 동작에 참여하는 객체들이 주고받는 메세지와 객체들간의 연관 관계를 표현할 때 사용

                - 상태 다이어그램

                  > 하나의 객체가 자신이 속한 클래스의 상태 변화(어떻게 호출되고 어떻게 변하는 지) 혹은 다른 객체와의 상호작용에 따라 상태가 변화가 되는 지를 표현 할 때 사용

                  > feat. 럼바우(객체지향 분석기법에서 동적 모델링에 활용)

                - 활동 다이어그램

                  > 시스템이 어떤 기능을 수행하는 지 객체의 처리 로직이나 처리 흐름의 순서를 표현할 때 사용

                - 상호작용 개요 다이어그램

                  > 상호작용 다이어그램 간의 제어 흐름을 표현할 때 사용

                - 타이밍 다이어그램

                  > 객체 상태 변화와 시간 제약을 명시적으로 표현할 때 사용

                - 구분  
                  행위 다이어그램 특징: 좀 더 흐름에 치중된 부분을 보여줌
                  유스케이스: 사용자의 사례 중심  
                  순차 다이어그램: 시스템과 객체들이 주고받는 메세지(시스템<>객체)
                  커뮤니케이션 다이어그램: 객체들이 주고받는 메세지와 연관 관계(객체<>객체)  
                  상태 다이어그램: 객체의 변화 흐름 그리고 다른 객체의 영향을 받음에 따름 변화
                  활동 다이어그램: 시스템의 기능 수행 및 객체의 처리 로직 조건에 따른 흐름
                  상호작용 다이어그램:
                  타이밍 다이어그램: 객체의 상태 변화 시간 제약 명시

                </details>
                """;
    }
}
