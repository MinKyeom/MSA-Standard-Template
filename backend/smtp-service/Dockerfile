FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8083
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS:--Xms64m -Xmx128m} -Duser.timezone=Asia/Seoul -Dfile.encoding=UTF-8 -jar app.jar"]