<div align="center">

# 🔍 Lost&Found

### *You had a moment. We'll get it to happily ever after.*

**Reconnecting real human moments in a disconnected world.**

[![HackPrinceton Spring 2026](https://img.shields.io/badge/HackPrinceton-Spring%202026-4B6CB7?style=for-the-badge)](https://hackprinceton.com)
[![Healthcare Track](https://img.shields.io/badge/Track-Healthcare-E07B5A?style=for-the-badge)](https://hackprinceton.com)
[![Rookie Hack](https://img.shields.io/badge/Category-Rookie%20Hack-6BAF92?style=for-the-badge)](https://hackprinceton.com)
[![Next.js](https://img.shields.io/badge/Built%20with-Next.js-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)

[🌐 foundagain.us](https://foundagain.us) · [📽️ Devpost](#) · [🎨 Figma](#)

</div>

---

## 💡 The Problem

Every day, you lock eyes with someone on the subway. You smile at a stranger at the coffee shop. You feel something — and then they're gone.

> *1 in 2 U.S. adults report measurable levels of loneliness.*
> The U.S. Surgeon General has declared loneliness as dangerous as smoking 15 cigarettes a day.

**The connections are happening. We're just losing them.**

---

## ✨ What is Lost&Found?

Lost&Found is an **anonymous missed connections app** that uses AI to reunite people who felt a spark in real life — but never got the chance to meet.

Unlike dating apps where you swipe on strangers, Lost&Found is for people you've **already seen** and **already felt something about**. The spark happened. We just help you find each other again.

| Random Dating Apps | Lost&Found |
|---|---|
| Swipe on strangers | Reconnect someone you already saw |
| Algorithm picks for you | The spark already happened |
| No real-world context | Real moments, real places |
| Dopamine-driven scrolling | Intent-driven, not scroll-driven |

---

## 🚀 How It Works

```
1. 📝 Describe the moment   →   Where, when, what happened, what they wore
2. 🤖 AI searches quietly   →   Gemini vectorizes & finds matching moments
3. ✅ Both confirm          →   Mutual confirmation before any info is shared
4. 💬 Group chat created    →   Photon connects you. The rest is up to you.
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js** — React framework for the web app
- **GoDaddy** — Custom domain [`foundagain.us`](https://foundagain.us)

### Backend & Database
- **Supabase** — PostgreSQL database + auth + edge functions
- **pg_vector** — Vector similarity search for moment matching
- **Daedalus VMs** — 24/7 background matching agent

### AI & Matching
- **Gemini API** — Vectorization + semantic matching of moment descriptions
- **K2 Think** — Generates personalized date ideas on match
- **Pronoun swapping** — Matches descriptions written from opposite perspectives (she→he, etc.)
- **Cosine similarity** — Threshold of 0.7 for confident matches

### Communication
- **Photon** — Creates a group text chat between matched users
- **OTP Phone Verification** — One account per phone number

---

## 🧠 Matching Algorithm

```
User posts moment
       ↓
Gemini vectorizes description
       ↓
Pronoun-swap (she↔he) + cosine similarity search
       ↓
Filter by time window & location radius
       ↓
Top-k matches above 0.7 threshold
       ↓
Mutual confirmation (both users confirm photo)
       ↓
Photon creates group chat + K2 generates date idea
```

---

## 🔒 Built With Safety First

| Feature | Why it matters |
|---|---|
| 📱 **Phone verification** | One account per number. No duplicates, no fake profiles. |
| ✅ **Mutual confirmation** | Both people confirm before any personal info is shared. |
| 🗓️ **30-day auto-expiry** | All posts auto-delete after 30 days. Clean and safe. |
| 🚫 **No browsing** | You can't scroll through people. You only see matches to your own moment. |

---

## 🗄️ Database Schema

<details>
<summary>Click to expand</summary>

```sql
-- Users
Users { id, name, profile_picture, phone_number, age, likes, dislikes, created_at }

-- Moments (the missed connection posts)
Moments { id, user_id, event_time, description, description_embedding (pg_vector), location (lat/lng), expires_at }

-- Confirmations (pending matches)
Confirmations { id, user_a_id, user_b_id, moment_a_id, moment_b_id, user_a_confirmed, user_b_confirmed, confidence_score }

-- Matches (confirmed connections)
Matches { id, user_a_id, user_b_id, moment_a_id, moment_b_id, chat_id }
-- TRIGGER: on INSERT → Supabase edge function → Photon group chat + K2 date idea
```

</details>

---

## 📡 API Routes

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/moments` | Submit a new missed connection moment |
| `GET` | `/moments` | Get all moments by current user |
| `DELETE` | `/moments` | Delete a moment by ID |
| `POST` | `/confirmations` | Confirm or initiate a match |
| `GET` | `/matches` | Get all matches for current user |
| `GET` | `/users/me` | Get current user profile |
| `PUT` | `/users/me` | Update current user profile |
| `CRON` | `/moments/cleanup` | Daily cleanup of expired moments (30 days) |

---

## 🖥️ Running Locally

```bash
# Clone the repo
git clone https://github.com/your-org/lostandfound.git
cd lostandfound

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase, Gemini, and Photon keys

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🌐 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/auth` | Sign in / Sign up |
| `/onboarding` | Profile setup |
| `/home` | Home screen |
| `/moments/new` | Submit a new moment |
| `/moments` | View your moments |
| `/matches` | View confirmations & matches |
| `/profile` | Your profile |

---

## 👥 The Team — Rookie Hack

<div align="center">

| Senjuti | Logan | Pranav | Nitya |
|---|---|---|---|
| Stockton University | Tufts University | Stevens Institute of Technology | Rutgers University |

</div>

---

<div align="center">

*"We're not building another dating app.*
*We're turning missed connections into real ones.*
*Because no one should wonder 'what if' forever."*

**[foundagain.us](https://foundagain.us) · HackPrinceton Spring 2026**

</div>
