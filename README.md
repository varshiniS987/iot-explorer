# IoT Final

| Folder | What it is |
| --- | --- |
| `frontend/` | React + TypeScript + Vite web app. The simulation phase is the **Embedded IoT module with 17 Arduino UNO projects** (`frontend/src/simulation`). |
| `backend/` | Express + MongoDB API (students, quiz, events, certificates, feedback). |

## Easiest way (Windows)
Double-click **`run-all.bat`**. It installs what is missing and opens two windows (frontend and backend).
Then open http://localhost:5173 and click **Build** to start the simulations.

## Manual way (two terminals, from the `iot final` folder)
```
cd frontend
npm install
npm run dev
```
```
cd backend
npm install
npm run dev
```

## Notes
* The `.env` files are already created for you (`frontend/.env`, `backend/.env`).
* **The frontend works on its own**, including all 17 simulations, learning, quiz and certificate (progress is saved in the browser).
  The backend is only needed to save student data on a server, and it needs MongoDB:
  `cd backend && docker compose up -d`, or put a MongoDB Atlas link in `backend/.env` as `MONGODB_URI`.
* Requires Node.js 20 or newer (https://nodejs.org).
