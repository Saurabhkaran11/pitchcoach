import './globals.css';

export const metadata = {
  metadataBase: new URL('https://pitchcoach-five.vercel.app'),
  title: { default: 'Repo to Pitch in 30s — PitchCoach Decks', template: '%s · PitchCoach Decks' },
  description: 'Paste a GitHub repo. Get slides, a demo script and a pitch tuned for your hackathon, VC meeting, launch or college demo.',
  openGraph: { title: 'Repo to Pitch in 30s', description: 'Paste a GitHub repo. Get slides, a demo script and a pitch.', type: 'website' },
};
export const viewport = { themeColor: '#0a0a0f', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* apply saved light/dark before paint to avoid a flash */}
        <script dangerouslySetInnerHTML={{ __html: "try{if(JSON.parse(localStorage.getItem('deck-store')||'{}').state?.mode==='light')document.documentElement.classList.add('light')}catch(e){}" }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
