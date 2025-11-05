// Script to check if common words are in the dictionary
// Run with: node checkDictionary.js

import { DICTIONARY } from './src/utils/dictionary.js'

// Common words that should be in a Boggle dictionary
const commonWords = [
	// 3-letter words
	'ace', 'act', 'add', 'age', 'ago', 'air', 'ale', 'and', 'ant', 'any', 'ape', 'are', 'ark', 'arm', 'art', 'ash', 'ask', 'ate', 'axe',
	'bad', 'bag', 'ban', 'bar', 'bat', 'bay', 'bed', 'bee', 'beg', 'bet', 'bid', 'big', 'bin', 'bit', 'bog', 'boo', 'bow', 'box', 'boy', 'bug', 'bus', 'but', 'buy', 'bye',
	'cab', 'can', 'cap', 'car', 'cat', 'cog', 'cop', 'cot', 'cow', 'cry', 'cub', 'cue', 'cup', 'cut',
	'dab', 'dad', 'dam', 'day', 'den', 'dew', 'did', 'die', 'dig', 'dim', 'din', 'dip', 'dog', 'dot', 'dry', 'due', 'dug',
	'ear', 'eat', 'ebb', 'eel', 'egg', 'ego', 'elf', 'elk', 'elm', 'end', 'era', 'eve', 'eye',
	'fan', 'far', 'fat', 'fax', 'fed', 'fee', 'fen', 'few', 'fig', 'fin', 'fir', 'fit', 'fix', 'flu', 'fly', 'fog', 'for', 'fox', 'fun', 'fur',
	'gal', 'gap', 'gas', 'gel', 'gem', 'get', 'gig', 'gin', 'got', 'gum', 'gun', 'gut', 'guy',
	'had', 'ham', 'has', 'hat', 'hay', 'hen', 'her', 'hey', 'hid', 'him', 'hip', 'his', 'hit', 'hog', 'hop', 'hot', 'how', 'hub', 'hug', 'hut',
	'ice', 'icy', 'ill', 'ink', 'inn', 'ion', 'ire', 'its', 'ivy',
	'jam', 'jar', 'jaw', 'jay', 'jet', 'jog', 'joy', 'jug', 'jut',
	'kid', 'kin', 'kit',
	'lab', 'lad', 'lag', 'lap', 'law', 'lax', 'lay', 'led', 'leg', 'let', 'lid', 'lie', 'line', 'lip', 'lit', 'log', 'lot', 'low',
	'mad', 'man', 'map', 'mat', 'may', 'men', 'met', 'mid', 'mix', 'mob', 'mom', 'mop', 'mud', 'mug', 'mum',
	'nab', 'nag', 'nap', 'nay', 'net', 'new', 'nil', 'nip', 'nod', 'nor', 'not', 'now', 'nut',
	'oak', 'oar', 'oat', 'odd', 'off', 'oft', 'oil', 'old', 'one', 'orb', 'ore', 'our', 'out', 'owl', 'own',
	'pad', 'pal', 'pan', 'par', 'pat', 'paw', 'pay', 'pea', 'peg', 'pen', 'pep', 'per', 'pet', 'pie', 'pig', 'pin', 'pip', 'pit', 'ply', 'pod', 'pop', 'pot', 'pro', 'pun', 'pup', 'put',
	'rag', 'ram', 'ran', 'rap', 'rat', 'raw', 'ray', 'red', 'rib', 'rid', 'rig', 'rim', 'rip', 'rod', 'roe', 'rot', 'row', 'rub', 'rug', 'rum', 'run', 'rye',
	'sad', 'sag', 'sap', 'sat', 'saw', 'say', 'sea', 'see', 'set', 'sew', 'she', 'shy', 'sin', 'sip', 'sir', 'sit', 'six', 'ski', 'sky', 'sly', 'sob', 'sod', 'son', 'sow', 'soy', 'spa', 'spy', 'sub', 'sun', 'sup',
	'tab', 'tad', 'tag', 'tan', 'tap', 'tar', 'tax', 'tea', 'tee', 'ten', 'the', 'thy', 'tie', 'tin', 'tip', 'toe', 'ton', 'too', 'top', 'toy', 'try', 'tub', 'tug', 'two',
	'urn', 'use', 'van', 'vat', 'vex', 'vet', 'vow',
	'wag', 'war', 'was', 'wax', 'way', 'web', 'wed', 'wee', 'wet', 'who', 'why', 'wig', 'win', 'wit', 'won', 'woo', 'wow', 'wry',
	'yak', 'yam', 'yap', 'yaw', 'yep', 'yes', 'yet', 'you',
	'zap', 'zig', 'zip', 'zoo',
	// 4-letter words
	'able', 'ache', 'acid', 'acre', 'aged', 'aids', 'aims', 'airs', 'alas', 'ally', 'also', 'area', 'arms', 'army', 'arts', 'atom', 'auto', 'away', 'axis',
	'back', 'bade', 'bail', 'bait', 'bake', 'bald', 'ball', 'band', 'bank', 'bare', 'bark', 'barn', 'base', 'bash', 'bass', 'bath', 'bats', 'bays', 'bead', 'beak', 'beam', 'bean', 'bear', 'beat', 'beer', 'bees', 'bell', 'belt', 'bend', 'bent', 'best', 'bias', 'bids', 'bike', 'bile', 'bill', 'bind', 'bird', 'bite', 'bits', 'blow', 'blue', 'blur', 'boar', 'boat', 'body', 'boil', 'bold', 'bolt', 'bomb', 'bond', 'bone', 'book', 'boom', 'boot', 'bore', 'born', 'boss', 'both', 'bout', 'bowl', 'boys', 'brad', 'brag', 'bran', 'bras', 'brat', 'bred', 'brew', 'brim', 'brow', 'buck', 'buds', 'buff', 'bulb', 'bulk', 'bull', 'bump', 'bums', 'bunk', 'buns', 'bunt', 'burn', 'burp', 'bury', 'bush', 'bust', 'busy', 'butt', 'buys', 'buzz', 'byte',
	'cafe', 'cage', 'cake', 'calf', 'call', 'calm', 'came', 'camp', 'cane', 'cans', 'cant', 'cape', 'caps', 'card', 'care', 'carp', 'cars', 'cart', 'case', 'cash', 'cask', 'cast', 'cats', 'cave', 'cell', 'cent', 'chap', 'char', 'chat', 'chef', 'chew', 'chin', 'chip', 'chop', 'chow', 'chug', 'chum', 'cite', 'city', 'clad', 'clam', 'clan', 'clap', 'claw', 'clay', 'clef', 'clip', 'clod', 'clog', 'clop', 'clot', 'club', 'clue', 'coal', 'coat', 'coax', 'cobs', 'cock', 'code', 'coed', 'coif', 'coil', 'coin', 'coke', 'cold', 'cols', 'colt', 'coma', 'comb', 'come', 'cone', 'cons', 'cook', 'cool', 'coop', 'cope', 'cops', 'copy', 'cord', 'core', 'cork', 'corn', 'cosy', 'cost', 'cosy', 'cots', 'cove', 'cowl', 'cows', 'cozy', 'crab', 'crag', 'cram', 'crap', 'crew', 'crib', 'crop', 'crow', 'crud', 'crux', 'cube', 'cubs', 'cuds', 'cued', 'cues', 'cuff', 'cull', 'cult', 'cups', 'curb', 'curd', 'cure', 'curl', 'curs', 'curt', 'cusp', 'cuss', 'cute', 'cuts', 'cyan',
	'dabs', 'dads', 'daff', 'daft', 'dais', 'dale', 'dame', 'damp', 'dams', 'dane', 'dank', 'dare', 'dark', 'darn', 'dart', 'dash', 'data', 'date', 'daub', 'davy', 'dawn', 'days', 'daze', 'dead', 'deaf', 'deal', 'dean', 'dear', 'debt', 'deck', 'deed', 'deem', 'deep', 'deer', 'deft', 'defy', 'deja', 'dele', 'deli', 'dell', 'demo', 'dens', 'dent', 'deny', 'desk', 'dews', 'dewy', 'dhow', 'diad', 'dial', 'diam', 'dibs', 'dice', 'dick', 'died', 'diem', 'dies', 'diet', 'digs', 'dike', 'dill', 'dime', 'dims', 'dine', 'ding', 'dink', 'dins', 'dint', 'dips', 'dire', 'dirk', 'dirt', 'disc', 'dish', 'disk', 'diss', 'dive', 'djin', 'dock', 'docs', 'dodo', 'doer', 'does', 'doff', 'dogs', 'dogy', 'dojo', 'dole', 'doll', 'dolt', 'dome', 'done', 'dong', 'dons', 'doom', 'door', 'dope', 'dopy', 'dorm', 'dorp', 'dors', 'dory', 'dose', 'doss', 'dost', 'dote', 'doth', 'dots', 'doty', 'dour', 'dove', 'down', 'dows', 'doxy', 'doze', 'dozy', 'drab', 'drag', 'dram', 'drat', 'draw', 'dray', 'dree', 'dreg', 'drek', 'drew', 'drib', 'drip', 'drop', 'drub', 'drug', 'drum', 'dual', 'dubs', 'duck', 'duct', 'dude', 'duds', 'duel', 'dues', 'duet', 'duff', 'dugs', 'duke', 'dull', 'duly', 'dumb', 'dump', 'dune', 'dung', 'dunk', 'duns', 'duos', 'dupe', 'dusk', 'dust', 'duty', 'dyad', 'dyed', 'dyer', 'dyes', 'dyke', 'dyne',
	'each', 'earl', 'earn', 'ears', 'ease', 'east', 'easy', 'eats', 'eave', 'ebbs', 'ebon', 'echo', 'ecru', 'eddy', 'edge', 'edgy', 'edit', 'eels', 'eery', 'effs', 'egad', 'eggs', 'egis', 'egos', 'eire', 'eked', 'ekes', 'elan', 'elds', 'elhi', 'elks', 'ells', 'elms', 'else', 'emes', 'emfs', 'emir', 'emit', 'emmy', 'emus', 'ends', 'enow', 'envy', 'eons', 'epic', 'epos', 'eras', 'ergo', 'ergs', 'eris', 'erne', 'erns', 'eros', 'errs', 'erst', 'eses', 'espy', 'etas', 'etui', 'euro', 'even', 'ever', 'eves', 'evil', 'ewer', 'ewes', 'exam', 'exec', 'exes', 'exit', 'expo', 'eyas', 'eyed', 'eyer', 'eyes', 'eyne', 'eyra', 'eyre', 'eyry',
	'fabs', 'face', 'fact', 'fade', 'fads', 'fags', 'fail', 'fain', 'fair', 'fake', 'fall', 'fame', 'fang', 'fans', 'fard', 'fare', 'farl', 'farm', 'faro', 'fart', 'fash', 'fast', 'fate', 'fats', 'faun', 'faut', 'faux', 'fava', 'fave', 'fawn', 'fays', 'faze', 'feal', 'fear', 'feat', 'feck', 'feds', 'feed', 'feel', 'fees', 'feet', 'fehs', 'fell', 'felt', 'feme', 'fems', 'fend', 'fens', 'feod', 'fere', 'fern', 'fess', 'feta', 'fete', 'fets', 'feud', 'feus', 'fiar', 'fiat', 'fibs', 'fice', 'fico', 'fido', 'fids', 'fief', 'fife', 'figs', 'fila', 'file', 'fill', 'film', 'fils', 'find', 'fine', 'fink', 'fins', 'fire', 'firm', 'firn', 'firs', 'fisc', 'fish', 'fist', 'fits', 'five', 'fixt', 'fizz', 'flab', 'flag', 'flak', 'flam', 'flan', 'flap', 'flat', 'flaw', 'flax', 'flay', 'flea', 'fled', 'flee', 'flew', 'flex', 'fley', 'flic', 'flip', 'flir', 'flit', 'floc', 'floe', 'flog', 'flop', 'flor', 'flow', 'flub', 'flue', 'flug', 'flus', 'flux', 'foal', 'foam', 'fobs', 'foci', 'foes', 'fogs', 'fogy', 'fohn', 'foil', 'foin', 'fold', 'folk', 'fond', 'fons', 'font', 'food', 'fool', 'foot', 'fops', 'fora', 'forb', 'ford', 'fore', 'fork', 'form', 'fort', 'foss', 'foul', 'four', 'fowl', 'foxy', 'foys', 'fozy', 'frab', 'frae', 'frag', 'frap', 'frat', 'fray', 'free', 'fret', 'frig', 'frit', 'friz', 'froe', 'frog', 'from', 'frow', 'frug', 'fubs', 'fuci', 'fuds', 'fuel', 'fugs', 'fugu', 'fuji', 'full', 'fume', 'fumy', 'fund', 'funk', 'funs', 'furl', 'furs', 'fury', 'fuse', 'fuss', 'fuze', 'fuzz',
	// Add more as needed...
]

const missingWords = commonWords.filter(word => !DICTIONARY.includes(word))

console.log(`\nDictionary Check Results:`)
console.log(`Total words in dictionary: ${DICTIONARY.length}`)
console.log(`Common words checked: ${commonWords.length}`)
console.log(`Missing words: ${missingWords.length}\n`)

if (missingWords.length > 0) {
	console.log('Missing words:')
	console.log(missingWords.join(', '))
	console.log(`\nTo add these, update src/utils/dictionary.ts`)
} else {
	console.log('All common words are present!')
}

