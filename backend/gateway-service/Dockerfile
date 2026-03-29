# 1. 빌드 단계 (eclipse-temurin + maven 공식 조합 — linux/arm64·amd64)
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

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
