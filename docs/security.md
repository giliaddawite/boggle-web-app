# Security Notes

This documents the security model for score submission and challenge data,
what was wrong in the first version, what was fixed, and what is still open.

## The original problem

The project shipped with Firebase's default development rules:

```
match /{document=**} {
  allow read, write: if request.time < timestamp.date(2025, 12, 5);
}
```

That meant two things:

- Anyone who found the Firebase project ID could read, write, or delete every
  document in Firestore, including other players' scores and the challenge
  definitions.
- The rules were set to expire on Dec 5, 2025, after which every client
  request would have been denied and the app would have stopped working.

Score submission also trusted the client completely. The client wrote whatever
`score` and `wordsFound` it had in memory, with no checks on either side.

## What was fixed

Commit `7fc348e` replaced the default rules and tightened the client.

**Firestore rules** (`firestore.rules`):

- `scores` is readable by anyone, so the leaderboard works without sign-in.
- Creating a score requires a signed-in user, and the `userId` on the
  document must match the caller's `uid`. You cannot submit a score as
  someone else.
- `score` must be an integer between 1 and 1000, `wordsFound` must be a list
  whose length equals `score`, and `challengeId`, `userName`, and
  `timestamp` must have the right types.
- Only the owner can update or delete a score.
- `challenges` is readable by signed-in users and not writable from the
  client at all. Challenges are added with the Admin SDK or the console.

**Client-side validation** (`submitScore` in `src/ui/BoggleGame.tsx`):

- Refuses to submit when there is no signed-in user or active challenge.
- Checks that `score` equals the number of words, that it is in bounds, that
  every entry is a string of 3 to 20 characters, and that every word is in
  the solved word list for the current board.
- Falls back to `'Anonymous'` and `null` for missing display name and photo,
  so the document always satisfies the rules.

## What is still open

The client checks above stop accidental bad data, not a determined player.
A signed-in user can still call Firestore directly from the browser console
and write a score document that passes the rules: any list of strings works
as long as its length equals `score` and `score` is at most 1000.

Closing that would require:

- **Server-side validation.** A Cloud Function that receives `challengeId`
  and `wordsFound`, re-solves the challenge grid on the server, and writes
  the score itself. Client writes to `scores` would then be disabled.
- **Hiding solutions.** Challenge documents currently include a `solutions`
  array that the client downloads. Moving it to a collection only the
  server can read would stop players reading the answer key.
- **One submission per challenge.** The "first attempt only" rule is
  enforced in the client. The rules do not prevent a second create.

None of these are implemented. For a class project with a small player base
the current rules are an acceptable trade-off, but they should not be
mistaken for cheat-proofing.
