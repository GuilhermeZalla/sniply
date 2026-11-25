import {test} from 'node:test';import assert from 'node:assert/strict';import {initials,pageQuery,editorPayload} from './library.ts';
test('names and blank fallback',()=>{assert.equal(initials('  Ada Lovelace '),'AL');assert.equal(initials(''),'S')});
test('filters reset pagination without mutating URL',()=>{const p=new URLSearchParams('page=3&sort=title');const n=pageQuery(p,'search','fetch');assert.equal(n.get('page'),null);assert.equal(p.get('page'),'3');assert.equal(n.get('sort'),'title')});
test('editor validates empty code and deduplicates memberships',()=>{assert.throws(()=>editorPayload('t','',' ','typescript','',[]));const x=editorPayload(' t ','','const x=1','typescript','',['a','a']);assert.equal(x.title,'t');assert.equal(x.categoryId,null);assert.deepEqual(x.groupIds,['a'])});
