# Accessibility Testing Plan

## 1. Objective

To verify that the RSVP Planning App meets the WCAG 2.1 Level AA accessibility standards on both web and mobile platforms. This plan will ensure a consistent and usable experience for all users, including those with disabilities.

## 2. Scope

This testing plan covers the following key areas of the application:

*   Guest Management (Web & Mobile)
*   Form Inputs and Controls (Web & Mobile)
*   Navigation (Web & Mobile)
*   Interactive Elements (Buttons, Links, Modals)

## 3. Testing Tools

### 3.1. Automated Tools
*   **Web**: Axe DevTools (browser extension) for automated scans of all web pages.
*   **Mobile**: React Native's built-in accessibility inspector.

### 3.2. Manual Testing Tools
*   **Screen Readers**:
    *   **Web**: NVDA (Windows), VoiceOver (macOS)
    *   **Mobile**: VoiceOver (iOS), TalkBack (Android)
*   **Keyboard**: Standard keyboard for web testing.
*   **Zoom/Magnification**: Browser zoom and system-level magnification tools.

## 4. Testing Checklist

### 4.1. Web (`rsvp-web`)

| Feature Area | Test Case | Expected Result |
| :--- | :--- | :--- |
| **Global** | Run Axe DevTools on all pages. | No critical or serious accessibility violations. |
| **Navigation** | Navigate the entire admin dashboard using only the keyboard (Tab, Shift+Tab, Enter). | All interactive elements are focusable and operable. Focus order is logical. The currently active link is identified by `aria-current="page"`. |
| **Guest Form** | Fill out and submit the "Add New Guest" form using only the keyboard. | All form fields are labeled correctly. Error messages are announced by screen readers and programmatically associated with their respective fields. |
| **Guest Form** | Trigger validation errors in the guest form. | Screen reader announces the errors. Focus is moved to the first invalid field. |
| **Guest List** | Use a screen reader to read the guest list table. | Table headers are correctly associated with their columns. Interactive buttons (Edit, Delete) have clear, unique accessible names (e.g., "Edit guest John Doe"). |
| **Color Contrast** | Use a color contrast checker on all text and UI elements. | All elements meet the 4.5:1 contrast ratio. |
| **Zoom** | Zoom the browser to 200%. | No loss of content or functionality. No horizontal scrolling is introduced. |

### 4.2. Mobile (`rsvp-mobile`)

| Feature Area | Test Case | Expected Result |
| :--- | :--- | :--- |
| **Global** | Use the React Native accessibility inspector to check for issues. | All elements have appropriate accessibility properties. |
| **Screen Reader** | Navigate the Guest List and Guest Form using VoiceOver/TalkBack. | All interactive elements are announced correctly with proper labels, roles, and hints. Focus moves logically. |
| **Guest Form** | Fill out and submit the "Add New Guest" form using a screen reader. | All fields are clearly labeled. Toggles (e.g., Bride/Groom side) announce their state (selected/not selected). |
| **Guest List** | Interact with the guest list using a screen reader. | Each guest's information is read out clearly. Action buttons for each guest have unique, descriptive labels (e.g., "Edit guest Jane Smith"). |
| **Touch Targets** | Manually inspect all buttons, toggles, and interactive elements. | All touch targets are at least 44x44 points. |
| **Dynamic Text** | Increase the system font size on the device. | The app's text scales accordingly, and the layout remains usable without text being truncated. |

## 5. Test Execution

1.  **Automated Scan**: Run initial automated scans to catch low-hanging fruit.
2.  **Manual Keyboard & Screen Reader Testing**: Perform a full pass of the application using the manual checklist above.
3.  **Cross-Browser/Device Testing**: Execute key test cases on different browsers (Chrome, Firefox) and devices (iOS, Android).
4.  **Bug Reporting**: Log any found issues with detailed steps to reproduce, screenshots, and the expected vs. actual behavior.

This testing plan will be executed before the final documentation is created to ensure all implemented features are working as intended.