# 1. 빌드 단계 (eclipse-temurin + maven 공식 조합 — linux/arm64·amd64)
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
      if mvn clean package -DskipTests -B ${MAVEN_HTTP_RETRY}; then \
        exit 0; \
      fi; \
      echo "Maven package failed (attempt ${i}); retrying..."; \
      sleep $((i * 20)); \
      i=$((i + 1)); \
    done; \
    echo "Maven package failed after 5 attempts"; \
    exit 1

# 2. 실행 단계 — JVM 힙은 env JAVA_OPTS로 주입 (-Xms256m -Xmx512m)
# 17-jre-alpine 은 arm64 매니페스트가 없을 수 있어 jammy(멀티아키) 사용
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# 헬스체크(wget) + nc — Debian 계열
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/*.jar app.jar

RUN mkdir -p /data && chmod 777 /data

EXPOSE 8085

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar -Dfile.encoding=UTF-8 app.jar"]
