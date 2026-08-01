# 1. 빌드 단계 (Build Stage)
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx768m"
ARG MAVEN_HTTP_RETRY="-Daether.connector.http.retryHandler.count=5 -Daether.connector.http.retryHandler.requestSentEnabled=true"

COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    set -eu; \
    i=1; \
    while [ "$i" -le 5 ]; do \
      echo "Maven dependency:go-offline attempt ${i}/5"; \
      if mvn dependency:go-offline -B ${MAVEN_HTTP_RETRY}; then \
        exit 0; \
      fi; \
      echo "Maven go-offline failed (attempt ${i}); retrying..."; \
      sleep $((i * 20)); \
      i=$((i + 1)); \
    done; \
    echo "Maven dependency:go-offline failed after 5 attempts"; \
    exit 1

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    set -eu; \
    i=1; \
    while [ "$i" -le 5 ]; do \
      echo "Maven package attempt ${i}/5"; \
      if mvn clean package -Dmaven.test.skip=true -B ${MAVEN_HTTP_RETRY}; then \
        exit 0; \
      fi; \
      echo "Maven package failed (attempt ${i}); retrying..."; \
      sleep $((i * 20)); \
      i=$((i + 1)); \
    done; \
    echo "Maven package failed after 5 attempts"; \
    exit 1

# 2. 실행 단계 (Run Stage) — arm64/amd64
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends wget netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# 빌드 단계에서 생성된 JAR 파일 복사
COPY --from=build /app/target/*.jar app.jar

RUN mkdir -p /data && chmod 777 /data

EXPOSE 8084

# JVM 힙은 docker-compose의 JAVA_OPTS로 주입 (-Xms256m -Xmx512m)
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS} -jar -Dspring.profiles.active=prod -Dfile.encoding=UTF-8 app.jar"]
