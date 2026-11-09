# MediGuide AI 🩺

MediGuide AI is a modern, responsive consumer health application featuring an AI-powered Symptom Checker, hospital/doctor finder, health record management, medication reminders, emergency SOS features, and authentication.

Powered by **Groq Cloud AI inference** with resilient multi-model failover support.

---

## ✨ Features

- **🤖 AI Symptom Checker**: Real-time health guidance powered by Groq high-speed AI inference (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`) with automatic candidate failover.
- **🏥 Nearby Hospital & Clinic Directory**: Interactive healthcare facility finder with distance calculation and filtering.
- **👨‍⚕️ Doctor Consultations & Bookings**: Browse specialist profiles and book appointments.
- **💊 Medication & Care Reminders**: Track dosages and set timely alerts.
- **📁 Medical Health Records**: Manage and access health history.
- **🚨 Emergency SOS**: Fast emergency service hotline dialers and emergency contact access.
- **🔒 Authentication & Local Persistence**: Built-in auth with local file database fallback (`data/db.json`) and optional Supabase integration.

---

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) / [TanStack Router](https://tanstack.com/router)
- **Frontend**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/)
- **Bundler / Server**: [Vite 8](https://vitejs.dev/) with [Nitro](https://nitro.unjs.io/)
- **AI Inference**: [Groq Cloud API](https://console.groq.com/)
- **Database & Auth**: Local JSON storage (`data/db.json`) & [Supabase](https://supabase.com/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Groq Cloud API key ([console.groq.com](https://console.groq.com/keys))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rajchoudhury429/medi-guide.git
   cd medi-guide
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Groq API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=openai/gpt-oss-120b
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

---

## 📄 License

MIT
