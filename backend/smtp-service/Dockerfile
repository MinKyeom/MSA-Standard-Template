FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx768m"
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:go-offline -B
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn clean package -DskipTests -B

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8083
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS:--Xms64m -Xmx128m} -Duser.timezone=Asia/Seoul -Dfile.encoding=UTF-8 -jar app.jar"]