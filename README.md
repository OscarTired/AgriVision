# AgriVision

![Next.js](https://img.shields.io/badge/Next.js-Black?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=flat-square&logo=google&logoColor=white)
![Pinecone](https://img.shields.io/badge/Pinecone-000000?style=flat-square&logo=pinecone&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)

AgriVision is an intelligent agricultural dashboard designed to help farmers and agronomists make data-driven decisions. By combining real-time weather forecasting with AI-powered agricultural recommendations, it provides actionable insights tailored to specific locations and crop conditions.

> [!NOTE]
> This project is currently in active development. Features and interfaces might change as we iterate based on user feedback.

## Key Features

### Hyper-Local Weather Tracking
We use **Open-Meteo** to pull precise, real-time weather data and forecasts. Users can search for specific cities, use their device GPS, or drop a pin on an interactive map to get exact climate conditions for their land.

### AI-Powered Agronomic Insights
Instead of just showing temperatures, AgriVision acts as a virtual agronomist. We use **Google Genkit and Gemini AI** to analyze the current weather data and provide specific farming recommendations. 

### Smart Knowledge Base (Pinecone & Embeddings)
To ensure the AI advice is accurate and grounded in real agricultural science, we use **Pinecone** as our vector database. 
When the AI generates recommendations, it first searches through our embedded agricultural knowledge base in Pinecone. This means the chat and insights are powered by real farming data, not just generic AI responses.

### Persistent Chat History
Users can chat with the AI assistant about specific crop concerns. We implemented a seamless history system:
- For guest users, chats are saved locally in the browser.
- For logged-in users, the chat history is automatically synchronized and securely saved to our database, allowing them to pick up right where they left off across different devices.

### Secure Authentication & Storage
User accounts and sessions are handled through **Better Auth** with Google OAuth integration, ensuring a smooth login experience. All user data, including saved locations and chat histories, is safely stored in **Supabase** (PostgreSQL).

> [!IMPORTANT]  
> If you are setting this up locally, make sure your OAuth redirect URIs in Google Cloud exactly match your local and production environment URLs.

## How It All Fits Together

1. **Data Collection:** The user selects a location. The application fetches current weather and weekly forecasts from Open-Meteo.
2. **Context Retrieval:** The system takes this weather context and queries Pinecone using embeddings to find relevant agricultural best practices.
3. **AI Generation:** Google Gemini processes the weather data alongside the retrieved Pinecone knowledge to generate custom farming advice.
4. **Delivery:** The insights are displayed on the dashboard, and the user can interact further via the persistent chat interface.

## Tech Stack Highlights

- **Frontend:** Next.js, React, Tailwind CSS, shadcn/ui
- **Authentication:** Better Auth (with Google OAuth)
- **Database:** Supabase (PostgreSQL)
- **AI Engine:** Google Genkit, Gemini Models, Pinecone Vector DB
- **External Data:** Open-Meteo API
