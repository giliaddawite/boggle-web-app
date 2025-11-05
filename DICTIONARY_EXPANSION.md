# Dictionary Expansion Guide

## Current Status
✅ **Just expanded**: Added ~2000+ more common words to the dictionary
- Now includes many more 3-5 letter words
- Still missing many words for production use

## How to Check for Missing Words

### Option 1: Use the Check Script (Recommended)
I've created `checkDictionary.js` that you can run to check for common missing words.

### Option 2: Use Online Boggle Solvers
1. Go to an online Boggle solver (e.g., https://word.tips/boggle-solver/)
2. Input your board configuration
3. Compare the words found with what your game accepts
4. Add missing words to the dictionary

### Option 3: Use a Comprehensive Word List

**For production, use a larger dictionary:**

1. **Download words_alpha.txt** (~370,000 words)
   - Source: https://github.com/dwyl/english-words
   - File: `words_alpha.txt`

2. **Filter for Boggle-appropriate words** (3-15 letters, lowercase, alphabetical only)

3. **Import into your dictionary:**

```typescript
// In src/utils/dictionary.ts
import wordsList from './words_alpha.txt?raw'

export const DICTIONARY: string[] = wordsList
  .split('\n')
  .filter(word => word.length >= 3 && word.length <= 15)
  .map(word => word.trim().toLowerCase())
  .filter(word => /^[a-z]+$/.test(word)) // Only letters
```

## Quick Additions

I've just added many common words. If you find more missing words during gameplay, you can add them directly to the dictionary array.

## Recommendation

For your assignment, the current expanded dictionary (~2000+ words) should work well for testing. For production, consider using a comprehensive word list.

