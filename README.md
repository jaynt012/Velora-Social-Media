# VELORA — Fresh, Beautiful Social Networking

A full-stack social networking platform built with a Node.js/Express/SQLite backend and a dependency-free HTML/CSS/vanilla JavaScript frontend. Velora is designed to be a safe, clean space for creativity and connection, utilizing a beautiful modern "claymorphism" aesthetic.

Live features include account registration and login, a dynamic chronological feed, a rich explore page, user profile management, real-time messaging powered by Socket.io, and a comprehensive notification system.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API reference](#api-reference)
- [Design system](#design-system)
- [Security](#security)
- [Known limitations](#known-limitations)
- [Roadmap](#roadmap)

---

## Features

**Feed & Explore**
- Dynamic user feed featuring posts from people you follow.
- Explore tab to discover trending tags and new creators.
- Rich media posts supporting text, images, likes, and nested comments.

**Accounts & Profiles**
- Secure registration and login with hashed passwords (bcrypt) and JWT-based sessions.
- Detailed user profiles displaying avatars, bios, follower/following counts, and post history.
- Follow and unfollow functionality to curate your network.

**Real-Time Messaging**
- Instant, real-time chat functionality built on Socket.io.
- Persistent conversation history fetched from the SQLite database.
- Read receipts and active status indicators.

**Notifications**
- Centralized notification hub for likes, follows, comments, and mentions.
- Unread notification badges updated dynamically.

**Design**
- Custom soft "claymorphism" design system — see [Design system](#design-system).
- Fully responsive, mobile-first layouts with smooth micro-animations.

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend runtime | Node.js |
| Backend framework | Express |
| Database | SQLite (`sqlite3` module) — works out of the box with zero configuration |
| Real-Time | `socket.io` for bidirectional WebSocket communication |
| Auth | `bcrypt` (password hashing), `jsonwebtoken` (session tokens) |
| Security middleware | `helmet` (HTTP security headers), `cors` |
| Frontend | Plain HTML5, CSS3 (custom properties, no bundler), vanilla JavaScript (`fetch` API) |
| Fonts | Pacifico (logo), Outfit (headings), Work Sans (body copy) |

---

## Project structure

```text
velora-social-media/
├── backend/
│   ├── config/
│   │   └── db.js               # Shared SQLite connection setup
│   ├── controllers/            # Request handling logic (auth, posts, users)
│   ├── middleware/
│   │   └── auth.middleware.js  # JWT verification for protected routes
│   ├── routes/                 # Express routers for modular API
│   ├── uploads/                # Local storage for user avatars/media
│   ├── database.sqlite         # Local database file
│   ├── .env                    # Environment variables
│   └── server.js               # App entry point & Socket.io server
│
├── frontend/
│   ├── css/
│   │   └── styles.css          # Core design tokens, layout, and utility classes
│   ├── js/
│   │   ├── api.js              # Centralized fetch wrappers and API definitions
│   │   ├── auth.js             # Form validation and session management
│   │   ├── feed.js             # Post rendering and timeline logic
│   │   └── ...                 # Other page-specific scripts
│   ├── favicon.ico             # Site icon
│   ├── index.html              # Landing page
│   ├── feed.html               # Main timeline
│   ├── explore.html            # Trending content
│   ├── messages.html           # Real-time chat interface
│   ├── profile.html            # User account view
│   └── login.html / signup.html
└── README.md
```

---

## Getting started

### Prerequisites
- Node.js installed on your machine.
- No global tools or native build chain needed.

### 1. Backend setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder (see [Environment variables](#environment-variables)):
```bash
PORT=5000
JWT_SECRET=velora_super_secret_jwt_key_2026
NODE_ENV=development
```
Start the API and WebSocket server:
```bash
npm start
```
The API will be running at `http://localhost:5000`.

### 2. Frontend setup
In a second terminal window, serve the static files:
```bash
cd frontend
npx serve .
```
Open the URL it prints (typically `http://localhost:3000`).

---

## Environment variables

Defined in `backend/.env`:

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on (default `5000`) |
| `JWT_SECRET` | Secret used to sign/verify session tokens — must be a long random string |
| `NODE_ENV` | Sets the application environment (e.g., `development` or `production`) |

`.env` is git-ignored and should never be committed or shared.

---

## API reference

All endpoints are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Authenticate and receive a token |
| GET | `/users/me` | Current user's profile |
| GET | `/users/:username` | View another user's profile |
| POST | `/users/:id/follow` | Follow a user |
| GET | `/posts` | Get paginated timeline feed |
| POST | `/posts` | Create a new post |
| POST | `/posts/:id/like` | Like a specific post |
| GET | `/messages/:userId` | Get chat history with a specific user |
| GET | `/notifications` | Get current user's notifications |

---

## Design system

Velora utilizes a unique and visually engaging design language:

- **Claymorphism Aesthetic:** Soft, fluffy 3D effects on cards and buttons. Elements feel tactile, created using multi-layered, colored inner and outer drop shadows.
- **Color Palette:** A soothing mix of light pastels — Peach (`--clr-peach`), Sky Blue (`--clr-sky`), Lavender (`--clr-lavender`), and Mint (`--clr-mint`).
- **Typography:** Uses **Outfit** for clean, modern headings and bold elements, **Work Sans** for highly legible body copy, and a distinct **Pacifico** cursive script for the Velora brand logo to give it a human touch.
- **Motion:** Generous use of micro-animations, slow smooth floating states, and responsive hover effects.

---

## Security

- Passwords are unconditionally hashed with bcrypt before being written to the SQLite database.
- Authentication relies on stateless JWT tokens.
- `helmet` is configured to set standard, strict HTTP security headers across the API.
- `cors` is enabled for secure cross-origin requests between the frontend and backend.
- Prepared statements are used across the application to prevent SQL injection vulnerabilities.

---

## Known limitations

- No email verification or password reset flow currently exists.
- Media uploads are currently stored locally in the backend file system rather than an external bucket (like AWS S3).
- Direct messages do not yet support rich media (images/videos).
---

*A portfolio project — developed by Jayant.*
