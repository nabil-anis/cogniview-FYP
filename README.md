
# Cogniview - Intelligence Reimagined

**Final Year Project (FYP)**

## Project Team
*   **Muhammad Hassan Nadeem** (Se221109)
*   **Muhammad Hamza irfan** (Se221114)
*   **Abdul Rehman Paracha** (SE221068)
*   **M.Ahsan** (SE221099)

## About the Project
Cogniview is a next-generation recruitment platform that leverages multimodal Generative AI to conduct real-time, autonomous verbal interviews. 

### Key Innovations
*   **Autonomous Screening**: AI agents conduct full verbal interviews without human intervention.
*   **Bias Reduction**: Standardized evaluation parameters ensure every candidate is judged purely on merit.
*   **Deep Analytics**: Post-interview analysis provides weighted scoring, behavioral insights, and confidence metrics.
*   **Secure Infrastructure**: Real-time biometric and environment monitoring ensures assessment integrity.

This project represents a significant advancement in HR technology, moving from simple resume parsing to true cognitive assessment.

---

## 🛠️ Custom Supabase Database Setup

To migrate or connect Cogniview to your own custom Supabase database, follow these three simple steps:

### 1. Recreate the Database Schema
1. Go to your **[Supabase Dashboard](https://supabase.com/)**.
2. Navigate to your project, then open the **SQL Editor** from the left-hand navigation sidebar.
3. Click **New Query**, copy the entire contents of the **`schema.sql`** file located in the root of this project, paste it into the editor, and click **Run**.
4. This will instantly configure all the tables (`profiles`, `interviews`, `sessions`, `responses`, `evaluations`), indexes, and Row-Level Security (RLS) policies for you.

### 2. Copy your Connection Credentials
Get your Project URL and Anon API key from your Supabase Dashboard under:
- **Project Settings** > **API** > **Project URL**
- **Project Settings** > **API** > **Project API keys** (Copy the `anon` / `public` key)

### 3. Add Environment Variables
Add your credentials as environment variables. In this workspace:
1. Click **Settings** (or the Environment Variables panel).
2. Set the following environment variables:
   - `VITE_SUPABASE_URL` = *Your Supabase Project URL*
   - `VITE_SUPABASE_ANON_KEY` = *Your Supabase Anon Key*

If these keys are left empty, the application will seamlessly fall back to the default database so that everything remains functional out of the box!

