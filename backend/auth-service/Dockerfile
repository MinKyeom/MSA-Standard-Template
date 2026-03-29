# 1. 빌드 단계 (Build Stage)
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -Dmaven.test.skip=true

# 2. 실행 단계 (Run Stage) — arm64/amd64
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# 빌드 단계에서 생성된 JAR 파일 복사
COPY --from=build /app/target/*.jar app.jar

RUN mkdir -p /data && chmod 777 /data

EXPOSE 8084

# JVM 힙은 docker-compose의 JAVA_OPTS로 주입 (-Xms256m -Xmx512m)
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar -Dspring.profiles.active=prod -Dfile.encoding=UTF-8 app.jar"]