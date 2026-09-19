// GitHub helpers shared by the client (validation) and the analyze route (fetching + stack detection).
export const MAX_FILES = 5000;

/** "https://github.com/owner/repo(.git)(/...)" | "github.com/owner/repo" | "owner/repo" → {owner, repo} or null. */
export function parseRepoUrl(input) {
  const s = String(input || '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  const m = s.match(/^(?:github\.com\/)?([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9._-]{1,100}?)(?:\.git)?(?:[/#?].*)?$/);
  if (!m || (s.includes('.') && !/^github\.com\//i.test(s) && s.split('/').length > 2)) return null;
  if (/^[^/]+\.[a-z]{2,}\//i.test(s) && !/^github\.com\//i.test(s)) return null; // some other host
  return m[2] === '.' || m[2] === '..' ? null : { owner: m[1], repo: m[2] };
}

const MANIFESTS = ['package.json', 'requirements.txt', 'pyproject.toml', 'go.mod', 'Cargo.toml', 'pom.xml', 'build.gradle', 'Gemfile', 'composer.json', 'Dockerfile', 'docker-compose.yml', 'vercel.json', 'pubspec.yaml'];
export const isManifest = p => MANIFESTS.includes(p.split('/').pop()) && p.split('/').length <= 2;

// dependency / file hints → human label. Order matters only for display.
const HINTS = [
  [/"next"\s*:/, 'Next.js'], [/"react"\s*:/, 'React'], [/"vue"\s*:/, 'Vue'], [/"svelte"\s*:/, 'Svelte'], [/"@angular\/core"/, 'Angular'],
  [/"express"\s*:/, 'Express'], [/"fastify"\s*:/, 'Fastify'], [/"tailwindcss"\s*:/, 'Tailwind CSS'], [/"prisma"|"@prisma\/client"/, 'Prisma'],
  [/"mongoose"|pymongo/, 'MongoDB'], [/"pg"\s*:|psycopg|postgres/i, 'PostgreSQL'], [/"redis"|redis-py|ioredis/, 'Redis'],
  [/fastapi/i, 'FastAPI'], [/django/i, 'Django'], [/flask/i, 'Flask'], [/torch|pytorch/i, 'PyTorch'], [/tensorflow/i, 'TensorFlow'],
  [/langchain/i, 'LangChain'], [/openai/i, 'OpenAI API'], [/anthropic/i, 'Claude API'], [/google-generativeai|@google\/genai/i, 'Gemini API'],
  [/"electron"\s*:/, 'Electron'], [/"react-native"\s*:/, 'React Native'], [/flutter/i, 'Flutter'], [/gin-gonic/, 'Gin'], [/actix|axum|tokio/, 'Rust async'],
  [/supabase/i, 'Supabase'], [/firebase/i, 'Firebase'], [/stripe/i, 'Stripe'],
];

/** languages: {TypeScript: bytes,…}; manifests: {path: text}; paths: string[] → {languages:[{name,pct}], frameworks:[], infra:[]} */
export function detectStack(languages = {}, manifests = {}, paths = []) {
  const total = Object.values(languages).reduce((a, b) => a + b, 0) || 1;
  const langs = Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, n]) => ({ name, pct: Math.round(n / total * 100) }));
  const blob = Object.values(manifests).join('\n');
  const frameworks = [...new Set(HINTS.filter(([re]) => re.test(blob)).map(([, label]) => label))];
  const has = re => paths.some(p => re.test(p));
  const infra = [has(/(^|\/)Dockerfile$/) && 'Docker', has(/^\.github\/workflows\//) && 'GitHub Actions', has(/(^|\/)vercel\.json$/) && 'Vercel',
    has(/\.tf$/) && 'Terraform', has(/(^|\/)k8s\/|\.ya?ml$/) && has(/kind:\s*Deployment/) && 'Kubernetes', has(/(^|\/)(tests?|__tests__)\//) && 'Tests'].filter(Boolean);
  return { languages: langs, frameworks, infra };
}
