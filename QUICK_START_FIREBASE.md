# 🚀 Quick Start: Firebase for Tic Tac Toe

## 5-Minute Setup

### Step 1: Create Firebase Project (2 minutes)

1. Go to https://firebase.google.com
2. Click **"Get Started"**
3. Create new project named `tic-tac-toe-game`
4. Disable Google Analytics
5. Click **"Create project"**

### Step 2: Enable Services (1 minute)

**Authentication:**
- Click **"Authentication"** → **"Get started"**
- Select **"Anonymous"**
- Toggle **"Enable"** → **"Save"**

**Firestore Database:**
- Click **"Firestore Database"** → **"Create database"**
- Select **"Test mode"** → **"Next"**
- Choose region (closest to you)
- Click **"Create"**

### Step 3: Get Config (1 minute)

1. Go to **"Project settings"** (gear icon)
2. Go to **"Your apps"** → Click **"Web"** icon
3. Register app as `tic-tac-toe`
4. Copy the config object

### Step 4: Install Package (1 minute)

```bash
npm install firebase
```

### Step 5: Add to Your Project

Create `src/config/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Sign in anonymously on load
signInAnonymously(auth).catch(console.error);
```

### Step 6: Save User Data

Create `src/services/userService.ts`:

```typescript
import { auth, db } from '../config/firebase';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

export const saveUserStats = async (stats: any) => {
  if (!auth.currentUser) return;
  
  const userRef = doc(db, 'users', auth.currentUser.uid);
  
  // Check if user exists
  const docSnap = await getDoc(userRef);
  
  if (!docSnap.exists()) {
    // Create new user
    await setDoc(userRef, {
      name: `Player ${Math.floor(Math.random() * 10000)}`,
      wins: 0,
      losses: 0,
      draws: 0,
      createdAt: new Date(),
      ...stats
    });
  } else {
    // Update existing user
    await updateDoc(userRef, {
      ...stats,
      updatedAt: new Date()
    });
  }
};

export const getUserStats = async () => {
  if (!auth.currentUser) return null;
  
  const userRef = doc(db, 'users', auth.currentUser.uid);
  const docSnap = await getDoc(userRef);
  
  return docSnap.exists() ? docSnap.data() : null;
};
```

### Step 7: Update Your Game Logic

In `src/components/TicTacToe.tsx`, replace localStorage calls:

```typescript
import { saveUserStats } from '../services/userService';

// When someone wins
const recordWin = async (playerId: string) => {
  const stats = { wins: player.wins + 1 };
  await saveUserStats(stats);
  setUsers(prev => prev.map(u => 
    u.id === playerId ? { ...u, wins: u.wins + 1 } : u
  ));
};
```

### Step 8: Firestore Rules (Security)

In Firebase Console → Firestore → Rules tab:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

Click **"Publish"**

---

## ✅ That's It!

Your game now:
- ✅ Saves data to cloud
- ✅ Works offline with localStorage fallback
- ✅ Syncs across devices
- ✅ Is secure and scalable

---

## Next Steps

1. **Test it out** - Play a game and check Firestore for data
2. **Enable Realtime Leaderboard** - See updates instantly
3. **Add Cloud Functions** - Auto-calculate rankings
4. **Deploy to Firebase Hosting** - Share your game publicly

---

## Troubleshooting

**Data not saving?**
```javascript
// Add logging to see errors
saveUserStats(stats).catch(error => {
  console.error('Save failed:', error);
});
```

**Need fallback to localStorage?**
```typescript
const saveStats = async (stats: any) => {
  try {
    await saveUserStats(stats);
  } catch (error) {
    console.log('Cloud save failed, using localStorage');
    localStorage.setItem('gameStats', JSON.stringify(stats));
  }
};
```

**Want to reset data?**
- Go to Firestore Console
- Select document
- Click delete icon

---

## Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Firebase Auth](https://firebase.google.com/docs/auth)

---

## Cost

**Firebase Free Tier Includes:**
- 50K read operations/day
- 20K write operations/day
- 20K delete operations/day
- 1GB storage

**This is enough for:**
- 100+ daily active users
- Small competitive games
- Learning/hobby projects

Upgrade only if you go beyond limits!

---

Happy gaming! 🎮
