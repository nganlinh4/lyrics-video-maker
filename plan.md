# Plan: React Lyrics Video App with Remotion

This plan outlines the steps to create a React application that uses Remotion to generate lyrics videos from an audio file and a JSON lyrics timing file.

**1. Project Setup:**

*   **Create React App:** Use Create React App to bootstrap the project.
    ```bash
    npx create-react-app lyrics-video-maker
    cd lyrics-video-maker
    ```
*   **Install Dependencies:** Install necessary packages: Remotion, React-Remotion, and potentially a library for handling audio playback in React (e.g., `react-player` or `howler.js`). Also, add any styling libraries like `styled-components` or `tailwindcss` if preferred.
    ```bash
    npm install remotion react-remotion react-player styled-components
    ```
*   **Directory Structure:** Organize the project with the following structure:
    ```
    lyrics-video-maker/
    ├── src/
    │   ├── components/
    │   │   ├── AudioUpload.tsx     // Audio upload component
    │   │   ├── LyricsUpload.tsx    // JSON lyrics upload component
    │   │   ├── LyricsVideo.tsx     // Remotion video component
    │   │   ├── VideoPreview.tsx    // (Optional) Video preview component
    │   ├── App.tsx               // Main application component
    │   ├── index.tsx             // Entry point
    │   ├── styles.css            // Global styles or CSS-in-JS
    ├── public/
    │   └── assets/             // Static assets (fonts, etc.)
    ├── remotion/               // Remotion specific files
    │   └── root.tsx            // Remotion root component
    ├── package.json
    ├── ...
    ```

**2. Component Development:**

*   **`AudioUpload.tsx`:**
    *   Functionality:  Allow users to upload an audio file (e.g., MP3, WAV).
    *   Implementation: Use an `<input type="file">` element. Store the audio file in React state.
*   **`LyricsUpload.tsx`:**
    *   Functionality: Allow users to upload a JSON file containing lyrics and timings.
    *   Implementation: Use an `<input type="file">` element, accept only `.json` files. Parse the JSON content and store it in React state.
*   **`LyricsVideo.tsx` (Remotion Component):**
    *   Functionality:  Remotion component to render the lyrics video.
    *   Implementation:
        *   Receive audio file URL and parsed lyrics JSON as props.
        *   Use Remotion's `<Composition>` and `<Sequence>` to structure the video timeline.
        *   Render lyrics text using `<Text>` components.
        *   Implement animations and transitions for lyrics based on timings from the JSON data.
        *   Consider using `interpolate()` for smooth animations.
        *   Ensure font flexibility for multiple languages (e.g., using a font like Noto Sans).
        *   Style lyrics for readability and visual appeal (smooth colors, natural transitions).
*   **`VideoPreview.tsx` (Optional):**
    *   Functionality: Display a preview of the generated video.
    *   Implementation: Use a `<video>` element or a library like `react-player` to play the generated video (if feasible to preview directly in the browser, otherwise, this might be for after rendering).
*   **`App.tsx`:**
    *   Functionality: Main component to orchestrate the application.
    *   Implementation:
        *   Manage state for audio file, lyrics JSON, and video output.
        *   Render `AudioUpload`, `LyricsUpload`, `LyricsVideo` components.
        *   Handle file uploads and data passing between components.
        *   Add a "Generate Video" button to trigger Remotion video rendering.

**3. Core Logic and Functionality:**

*   **File Upload Handling:** Implement logic in `AudioUpload` and `LyricsUpload` to handle file uploads and store file data in the component state.
*   **JSON Parsing:** In `LyricsUpload`, parse the uploaded JSON file to extract lyrics and timing information.
*   **Lyrics Synchronization:** In `LyricsVideo`, synchronize the display of lyrics with the audio playback using Remotion's timing and animation capabilities. The `start` and `end` times from the JSON will be crucial for this.
*   **Video Generation with Remotion:**
    *   Use Remotion CLI or API to render the video.  For local development, Remotion CLI is sufficient.
    *   Command example for rendering (from project root): `npx remotion render src/remotion/root.tsx out.mp4` (adjust paths as needed).
    *   The `root.tsx` in `remotion/` directory will import and use the `LyricsVideo.tsx` component.

**4. Styling and Animations:**

*   **Font Selection:** Choose a font that supports multiple languages and is visually appealing (e.g., Noto Sans, Inter). Import the font and apply it globally or to the lyrics components.
*   **Color Palette:** Select a color palette that is easy on the eyes and complements the video content.
*   **Animations and Transitions:** Implement smooth animations for lyrics appearing and disappearing. Consider:
    *   **Fade-in/Fade-out:** Simple and effective for text transitions.
    *   **Scale animation:**  Slightly scaling up the current lyric.
    *   **Color highlighting:** Changing the color of the current lyric.
    *   Ensure animations are natural and not distracting.

**5. Development and Testing (Local Ports: 3002 & 3003):**

*   **Frontend (Port 3002):** Run the React development server: `npm start`. Access the app at `http://localhost:3002`.
*   **Backend (Port 3003 - if needed for any API in future):**  While not strictly necessary now, if you anticipate needing a backend for more complex features later, you can set up a simple Node.js/Express server on port 3003. For now, the frontend can handle all logic.
*   **Testing:**
    *   Test audio and JSON file uploads.
    *   Verify lyrics synchronization with audio in the generated video.
    *   Test different lyric styles and animations.
    *   Check for responsiveness and cross-browser compatibility.

**6. Refinement and Polish:**

*   **User Experience:** Improve the user interface and workflow based on testing and feedback.
*   **Performance Optimization:** Optimize Remotion video rendering for speed and efficiency.
*   **Optional Features:** Consider adding features like:
    *   Video preview in the browser.
    *   Progress bar during video generation.
    *   Options for different video resolutions or export formats.

**7. Mermaid Diagram - Component Structure:**

```mermaid
graph LR
    A[App.tsx] --> B(AudioUpload.tsx)
    A --> C(LyricsUpload.tsx)
    A --> D(LyricsVideo.tsx)
    D --> E(Remotion Composition)
    A --> F(VideoPreview.tsx)
    E --> G(Lyrics Display & Animation)
    G --> H(Lyrics JSON Data)
    G --> I(Audio File)