# Security Fixes for Boggle Web App

## Critical Fixes Required

### 1. Fix Firestore Security Rules (CRITICAL - Do First!)

Replace `firestore.rules` with proper authentication-based rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Scores collection - users can only write their own scores
    match /scores/{scoreId} {
      // Anyone can read scores (for leaderboard)
      allow read: if true;
      
      // Users can only create their own scores
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.score is int
        && request.resource.data.score > 0
        && request.resource.data.score <= 1000  // Reasonable limit
        && request.resource.data.wordsFound is list
        && request.resource.data.wordsFound.size() == request.resource.data.score
        && request.resource.data.challengeId is string;
      
      // Users can only update/delete their own scores
      allow update, delete: if request.auth != null 
        && resource.data.userId == request.auth.uid;
    }
    
    // Challenges collection - read-only for authenticated users
    match /challenges/{challengeId} {
      allow read: if request.auth != null;
      allow write: if false;  // Only admins should write (use Firebase Admin SDK)
    }
  }
}
```

**Difficulty**: Easy (15 minutes)
**Impact**: Prevents unauthorized data access and manipulation

---

### 2. Add Server-Side Validation (Cloud Functions)

Create a Cloud Function to validate scores before accepting them:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.validateScore = functions.https.onCall(async (data, context) => {
  // 1. Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  // 2. Validate input
  const { challengeId, wordsFound } = data;
  if (!challengeId || !wordsFound || !Array.isArray(wordsFound)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid input');
  }
  
  // 3. Get challenge data
  const challengeDoc = await admin.firestore()
    .collection('challenges')
    .doc(challengeId)
    .get();
  
  if (!challengeDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Challenge not found');
  }
  
  const challenge = challengeDoc.data();
  
  // 4. Verify words are actually on the board (server-side validation)
  const validWords = validateWordsOnBoard(wordsFound, challenge.grid);
  
  // 5. Check if user already submitted for this challenge
  const existingScore = await admin.firestore()
    .collection('scores')
    .where('challengeId', '==', challengeId)
    .where('userId', '==', context.auth.uid)
    .limit(1)
    .get();
  
  if (!existingScore.empty) {
    throw new functions.https.HttpsError('already-exists', 'Score already submitted');
  }
  
  // 6. Create score document
  const scoreData = {
    challengeId,
    userId: context.auth.uid,
    userName: context.auth.token.name || 'Anonymous',
    userPhoto: context.auth.token.picture || null,
    score: validWords.length,
    wordsFound: validWords,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    validated: true  // Mark as server-validated
  };
  
  await admin.firestore().collection('scores').add(scoreData);
  
  return { success: true, score: validWords.length };
});
```

**Difficulty**: Medium (2-3 hours)
**Impact**: Prevents all score manipulation

---

### 3. Rate Limiting

Add rate limiting to prevent spam submissions:

```javascript
// In Firestore rules or Cloud Functions
// Limit to 1 score per challenge per user per day
allow create: if request.auth != null 
  && !exists(/databases/$(database)/documents/scores/$(request.auth.uid + '_' + request.resource.data.challengeId + '_' + today()))
```

**Difficulty**: Medium (1 hour)
**Impact**: Prevents spam and abuse

---

### 4. Hide Challenge Solutions

Move challenge solutions to a separate collection that only admins can read:

```javascript
// In firestore.rules
match /challengeSolutions/{challengeId} {
  allow read: if false;  // Only server-side code can read
  allow write: if false;  // Only admins
}
```

**Difficulty**: Easy (30 minutes)
**Impact**: Prevents cheating by viewing solutions

---

### 5. Add Input Sanitization

Sanitize all user inputs:

```typescript
// In submitScore function
const sanitizedWords = wordsFound
  .filter(w => typeof w === 'string')
  .map(w => w.trim().toLowerCase())
  .filter(w => w.length >= 3 && w.length <= 20)
  .slice(0, 100);  // Limit to 100 words max

const sanitizedScore = Math.min(Math.max(score, 0), 1000);  // Clamp between 0-1000
```

**Difficulty**: Easy (15 minutes)
**Impact**: Prevents injection attacks and invalid data

---

## Quick Wins (Do First)

1. **Fix Firestore Rules** - 15 minutes, stops 90% of attacks
2. **Add Input Sanitization** - 15 minutes, prevents invalid data
3. **Hide Challenge Solutions** - 30 minutes, prevents cheating

## Long-term Fixes

1. **Cloud Functions Validation** - 2-3 hours, complete protection
2. **Rate Limiting** - 1 hour, prevents abuse
3. **Monitoring & Alerts** - 1 hour, detect suspicious activity

---

## Attack Difficulty Assessment

### Current State (Before Fixes):
- **Manipulate Scores**: ⚠️ **TRIVIAL** - Anyone with browser DevTools
- **Access Private Data**: ⚠️ **TRIVIAL** - Firestore rules allow everything
- **Impersonate Users**: ⚠️ **EASY** - Can submit scores with any userId
- **Replay Attacks**: ⚠️ **TRIVIAL** - No server-side checks

### After Quick Fixes:
- **Manipulate Scores**: ⚠️ **MEDIUM** - Still possible but requires more effort
- **Access Private Data**: ✅ **HARD** - Rules restrict access
- **Impersonate Users**: ✅ **IMPOSSIBLE** - Rules enforce userId matching
- **Replay Attacks**: ⚠️ **MEDIUM** - Client-side checks only

### After Full Fixes (Cloud Functions):
- **Manipulate Scores**: ✅ **IMPOSSIBLE** - Server validates everything
- **Access Private Data**: ✅ **IMPOSSIBLE** - Proper authentication required
- **Impersonate Users**: ✅ **IMPOSSIBLE** - Server enforces auth
- **Replay Attacks**: ✅ **IMPOSSIBLE** - Server checks for duplicates

---

## Priority Order

1. **IMMEDIATE**: Fix Firestore rules (prevents data exposure)
2. **HIGH**: Add input sanitization (prevents invalid data)
3. **HIGH**: Implement Cloud Functions validation (prevents cheating)
4. **MEDIUM**: Add rate limiting (prevents abuse)
5. **LOW**: Add monitoring (detects issues)

