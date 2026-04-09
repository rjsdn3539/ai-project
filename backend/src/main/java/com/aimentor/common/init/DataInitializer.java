package com.aimentor.common.init;

import com.aimentor.domain.book.entity.Book;
import com.aimentor.domain.book.repository.BookRepository;
import java.util.List;
import com.aimentor.domain.subscription.SubscriptionTier;
import com.aimentor.domain.user.entity.Role;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BookRepository bookRepository;

    @Value("${admin.email:admin@aimentor.com}")
    private String adminEmail;

    @Value("${admin.password:admin1234}")
    private String adminPassword;

    @Value("${admin.name:admin}")
    private String adminName;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(adminEmail)) {
            userRepository.findByEmail(adminEmail).ifPresent(existing -> {
                if (existing.getEffectiveTier() != SubscriptionTier.PREMIUM) {
                    existing.changeSubscription(SubscriptionTier.PREMIUM, null);
                    userRepository.save(existing);
                }
            });
            initMockBook();
            return;
        }

        User admin = User.builder()
                .email(adminEmail)
                .name(adminName)
                .password(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .build();
        admin.changeSubscription(SubscriptionTier.PREMIUM, null);

        userRepository.save(admin);
        log.info("초기 관리자 계정 생성: {}", adminEmail);

        initMockBook();
    }

    @Transactional
    private void initMockBook() {
        bookRepository.deleteBySource("mock");

        List<Book> books = List.of(
            // 자바
            mockBook("자바의 정석", "남궁성", "도우출판", "9788994492032", 32000, "https://image.aladin.co.kr/product/28546/62/cover500/8994492038_1.jpg", "자바 프로그래밍의 기본부터 심화까지 다루는 국내 최고의 자바 입문서"),
            mockBook("이펙티브 자바", "조슈아 블로크", "인사이트", "9788966262281", 36000, "https://image.aladin.co.kr/product/19756/54/cover500/8966262287_1.jpg", "자바 플랫폼 최선의 관행을 정리한 필독서"),
            mockBook("자바 OOP 완벽 가이드", "김정현", "한빛미디어", "9791169210553", 28000, "https://image.aladin.co.kr/product/31686/9/cover500/k952933166_1.jpg", "객체지향 프로그래밍을 자바로 완벽하게 이해하는 책"),
            // 스프링
            mockBook("스프링 부트와 AWS로 혼자 구현하는 웹 서비스", "이동욱", "프리렉", "9788965402602", 32000, "https://image.aladin.co.kr/product/23101/68/cover500/8965402603_1.jpg", "스프링 부트로 실무 웹 서비스를 구현하는 방법"),
            mockBook("토비의 스프링 3.1", "이일민", "에이콘출판사", "9788960773431", 52000, "https://image.aladin.co.kr/product/6744/40/cover500/8960773433_1.jpg", "스프링 프레임워크의 원리와 심화 활용"),
            mockBook("스프링 MVC 핵심 가이드", "황정식", "길벗", "9791140703999", 30000, "https://image.aladin.co.kr/product/30012/28/cover500/k752933085_1.jpg", "스프링 MVC 패턴과 REST API 설계 실전서"),
            // 데이터베이스
            mockBook("데이터베이스 개론", "김연희", "한빛아카데미", "9791156644835", 29000, "https://image.aladin.co.kr/product/23101/68/cover500/k552633744_1.jpg", "데이터베이스의 기본 개념과 SQL을 쉽게 배우는 입문서"),
            mockBook("SQL 첫걸음", "아사이 아츠시", "한빛미디어", "9788968482311", 24000, "https://image.aladin.co.kr/product/7614/26/cover500/8968482314_1.jpg", "SELECT부터 트랜잭션까지 SQL을 처음 배우는 책"),
            mockBook("친절한 SQL 튜닝", "조시형", "디비안", "9791185578187", 38000, "https://image.aladin.co.kr/product/14096/20/cover500/1185578188_1.jpg", "SQL 성능 최적화와 인덱스 활용 심화서"),
            // 자바스크립트
            mockBook("모던 자바스크립트 Deep Dive", "이웅모", "위키북스", "9791158392239", 45000, "https://image.aladin.co.kr/product/25155/60/cover500/k552730440_1.jpg", "자바스크립트 동작 원리를 깊이 있게 탐구하는 책"),
            mockBook("자바스크립트 완벽 가이드", "데이비드 플래너건", "인사이트", "9788966262861", 55000, "https://image.aladin.co.kr/product/28093/9/cover500/8966262864_1.jpg", "ES2020까지 자바스크립트의 모든 것을 담은 완벽 가이드"),
            mockBook("리액트를 다루는 기술", "김민준", "길벗", "9791160508796", 42000, "https://image.aladin.co.kr/product/20612/83/cover500/k962636532_1.jpg", "자바스크립트 기반 리액트 실전 개발 완성서"),
            // 파이썬
            mockBook("파이썬 코딩의 기술", "브렛 슬라킨", "길벗", "9791160508673", 30000, "https://image.aladin.co.kr/product/22101/18/cover500/k222630343_1.jpg", "파이썬다운 코드를 작성하는 90가지 방법"),
            mockBook("혼자 공부하는 파이썬", "윤인성", "한빛미디어", "9791162243763", 24000, "https://image.aladin.co.kr/product/22640/78/cover500/k152636078_1.jpg", "파이썬 입문자를 위한 혼자 공부하기 시리즈"),
            mockBook("파이썬 머신러닝 완벽 가이드", "권철민", "위키북스", "9791158392048", 45000, "https://image.aladin.co.kr/product/23101/88/cover500/k102636744_1.jpg", "사이킷런으로 배우는 머신러닝 알고리즘"),
            // C++
            mockBook("C++ 기초 플러스", "스티브 프라타", "길벗", "9791160505818", 48000, "https://image.aladin.co.kr/product/11820/28/cover500/k422530832_1.jpg", "C++ 언어의 기초부터 고급 기능까지 체계적으로 정리한 책"),
            mockBook("명품 C++ Programming", "황기태", "생능출판사", "9788970509747", 34000, "https://image.aladin.co.kr/product/30012/19/cover500/k812933085_1.jpg", "C++ 객체지향 프로그래밍 표준 교재"),
            mockBook("Effective C++", "스콧 마이어스", "프로텍미디어", "9788965400387", 36000, "https://image.aladin.co.kr/product/2100/10/cover500/8965400384_1.jpg", "C++ 프로그래머가 반드시 알아야 할 55가지 사항"),
            // 네트워크
            mockBook("네트워크 하향식 접근", "제임스 F. 쿠로스", "퍼스트북", "9788996241652", 45000, "", "TCP/IP부터 애플리케이션 계층까지 네트워크 전반을 다루는 표준 교재"),
            mockBook("HTTP 완벽 가이드", "데이빗 고울리", "인사이트", "9788966261208", 58000, "", "HTTP 프로토콜의 모든 것을 담은 웹 개발자 필독서"),
            // 운영체제
            mockBook("운영체제 공룡책", "에이브러햄 실버샤츠", "퍼스트북", "9788996241522", 55000, "", "운영체제 개념을 깊이 있게 다루는 전 세계 표준 교재"),
            mockBook("혼자 공부하는 컴퓨터구조+운영체제", "강민철", "한빛미디어", "9791162246030", 26000, "", "컴퓨터 구조와 운영체제를 처음 배우는 입문자를 위한 책"),
            // 알고리즘
            mockBook("코딩 인터뷰 완전 분석", "게일 라크만 맥도웰", "인사이트", "9788966263080", 38000, "", "빅테크 취업을 위한 코딩 인터뷰 완벽 대비서"),
            mockBook("알고리즘 문제 해결 전략", "구종만", "인사이트", "9788966260546", 52000, "", "프로그래밍 대회에서 살아남기 위한 알고리즘 전략"),
            mockBook("Do it! 알고리즘 코딩테스트 자바편", "김종관", "이지스퍼블리싱", "9791163033448", 38000, "", "코딩테스트 합격을 위한 알고리즘 핵심 정리"),
            // CS 공통
            mockBook("클린 코드", "로버트 C. 마틴", "인사이트", "9788966260959", 32000, "", "읽기 좋은 코드를 작성하는 방법과 소프트웨어 장인 정신을 담은 필독서"),
            mockBook("면접을 위한 CS 전공지식 노트", "주홍철", "길벗", "9791140701728", 34000, "", "CS 기술 면접을 위한 핵심 전공 지식 완벽 정리")
        );

        int created = 0;
        for (Book book : books) {
            try {
                if (bookRepository.findByIsbn13(book.getIsbn13()).isEmpty()) {
                    bookRepository.save(book);
                    created++;
                }
            } catch (Exception e) {
                log.warn("도서 초기화 중 중복 건너뜀: {}", book.getTitle());
            }
        }
        log.info("목 도서 데이터 {}건 생성 완료", created);
    }

    private Book mockBook(String title, String author, String publisher, String isbn13,
                          int price, String coverUrl, String description) {
        return Book.builder()
                .title(title)
                .author(author)
                .publisher(publisher)
                .isbn13(isbn13)
                .price(price)
                .priceSales(price)
                .stock(10)
                .coverUrl(coverUrl)
                .description(description)
                .saleStatus("판매중")
                .source("mock")
                .build();
    }
}
