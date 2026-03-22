This application, "RoboMedic," is an AI-driven web-based cosmetic and skincare assistant. It utilizes a modern tech stack with a Python/FastAPI backend and a
  React/TypeScript frontend.

  Key Capabilities and Functions:

   1. AI Chat Assistant: Users can interact with an AI chat assistant to discuss skincare concerns, ask questions, and receive advice.
   2. Skin Image Analysis: The application allows users to upload images of their skin for AI-powered analysis.
   3. Personalized Skincare Recommendations: Based on chat interactions and image analysis, the AI generates tailored skincare product and routine recommendations.
   4. User Authentication: It includes a complete user registration and login system.
   5. Session Management: User consultation sessions, including chat history and AI analysis results, are managed and persisted.

  Technical Architecture:

   * Backend (Python/FastAPI):
       * Built with FastAPI, ensuring fast and efficient API communication.
       * Uses Uvicorn as the ASGI server.
       * Integrates with a large language model (LLM) via an OpenAI-compatible API, internally codenamed "Featherless," to power the chat, image analysis, and recommendation 
         generation.
       * Employs Pillow for image processing during skin analysis.
       * Handles user authentication securely using Passlib for password hashing.
       * Persists user accounts and detailed session data (including conversation history) in a SQLite database.
       * Exposes dedicated API endpoints for chat, image upload, recommendation generation, and user authentication (register/login).
   * Frontend (React/TypeScript):
       * Developed as a single-page application using React and TypeScript, with Vite for development and bundling.
       * Manages application-wide state, including user authentication, through contexts (AuthContext).
       * Provides user-friendly interfaces for registration, login, and the core chat consultation (though the detailed functionality of ChatPage.tsx was not fully analyzed).       * Includes reusable UI components (e.g., GlassCard, GradientButton, IPhoneMockup) for a consistent design.
       * Styling is managed via theme.css.

  In essence, RoboMedic provides an interactive and intelligent platform for users to receive personalized skincare guidance, leveraging AI for analysis and recommendations  
  through a seamless web experience.
