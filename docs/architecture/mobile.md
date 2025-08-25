# Mobile Application Architecture (`rsvp-mobile`)

The mobile application is a cross-platform application built with React Native and Expo. It shares a similar architecture and feature set with the web application, but it is optimized for mobile devices.

## Core Modules

*   **`components`**: Contains a library of React Native components that are specifically designed for mobile devices. These components provide a native look and feel, and they are optimized for touch-based interactions.
*   **`services`**: Similar to the web application, the mobile app has a `services` directory that contains the `SyncService` and `WebSocketClient`. This ensures that the mobile app has the same real-time and offline capabilities as the web app.

## Key Features & Functionality

*   **Native User Experience**: The mobile app provides a native user experience, with components that are designed to look and feel like native iOS and Android components.
*   **Cross-Platform Compatibility**: The use of React Native and Expo allows the application to be deployed to both iOS and Android from a single codebase.
*   **Touch-Optimized Interactions**: The mobile app's components are optimized for touch-based interactions, providing a smooth and intuitive user experience on mobile devices.
*   **Feature Parity**: The mobile app provides a similar feature set to the web application, ensuring that users have a consistent experience across all platforms.