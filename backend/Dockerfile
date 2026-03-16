# ── Build stage ────────────────────────────────────────────────────────────────
FROM eclipse-temurin:25-jdk AS builder
WORKDIR /app

COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle

# Download dependencies
RUN ./gradlew dependencies --no-daemon 2>/dev/null || true

COPY src src
RUN ./gradlew bootJar -x test --no-daemon

# ── Runtime stage ───────────────────────────────────────────────────────────────
FROM eclipse-temurin:25-jre
WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
