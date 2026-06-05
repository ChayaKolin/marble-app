# ── Stage 1: Build frontend ───────────────────────────────────────────────────
FROM node:20-slim AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build
# Output: /frontend/dist/

# ── Stage 2: Build backend ────────────────────────────────────────────────────
# Use official Maven image — includes both Maven 3.9 and Java 21
FROM maven:3.9.9-eclipse-temurin-21 AS backend-build
WORKDIR /workspace

COPY backend/pom.xml .
COPY backend/src ./src

# Embed the built frontend into Spring Boot's static resources
# Spring Boot serves everything in /static at the root URL automatically
COPY --from=frontend-build /frontend/dist ./src/main/resources/static

RUN mvn clean package -DskipTests

# ── Stage 3: Runtime image ────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=backend-build /workspace/target/*.jar app.jar
ENTRYPOINT ["java", "-Dserver.port=${PORT:-8080}", "-jar", "/app.jar"]
