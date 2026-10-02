import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppFrame } from '@/components/AppFrame';
import { AuthGate } from '@/components/AuthGate';
import { AuthProvider } from '@/lib/auth';
import { SESSION_TOKEN_VERSION, STORAGE_KEY } from '@/lib/authConfig';
import { DemoProvider } from '@/lib/store';
import { ThemeProvider } from '@/lib/theme';
import { ToastProvider } from '@/lib/toast';

export const metadata: Metadata = {
  title: 'ElixiHire — restricted demo',
  description: 'A private interactive demo by Essentient. Access is restricted.',
  // A privately shared demo should not be indexed even though it is gated.
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Runs before first paint. The static HTML of every route ships the login screen, so
  // that an unauthorised visitor sees the restricted notice even before hydration; this
  // marks the document when a session already exists, letting CSS hide that screen
  // immediately rather than flashing it at someone who is signed in.
  const accessProbe = `try{if(sessionStorage.getItem(${JSON.stringify(
    STORAGE_KEY,
  )})===${JSON.stringify(
    SESSION_TOKEN_VERSION,
  )})document.documentElement.dataset.access='granted'}catch(e){}`;

  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: accessProbe }} />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <AuthGate>
              <ToastProvider>
                <DemoProvider>
                  <AppFrame>{children}</AppFrame>
                </DemoProvider>
              </ToastProvider>
            </AuthGate>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
