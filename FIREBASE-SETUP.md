# Create Your Firebase Project (step-by-step)

You can create the project **via CLI** (recommended for a new project) or in the **Firebase Console**. Then link this folder and enable Firestore/Hosting.

---

## Option A: New project via CLI (then link)

**1. Log in** (if you haven’t):

```bash
firebase login
```

**2. Create a new project** (project ID must be globally unique, 6–30 characters):

```bash
firebase projects:create incident-portal-demo-YOUR_SUFFIX
```

Use a unique suffix (e.g. your initials + numbers: `incident-portal-demo-jd42`). You’ll be prompted for an optional display name.

**3. Link this folder** to that project (use the **project ID** you just created):

```bash
firebase use incident-portal-demo-YOUR_SUFFIX
```

**4. Enable Firestore** in the [Firebase Console](https://console.firebase.google.com/) for this project: **Build → Firestore Database → Create database** (test mode, pick a location).

**5. Register a Web app** to get config: **Project settings → Your apps → Web (`</>`) → Register app**. Copy the config into `.env` (see “Add config to this app” below).

**6. Deploy rules and (optional) hosting:**

```bash
firebase deploy --only firestore:rules
npm run build && firebase deploy --only hosting
```

---

## Option B: Firebase Console (create project in browser)

## 1. Open Firebase Console

Go to: **https://console.firebase.google.com/**

Sign in with your Google account.

---

## 2. Create a project

1. Click **“Create a project”** (or **“Add project”**).
2. Enter a **project name** (e.g. `incident-portal-demo`).
3. (Optional) Disable Google Analytics if you don’t need it for the demo.
4. Click **“Create project”** and wait until it’s ready, then **“Continue”**.

---

## 3. Enable Firestore

1. In the left sidebar, go to **Build → Firestore Database**.
2. Click **“Create database”**.
3. Choose **“Start in test mode”** (or production and then relax rules for demo).
4. Pick a Firestore location (e.g. `us-central1`), then **“Enable”**.

---

## 4. Enable Hosting (optional, for deploy later)

1. In the left sidebar, go to **Build → Hosting**.
2. Click **“Get started”** and follow the one-time setup (no need to run the suggested CLI commands yet).

---

## 5. Register a Web app and get config

1. Click the **gear icon** next to “Project overview” → **“Project settings”**.
2. Scroll to **“Your apps”**.
3. Click the **Web** icon (`</>`) to add a web app.
4. Enter an **App nickname** (e.g. `Incident Portal`) and leave “Firebase Hosting” unchecked for now.
5. Click **“Register app”**.
6. You’ll see a config object like:

   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc..."
   };
   ```

7. Copy these values into your `.env` file (see below).

---

## 6. Add config to this app

In the **ticketing-portal** folder, create a file named `.env` (or copy from `.env.example`):

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

Replace the placeholder values with the ones from the Firebase Console.

---

## 7. Link this folder to your Firebase project (for deploy)

In a terminal, from the **ticketing-portal** folder:

```bash
# Install Firebase CLI if needed: npm install -g firebase-tools
firebase login
firebase use --add
```

Select the project you just created, and give it an alias (e.g. `default`).

Then deploy Firestore rules and (optionally) hosting:

```bash
firebase deploy --only firestore:rules
npm run build && firebase deploy --only hosting
```

---

You’re done. Run `npm run dev` and log in with **admin** / **admin** to use the incident portal.
