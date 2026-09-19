// Run: node lib/github.test.mjs
import assert from 'node:assert/strict';
import { parseRepoUrl, detectStack, isManifest } from './github.js';

const ok = (s, owner, repo) => assert.deepEqual(parseRepoUrl(s), { owner, repo }, s);
ok('https://github.com/vercel/next.js', 'vercel', 'next.js');
ok('github.com/Saurabhkaran11/pitchcoach', 'Saurabhkaran11', 'pitchcoach');
ok('https://github.com/a/b.git', 'a', 'b');
ok('https://www.github.com/a/b/tree/main/src?x=1', 'a', 'b');
ok('owner/repo', 'owner', 'repo');
for (const bad of ['', 'github.com/onlyowner', 'https://gitlab.com/a/b', 'https://github.com/', 'not a url', 'https://github.com/-bad/x', 'github.com/a/..'])
  assert.equal(parseRepoUrl(bad), null, 'should reject: ' + bad);

const s = detectStack({ TypeScript: 900, CSS: 100 }, { 'package.json': '{"dependencies":{"next":"15","react":"19","stripe":"1"}}' }, ['Dockerfile', '.github/workflows/ci.yml', 'src/a.ts']);
assert.deepEqual(s.languages[0], { name: 'TypeScript', pct: 90 });
assert.ok(s.frameworks.includes('Next.js') && s.frameworks.includes('React') && s.frameworks.includes('Stripe'));
assert.ok(s.infra.includes('Docker') && s.infra.includes('GitHub Actions'));
assert.ok(isManifest('package.json') && isManifest('api/package.json') && !isManifest('a/b/c/package.json') && !isManifest('src/index.js'));
console.log('github.test: all passed');
