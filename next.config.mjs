import { fileURLToPath } from 'node:url';
import path from 'node:path';

export default {
  outputFileTracingRoot: path.dirname(fileURLToPath(import.meta.url)), // a parent folder also has a lockfile; pin the root here
  // PitchCoach (static, in /public) stays the home page so the submitted link keeps working; the deck product lives under /deck.
  async rewrites() { return { beforeFiles: [{ source: '/', destination: '/index.html' }, { source: '/privacy', destination: '/privacy.html' }] }; },
};
