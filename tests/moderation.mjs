import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {containsProfanity,moderationError,LANGUAGE_NOTICE} from '../moderation.js';
const cases=JSON.parse(await readFile(new URL('moderation-cases.json',import.meta.url),'utf8'));
for(const [text,blocked] of cases){assert.equal(containsProfanity(text),blocked,JSON.stringify(text));assert.equal(containsProfanity(text.normalize('NFD')),blocked,'NFD '+text);}
assert.equal(moderationError({message:'KOV_PROFANITY: blocked'}),LANGUAGE_NOTICE);assert.equal(moderationError({message:'network'}),null);
console.log(`PASS: ${cases.length} profanity/obfuscation and benign Korean cases, NFD normalization and safe server messages`);
