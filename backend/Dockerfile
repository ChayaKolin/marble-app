FROM eclipse-temurin:21-jdk-jammy AS build-engine
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
RUN ./mvnw clean package -DskipTests 2>/dev/null || \
    (apt-get update -q && apt-get install -y -q maven && mvn clean package -DskipTests)

FROM eclipse-temurin:21-jre-jammy
VOLUME /tmp
COPY --from=build-engine /workspace/target/*.jar app.jar
ENTRYPOINT ["java", "-Dserver.port=${PORT}", "-jar", "/app.jar"]
