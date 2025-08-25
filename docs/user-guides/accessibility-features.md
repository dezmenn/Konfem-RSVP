# Accessibility Features Guide

## 1. Our Commitment to Accessibility

We are committed to making the RSVP Planning App accessible to everyone, including individuals with disabilities. This guide provides an overview of the accessibility features available in our application and offers guidance for developers to maintain these standards.

## 2. For Our Users

We have designed our application with the following accessibility features to ensure you have a seamless experience.

### 2.1. Screen Reader Support

The application is fully compatible with modern screen readers on both web and mobile.

*   **Web**: All pages and components are structured with semantic HTML and ARIA landmarks, making it easy to navigate and understand the layout. Interactive elements have clear, descriptive labels.
*   **Mobile**: We use the built-in accessibility features of iOS (VoiceOver) and Android (TalkBack) to provide a native screen reader experience.

### 2.2. Keyboard Navigation (Web)

You can navigate and operate the entire web application using only a keyboard.
*   **Tabbing**: Use the `Tab` key to move forward through interactive elements and `Shift + Tab` to move backward.
*   **Activation**: Press `Enter` or `Space` to activate buttons and other controls.
*   **Visible Focus**: The element that currently has keyboard focus will have a visible outline, so you always know where you are on the page.

### 2.3. Responsive and Zoomable Interface

*   **Text Resizing**: You can use your browser's zoom functionality to enlarge the text and interface up to 200% without breaking the layout.
*   **Responsive Layout**: The application will adapt to different screen sizes, from mobile phones to large desktop monitors, ensuring a consistent experience.

### 2.4. Color and Contrast

*   **High Contrast**: We ensure that all text meets the WCAG AA contrast ratio of 4.5:1, making it easy to read.
*   **Information in Multiple Ways**: Color is not used as the only way to convey information. Icons, text labels, and other visual cues are provided as alternatives.

## 3. For Developers

To maintain and extend the accessibility of this application, please adhere to the following guidelines.

### 3.1. Development Guidelines

*   **Use Semantic HTML**: Always use the correct HTML element for the job (e.g., `<button>` for buttons, `<nav>` for navigation). This is the foundation of web accessibility.
*   **Provide Accessible Names**: All interactive elements must have an accessible name.
    *   For images, use the `alt` attribute: `<img src="..." alt="Descriptive text">`
    *   For icon buttons, use `aria-label`: `<button aria-label="Settings"><Icon/></button>`
*   **Manage Focus**: For any custom components or widgets that manage focus (e.g., modals, dropdowns), ensure focus is handled logically. When a modal opens, focus should move into it. When it closes, focus should return to the element that opened it.
*   **Test Your Code**: Before committing code, perform basic accessibility checks:
    1.  Navigate your new feature using only the keyboard.
    2.  Use a screen reader to review the new components.
    3.  Run an automated tool like Axe DevTools.

### 3.2. Key Accessibility Documents

*   **Accessibility Standards**: For a complete overview of our standards, please refer to the [Cross-Platform Accessibility Feature Document](../prd/features/cross-platform-accessibility.md).
*   **Testing Plan**: For detailed testing procedures, see the [Accessibility Testing Plan](../testing/accessibility-testing-plan.md).

By following these guidelines, we can ensure that the RSVP Planning App remains a user-friendly and accessible tool for everyone.