# Implementation Plan: UI/UX Enhancements & Chatbot Fixes

I will address the three key areas you highlighted to improve the application's quality and usability.

## 1. Student Section - Average Mark Formatting
**Problem:** Average marks display excessive decimal digits (e.g., 85.6712345).
**Solution:**
*   **Locate Code:** Find the component responsible for rendering student lists or profiles (likely `StudentManagement.tsx` or `AdminDashboard.tsx`).
*   **Apply Formatting:** Use `.toFixed(2)` on the average marks value before display to ensure it always shows exactly two decimal places (e.g., 85.67).

## 2. AI Chatbot Functionality
**Problem:** The chatbot is reported as "not working".
**Solution:**
*   **Backend Verification:** Check `server/routes.ts` to ensure the Gemini API integration uses a valid and available model (e.g., `gemini-pro` or `gemini-1.5-flash`). I will verify the API key loading.
*   **Frontend Error Handling:** Update `Chatbot.tsx` to provide clearer error messages to the user if the backend fails.
*   **Connection Test:** I will verify the `/api/chat` endpoint is responsive.

## 3. General UI/UX Improvements
**Problem:** The interface needs general polish and responsiveness.
**Solution:**
*   **Visual Audit:** I will review the Dashboard layouts (`AdminDashboard.tsx`, `StudentDashboard.tsx`) for spacing, alignment, and color consistency.
*   **Responsiveness:** Ensure data tables and layout containers stack or scroll correctly on smaller screens.
*   **Feedback:** Ensure loading states (spinners/skeletons) are visible during data fetching.

I will proceed with these changes systematically, starting with the Average Mark fix, then the Chatbot diagnosis, and finally the general UI polish.