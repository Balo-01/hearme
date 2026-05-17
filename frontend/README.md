# HearMe Frontend

This folder contains the frontend application for HearMe, a patient-nurse communication prototype.

## Main Features

- Patient request flows:
	- Basic Needs
	- Communication
	- Pain (area + intensity)
	- Emergency
	- Button selection using only eye gaze, without the need for touch or click.
	- Final confirmation screen with Yes and No logic.
- Request sent feedback screen with timed redirect behavior.
	- Nurse dashboard mock:
		- Request list (left)
		- On the right: the patient's request, detailed request, and an AI-generated summary based on both the patient's medical history and previous requests.
		- Status lifecycle (pending / resolved)
		- Access note: the page is currently available only by manually using /nurse in the browser URL.

## Run The App

### Prerequisites

- Node.js
- npm

If Node.js is not installed yet:

1. Open the company software portal.
2. Install the approved Node.js package.
3. Restart the terminal after installation.

Verify the installation:

```bash
node -v
npm -v
```

### Steps

1. Open a terminal in this folder ('frontend').
2. Install dependencies:

```bash
npm install
```

3. Start development server:

```bash
npm run dev
```

4. Open the URL shown in terminal (usually `http://localhost:5173`).

## Routes

- / - Home
- /basic-needs
- /communication
- /pain
- /emergency
- /final-answer
- /request-sent
- /nurse

## Current Scope

- Nurse requests are currently mocked for UI presentation.
- AI reformulation and patient history are placeholders for future backend + AI integration.
