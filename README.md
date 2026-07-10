# Swinburne Hackathon: Advanced Fraud Detection System

## Project Overview

This project is a **real-time banking fraud detection system** that combines a **multi-database architecture** with **AI Agents** to perform multi-dimensional risk analysis. The goal is to maximize fraud detection accuracy while maintaining a seamless experience for legitimate customers.

The project consists of two main components:

- **Backend:** AI Agents (Planner, Vision, Detective, and Report) integrated with four specialized databases (Redis, MongoDB, Neo4j, and ChromaDB).
- **Frontend:** A modern mobile banking application built with **React Native (Expo)** for transaction simulation and demonstration.

---

## Note about `simulators.py`

The file `backend/simulators.py` is only used for backend simulation during offline demos or rapid development.

When running the complete system with the actual infrastructure, the application communicates directly with Redis, MongoDB, Neo4j, and ChromaDB. Therefore, this file is **not required** for production deployment and can be safely ignored or removed.

---

# 1. Clone the Repository

```bash
git clone https://github.com/Khoa-Neee/fraud-detection-system.git
cd fraud-detection-system
```

---

# 2. Backend Setup

## 2.1 Install Python Dependencies

Open a terminal and navigate to the backend directory.

You may choose either **venv** or **Conda**.

### Option 1 — Python venv

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Option 2 — Conda (Recommended)

```bash
cd backend

conda create -n backend_env python=3.10 -y
conda activate backend_env

pip install -r requirements.txt
```

---

## 2.2 Create Accounts and Obtain API Keys

Create free-tier accounts for the following services:

### 1. Redis Enterprise Cloud

Used as an ultra-fast cache for Phase 1 transaction screening.

### 2. Neo4j AuraDB

Graph database used to analyze hidden relationships, suspicious transaction flows, and fraud networks.

### 3. MongoDB Atlas

Stores customer profiles and transaction histories as the system's primary operational database.

### 4. ChromaDB (Cloud or Local)

Vector database containing fraud knowledge, historical fraud patterns, and retrieval documents.

### 5. Google Gemini API

Obtain an API key from Google AI Studio to power the AI Agents.

---

## 2.3 Configure Environment Variables

Create a `.env` file inside the `backend` directory.

You can simply copy the template:

```bash
cp .env.example .env
```

Fill in all required credentials and API keys obtained from the previous step.

---

## 2.4 Generate Demo Data

Populate all databases with sample customers, transactions, graph relationships, and fraud rules.

```bash
python setup_demo.py
```

This script automatically inserts demo data into Redis, MongoDB, Neo4j, and ChromaDB.

---

# 3. Run the Application

## 3.1 Start the Backend

Inside the `backend` directory, launch the FastAPI server:

```bash
python main.py --serve
```

---

## 3.2 Configure the Backend Address

When running the mobile application on a physical phone, the frontend must connect to your computer's LAN IP instead of `localhost`.

### Windows

Open Command Prompt:

```bash
ipconfig
```

Find your **IPv4 Address**, for example:

```
192.168.1.10
```

Open:

```
frontend/src/services/api.js
```

Replace the value of:

```javascript
BACKEND_HOST
```

with your computer's IPv4 address.

> **Important:** Do not use `localhost`, since your mobile device cannot access your computer using localhost.

---

## 3.3 Start the Frontend

Open a **new terminal**.

```bash
cd frontend

npm install

npx expo start -c
```

---

## 3.4 Run on a Mobile Device

Install **Expo Go**.

### iOS

Download **Expo Go** from the App Store.

Open the iPhone Camera app and scan the QR code displayed in the terminal.

### Android

Download **Expo Go** from Google Play.

Open Expo Go and scan the QR code.

> **Important:** Your computer and mobile device must be connected to the **same Wi-Fi/LAN network**.

---

# 4. Demo Scenarios

Sign in using the following customer ID:

```
C1003668831
```

**Customer:** Huynh Vinh Hai

This customer has a strong transaction history and belongs to the **low-risk** customer group.

After logging in, navigate to:

```
Domestic Transfer
```

Then test the following scenarios.

---

## Scenario 1 — Normal Transaction

A customer transfers a small amount to another trusted customer.

### Receiver

```
C1004838919
```

**Customer:** Bui Uyen An

### Amount

```
10
```

### Description

```
Tra tien ca phe
```

### Expected Result

The transaction is approved immediately after the initial screening because the overall risk score is very low.

No advanced AI analysis is triggered, ensuring a fast and smooth user experience.

---

## Scenario 2 — Suspicious Transaction

The customer transfers money to an account that has suspicious behavioral patterns and possible links to fraudulent financial networks, although it has not yet been blacklisted.

### Receiver

```
C1102413633
```

**Customer:** Le Hai Vinh

### Amount

```
5000
```

### Description

```
Thanh toan don hang
```

### Expected Result

The transaction passes the initial screening because:

- both accounts appear trustworthy,
- the transfer amount is below the automatic AML blocking threshold.

However, the system automatically activates multiple AI Agents to perform in-depth investigation, including:

- Relationship analysis
- Behavioral analysis
- Historical transaction analysis
- Fraud pattern retrieval

If the final risk assessment indicates a high fraud probability, the transaction is **blocked**, and a detailed explanation is generated to justify the decision.
