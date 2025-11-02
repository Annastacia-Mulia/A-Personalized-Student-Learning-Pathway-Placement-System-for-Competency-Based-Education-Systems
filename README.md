# A Personalized Student Learning Pathway Placement System for Competency-Based Education Systems

## Description
This project is a web-based platform designed to automate and personalize student placement into learning pathways within competency-based education systems. It streamlines the process for administrators, teachers, and students, providing dashboards, analytics, secure authentication (including passkey/WebAuthn support), and a unified settings page for all user roles. The system aims to improve placement accuracy, transparency, and user experience.

## Project Setup / Installation Instructions

### Dependencies
- Node.js (v16+ recommended)
- npm or yarn
- Python 3 (for backend server)
- Supabase account (for authentication and database)
- External libraries:
  - React
  - React Router
  - Chart.js & react-chartjs-2
  - @supabase/supabase-js
  - Lucide-react
  - Flask (Python backend)

### Installation Steps
1. **Clone the repository:**
	```sh
	git clone https://github.com/Annastacia-Mulia/A-Personalized-Student-Learning-Pathway-Placement-System-for-Competency-Based-Education-Systems.git
	cd A-Personalized-Student-Learning-Pathway-Placement-System-for-Competency-Based-Education-Systems/pathguider
	```
2. **Install frontend dependencies:**
	```sh
	npm install
	# or
	yarn install
	```
3. **Set up Supabase:**
	- Create a Supabase project and update `supabase.js` and `.env` files with your project URL and anon key.
4. **Install backend dependencies:**
	```sh
	cd ../server
	pip install -r requirements.txt
	```
5. **Start the backend server:**
	```sh
	python app.py
	```
6. **Start the frontend development server:**
	```sh
	cd ../pathguider
	npm start
	# or
	yarn start
	```

## Usage Instructions

### How to Run
- Start both the backend (Flask) and frontend (React) servers as described above.
- Access the app at `http://localhost:3000` in your browser.

### Examples & Features
- **Admin Dashboard:** View analytics, manage placements, handle appeals, and access notifications.
- **Teacher/Student Dashboards:** View personalized placements, submit appeals, and manage profiles.
- **Secure Authentication:** Supports password, passkey/WebAuthn, and TOTP setup/verification.
- **Unified Settings Page:** Edit profile, change theme, manage security, and access role-specific settings.

### Input/Output
- **Input:** User credentials, profile data, placement/appeal submissions.
- **Output:** Placement results, analytics charts, notifications, and status messages.

## Project Structure

- `pathguider/`
  - `src/`
	 - `App.js` – Main React app and route definitions
	 - `components/` – Reusable UI components (Modal, Notification, PasskeySetup, etc.)
	 - `pages/` – Main pages for authentication, dashboards, settings, and user management
	 - `utils/` – Utility functions (e.g., token handling)
	 - `supabase.js` – Supabase client configuration
	 - `App.css` – Global styles
	 - `public/` – Static assets (images, icons, manifest)
- `server/`
  - `app.py` – Python Flask backend for API endpoints
  - `requirements.txt` – Python dependencies
  - `serviceAccountKey.json` – Service account credentials (if needed)


## Machine Learning Model
- `server/train_pathway_model.py`: Script to train and export the pathway placement model.
- `server/pathguider.pkl`: Trained RandomForestClassifier model (used for automated pathway assignment in backend).
	- **Note:** Do not commit large or sensitive model files to GitHub. Add `pathguider.pkl` to your `.gitignore`.

## Key Files
- `src/App.js`: Main entry point and router for the React app
- `src/pages/homescreens/adminHome.js`, `teacherHome.js`, `studentHome.js`: Dashboards for each role
- `src/components/TotpSetup.js`: 2-Factor Authentication registration component
- `src/supabase.js`: Supabase client setup
- `server/app.py`: Backend API logic that runs the Python placement module
- `server/train_pathway_model.py`: Setup for training the model

---
For more details, see the inline comments in the code and the [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) if migrating from a previous version.
