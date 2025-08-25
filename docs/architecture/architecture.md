# RSVP Planning App: System Architecture

## 1. Introduction

This document provides a detailed analysis of the existing architecture of the RSVP Planning App. It is intended to serve as a comprehensive guide for developers, providing a clear understanding of the system's structure, components, and interactions.

## 2. High-Level Architecture

The RSVP Planning App is a full-stack, cross-platform application built with a monorepo architecture. It consists of three main components, each documented in detail in its own section:

*   **[Backend Architecture](./backend.md)**: A Node.js and Express-based backend that provides a RESTful API and WebSocket services.
*   **[Web Application Architecture](./web.md)**: A React-based web application for desktop and web users.
*   **[Mobile Application Architecture](./mobile.md)**: A React Native application for mobile users, built with Expo.

A `shared` directory contains common code, types, and interfaces that are used across all three components.

## 3. Cross-Cutting Concerns

This section describes the architectural patterns and strategies that apply to the entire system.

*   **[Data Models & Database](./data-models.md)**: An overview of the data models and the PostgreSQL database schema.
*   **[Communication & Data Flow](./communication.md)**: A description of the communication patterns and data flow between the components, including the RESTful API, WebSockets, and offline synchronization.
*   **[Testing Strategy](./testing.md)**: An overview of the project's testing strategy, including unit, integration, and end-to-end tests.