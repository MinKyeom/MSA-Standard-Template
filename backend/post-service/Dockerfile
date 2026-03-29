# Build Stage
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Run Stage — arm64/amd64
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*
ENV TZ=Asia/Seoul

COPY --from=build /app/target/*.jar app.jar

# 데이터·카드 썸네일 업로드 디렉터리
RUN mkdir -p /data /app/data/post-covers && chown -R 1000:1000 /data /app/data
ENV POST_COVER_UPLOAD_DIR=/app/data/post-covers

# 운영 환경에 맞는 환경변수 설정
ENV SPRING_PROFILES_ACTIVE=prod
# 도커 컴포즈 서비스명에 맞춰 변경 (msa-user)
ENV USER_SERVICE_URL=http://user-service:8081 

EXPOSE 8082

# 실행 시 보안을 위해 root가 아닌 사용자로 실행하는 것을 권장하나, 
# 일단 기본 설정을 유지합니다.
# JVM 힙은 docker-compose의 JAVA_OPTS로 주입 (-Xms256m -Xmx512m)
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS:--Xms256m -Xmx512m} -Dfile.encoding=UTF-8 -jar app.jar"]