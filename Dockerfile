# ── Stage 1: Build frontend ───────────────────────────────────────────────────
FROM node:20-slim AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build
# Output: /frontend/dist/

# ── Stage 2: Build backend ────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-jammy AS backend-build
WORKDIR /workspace
RUN apt-get update -q && apt-get install -y -q maven

COPY backend/pom.xml .
COPY backend/src ./src

# Embed the built frontend into Spring Boot's static resources
# Spring Boot serves everything in /static at the root URL automatically
COPY --from=frontend-build /frontend/dist ./src/main/resources/static

RUN mvn clean package -DskipTests

# ── Stage 3: Runtime image ────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
VOLUME /tmp
COPY --from=backend-build /workspace/target/*.jar app.jar
ENTRYPOINT ["java", "-Dserver.port=${PORT:-8080}", "-jar", "/app.jar"]
