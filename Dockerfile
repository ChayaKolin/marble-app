# ── Stage 1: Build frontend ───────────────────────────────────────────────────
FROM node:20-slim AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Build backend ────────────────────────────────────────────────────
FROM maven:3.9.9-eclipse-temurin-21 AS backend-build
WORKDIR /workspace
COPY backend/pom.xml .
COPY backend/src ./src

# Embed frontend into Spring Boot static resources
COPY --from=frontend-build /frontend/dist ./src/main/resources/static

# Build and verify JAR was created
RUN mvn clean package -DskipTests && \
    echo "=== BUILD COMPLETE ===" && \
    ls -lh target/*.jar && \
    cp target/marble-0.0.1-SNAPSHOT.jar /app.jar

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=backend-build /app.jar app.jar
RUN ls -lh app.jar && echo "JAR ready"
ENTRYPOINT ["java", "-Dserver.port=${PORT:-8080}", "-jar", "/app/app.jar"]
