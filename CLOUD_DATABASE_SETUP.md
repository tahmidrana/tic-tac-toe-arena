# 🌐 Cloud Database Setup Guide

## Overview

This guide explains how to add cloud database support to your Tic Tac Toe game to persist user data across devices and sessions.

---

## Option 1: Firebase (Recommended - Easiest)

### Why Firebase?
- ✅ **Free tier** with generous limits
- ✅ **Real-time database** updates
- ✅ **Authentication** built-in
- ✅ **No backend server** needed
- ✅ **Easy integration** with React
- ✅ **Scalable** and reliable

### Step 1: Create Firebase Project

1. Go to [firebase.google.com](https://firebase.google.com)
2. Click **"Get Started"** or **"Go to console"**
3. Click **"Create a project"**
4. Enter project name: `tic-tac-toe-game`
5. Disable **"Enable Google Analytics"** (optional)
6. Click **"Create project"**
7. Wait for project setup to complete

### Step 2: Enable Authentication

1. In Firebase console, go to **"Authentication"** (left menu)
2. Click **"Get started"**
3. Click **"Anonymous"**
4. Toggle **"Enable"**
5. Click **"Save"**

This allows users to play without creating an account.

### Step 3: Create Firestore Database

1. Go to **"Firestore Database"** (left menu)
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Select region: **"us-central1"** or closest to you
5. Click **"Create"**

### Step 4: Set Firestore Security Rules

1. In Firestore, go to **"Rules"** tab
2. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    // Allow users to read all user stats (for leaderboard)
    match /users/{userId} {
      allow read: if request.auth != null;
    }
    // Allow public leaderboard access
    match /leaderboard/{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

### Step 5: Get Firebase Config

1. Go to **"Project settings"** (gear icon, top right)
2. Go to **"Your apps"** section
3. Click **"Web"** icon to create web app
4. Enter app name: `tic-tac-toe`
5. Click **"Register app"**
6. Copy the config (you'll need it in Step 7)

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 6: Install Firebase Package

```bash
npm install firebase
```

### Step 7: Create Firebase Service

Create `src/services/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  Auth,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  orderBy,
  getDocs,
  Firestore
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Sign in anonymously
export const signInAnon = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Auth error:', error);
    throw error;
  }
};

// Save user data to Firestore
export const saveUserData = async (userId: string, userData: any) => {
  try {
    await setDoc(doc(db, 'users', userId), userData);
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

// Get user data from Firestore
export const getUserData = async (userId: string) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

// Update user stats
export const updateUserStats = async (userId: string, stats: any) => {
  try {
    await updateDoc(doc(db, 'users', userId), stats);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Get leaderboard (top 10 players)
export const getLeaderboard = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('winRate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
};

// Listen to auth state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
```

### Step 8: Create Cloud Database Store Hook

Create `src/hooks/useCloudStore.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import {
  signInAnon,
  saveUserData,
  getUserData,
  updateUserStats,
  onAuthChange,
  auth,
} from '../services/firebase';
import { User as FirebaseUser } from 'firebase/auth';

export interface User {
  id: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalGames: number;
  createdAt: number;
  updatedAt: number;
}

export const useCloudStore = () => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize auth
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Get or create user data
        const userData = await getUserData(user.uid);
        if (!userData) {
          // Create new user
          const newUser: User = {
            id: user.uid,
            name: `Player ${Math.floor(Math.random() * 10000)}`,
            wins: 0,
            losses: 0,
            draws: 0,
            winRate: 0,
            totalGames: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await saveUserData(user.uid, newUser);
          setUsers([newUser]);
        } else {
          setUsers([userData]);
        }
      } else {
        // Sign in anonymously
        const anonUser = await signInAnon();
        setCurrentUser(anonUser);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const recordWin = useCallback(async (userId: string) => {
    if (!currentUser) return;
    
    const updatedStats = {
      wins: (users[0]?.wins || 0) + 1,
      totalGames: (users[0]?.totalGames || 0) + 1,
      updatedAt: Date.now(),
    };
    
    updatedStats.winRate = updatedStats.wins / updatedStats.totalGames;
    
    await updateUserStats(userId, updatedStats);
    
    // Update local state
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, ...updatedStats } : u
    ));
  }, [currentUser, users]);

  const recordLoss = useCallback(async (userId: string) => {
    if (!currentUser) return;
    
    const updatedStats = {
      losses: (users[0]?.losses || 0) + 1,
      totalGames: (users[0]?.totalGames || 0) + 1,
      updatedAt: Date.now(),
    };
    
    updatedStats.winRate = users[0]?.wins / updatedStats.totalGames || 0;
    
    await updateUserStats(userId, updatedStats);
    
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, ...updatedStats } : u
    ));
  }, [currentUser, users]);

  const recordDraw = useCallback(async (userIds: string[]) => {
    if (!currentUser) return;
    
    for (const userId of userIds) {
      const updatedStats = {
        draws: (users[0]?.draws || 0) + 1,
        totalGames: (users[0]?.totalGames || 0) + 1,
        updatedAt: Date.now(),
      };
      
      updatedStats.winRate = users[0]?.wins / updatedStats.totalGames || 0;
      
      await updateUserStats(userId, updatedStats);
    }
    
    setUsers(prev => prev.map(u => 
      userIds.includes(u.id) 
        ? { ...u, draws: u.draws + 1, totalGames: u.totalGames + 1 }
        : u
    ));
  }, [currentUser, users]);

  const renameUser = useCallback(async (userId: string, newName: string) => {
    await updateUserStats(userId, { name: newName, updatedAt: Date.now() });
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, name: newName } : u
    ));
  }, []);

  return {
    currentUser,
    users,
    loading,
    recordWin,
    recordLoss,
    recordDraw,
    renameUser,
  };
};
```

### Step 9: Update Game Store to Use Cloud

Modify `src/store/gameStore.ts` to use cloud storage:

```typescript
// Add at top
import { useCloudStore } from '../hooks/useCloudStore';

export const useGameStore = () => {
  // Use cloud store if available
  const cloudStore = useCloudStore();
  
  if (cloudStore.currentUser) {
    return {
      users: cloudStore.users,
      recordWin: (id) => cloudStore.recordWin(id),
      recordLoss: (id) => cloudStore.recordLoss(id),
      recordDraw: (ids) => cloudStore.recordDraw(ids),
      renameUser: (id, name) => cloudStore.renameUser(id, name),
      getRankedUsers: () => [...cloudStore.users].sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.wins - a.wins;
      }),
      updateUser: async (id, updates) => {
        await cloudStore.renameUser(id, updates.name);
      },
      resetStats: async (id) => {
        // Handle reset
      },
    };
  }
  
  // Fallback to localStorage
  return useLocalStore();
};
```

---

## Option 2: Supabase (PostgreSQL)

### Why Supabase?
- ✅ **PostgreSQL database** (more powerful)
- ✅ **Free tier** similar to Firebase
- ✅ **Real-time subscriptions**
- ✅ **Built-in authentication**
- ✅ **REST API**

### Setup Steps

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Create account and organization
4. Create new project (choose region closest to you)
5. Wait for database provisioning

### Create Table

In Supabase SQL Editor, run:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  name TEXT NOT NULL,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  win_rate FLOAT DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_win_rate ON users(win_rate DESC);
```

### Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Create Supabase Service

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Save user
export const saveUser = async (userId: string, userData: any) => {
  const { error } = await supabase
    .from('users')
    .upsert(userData);
  
  if (error) throw error;
};

// Get user
export const getUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// Update stats
export const updateUserStats = async (userId: string, stats: any) => {
  const { error } = await supabase
    .from('users')
    .update(stats)
    .eq('id', userId);
  
  if (error) throw error;
};

// Get leaderboard
export const getLeaderboard = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('win_rate', { ascending: false })
    .limit(10);
  
  if (error) throw error;
  return data;
};
```

---

## Option 3: MongoDB + Custom Backend

### Why Custom Backend?
- ✅ **Full control** over data
- ✅ **Custom business logic**
- ✅ **Scalable architecture**
- ⚠️ **Requires backend** (Node.js, Python, etc.)
- ⚠️ **More setup** required

### Basic Architecture

```
React App → Express Server → MongoDB
```

### Create Node.js Backend

**server.js**:

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/tic-tac-toe');

// User schema
const userSchema = new mongoose.Schema({
  _id: String,
  name: String,
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  winRate: { type: Number, default: 0 },
  totalGames: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

// API Routes
app.post('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { upsert: true, new: true }
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const users = await User.find()
      .sort({ winRate: -1, wins: -1 })
      .limit(10);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Create API Client

**src/services/api.ts**:

```typescript
const API_URL = 'http://localhost:3000/api';

export const saveUser = async (id: string, data: any) => {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const getUser = async (id: string) => {
  const response = await fetch(`${API_URL}/users/${id}`);
  return response.json();
};

export const getLeaderboard = async () => {
  const response = await fetch(`${API_URL}/leaderboard`);
  return response.json();
};
```

---

## Comparison Table

| Feature | Firebase | Supabase | MongoDB |
|---------|----------|----------|---------|
| **Setup Difficulty** | Very Easy | Easy | Hard |
| **Cost** | Free tier generous | Free tier generous | Varies |
| **Real-time** | Yes | Yes | No |
| **Authentication** | Built-in | Built-in | Manual |
| **Learning Curve** | Low | Low | High |
| **Scalability** | Excellent | Excellent | Depends |
| **Backend Needed** | No | No | Yes |
| **Recommended** | ✅ YES | ✅ YES | ⚠️ For advanced needs |

---

## Recommended: Firebase Implementation

For your Tic Tac Toe game, **Firebase is recommended** because:

1. ✅ **Easiest setup** - No backend required
2. ✅ **Free tier** - Generous limits for casual gaming
3. ✅ **Real-time updates** - Player stats update instantly
4. ✅ **Built-in auth** - Anonymous login ready
5. ✅ **Secure by default** - Security rules included
6. ✅ **Scalable** - Grows with your app

---

## Next Steps

1. **Choose Firebase** (recommended)
2. **Follow Steps 1-9** above
3. **Replace your config** with actual Firebase credentials
4. **Test** with the game
5. **Deploy** to Firebase Hosting (optional)

### Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init
npm run build
firebase deploy
```

---

## Troubleshooting

**Issue**: Data not saving
- Check Firebase security rules
- Verify user is authenticated
- Check browser console for errors

**Issue**: Slow performance
- Add indexes to frequently queried fields
- Limit leaderboard queries with `.limit(100)`
- Use offline persistence in Firebase SDK

**Issue**: High costs
- Monitor Firebase usage
- Set up budget alerts
- Optimize query patterns

---

## Security Best Practices

1. ✅ **Never expose API keys** - Use environment variables
2. ✅ **Validate data** - Check all inputs server-side
3. ✅ **Rate limiting** - Prevent spam/abuse
4. ✅ **Data encryption** - Use HTTPS (always)
5. ✅ **Regular backups** - Enable automated backups
6. ✅ **Monitor activity** - Set up logging/alerts

---

For questions or issues, refer to:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
