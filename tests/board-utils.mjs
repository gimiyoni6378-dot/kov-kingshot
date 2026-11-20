import assert from 'node:assert/strict';
import {pageGroup,literalSearch,POSTS_PER_PAGE,SEARCH_FIELDS} from '../board-utils.js';
assert.equal(POSTS_PER_PAGE,10);assert.deepEqual(Object.keys(SEARCH_FIELDS),['title','body','nickname']);
assert.deepEqual(pageGroup(0,25),{current:0,pages:[0,1,2,3,4,5,6,7,8,9],previous:null,next:10});
assert.deepEqual(pageGroup(10,25),{current:10,pages:[10,11,12,13,14,15,16,17,18,19],previous:9,next:20});
assert.deepEqual(pageGroup(24,25),{current:24,pages:[20,21,22,23,24],previous:19,next:null});assert.equal(pageGroup(999,3).current,2);
assert.equal(literalSearch('  100%_\\  '),'100\\%\\_\\\\');assert.equal(literalSearch('a'.repeat(200)).length,100);
console.log('PASS: ten-post pages, ten-number groups, previous/next blocks, clamping and literal wildcard escaping');
