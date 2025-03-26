# Lyrics Video Maker

<div align="center">
  <img src="readme_assets/Screenshot%202025-03-26%20105427.png" width="400" />
  <img src="readme_assets/Screenshot%202025-03-26%20105510.png" width="400" />
  <img src="readme_assets/Screenshot%202025-03-26%20105612.png" width="400" />
  <img src="readme_assets/Screenshot%202025-03-26%20105618.png" width="400" />
  <img src="readme_assets/Screenshot%202025-03-26%20105623.png" width="400" />
  <img src="readme_assets/Screenshot%202025-03-26%20105642.png" width="400" />
</div>

A React + Remotion application for creating dynamic lyrics videos with multiple audio track support and GPU-accelerated rendering.

## ⚠️ Usage Restrictions
**Important:** This application is provided for offline and personal use only. Please note the following restrictions:
- You may freely use this application for offline and personal purposes
- You must NOT use the default video template/layout for online platforms like YouTube
- To publish videos online, you MUST:
  1. Clone this repository
  2. Create your own unique video layout/animation/styles
  3. Modify the visual design to be distinctly different from the original template

These restrictions are in place to prevent template oversaturation and maintain creative diversity.

## Features

- Create lyrics videos with synchronized text
- Support for multiple audio tracks:
  - Main audio
  - Instrumental
  - Vocal only
  - Little vocal mix
- Custom background images per video type
- Theme switching (light/dark)
- Multi-language support
- Tab-based workspace
- Render queue management
- GPU-accelerated video rendering (Vulkan)

## Technologies

- Frontend:
  - React 19
  - Remotion (video rendering)
  - styled-components
  - React Router
- Backend:
  - Express
  - Multer (file uploads)
  - Remotion renderer

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Running the Application

Run the application in development mode:

1. **First terminal** - Frontend (React):
```bash
npm start
```
Runs on port 3002

2. **Second terminal** - Backend (Express):
```bash
npm run server:start
```
Runs on port 3003

Alternatively, you can run both with:
```bash
npm run server:dev
```

## Development Notes

- The application uses Remotion for video rendering with GPU acceleration
- Backend provides file upload and video rendering endpoints
- Frontend manages the workspace and render queue
- Both light and dark themes are supported
- Multiple language support is implemented via LanguageContext

## Project Structure

- `src/` - Frontend React application
  - `components/` - Reusable components
  - `contexts/` - Application contexts
  - `remotion/` - Remotion video compositions
  - `services/` - API services
  - `utils/` - Utility functions
- `server/` - Backend Express server
  - `src/` - Server source code
  - `uploads/` - Uploaded files
  - `output/` - Rendered videos
