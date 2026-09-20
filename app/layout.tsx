import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppFrame } from '@/components/AppFrame';
import { DemoProvider } from '@/lib/store';
import { ThemeProvider } from '@/lib/theme';
import { ToastProvider } from '@/lib/toast';

export const metadata: Metadata = {
  title: 'ElixiHire — interactive demo',
  description:
    'A front-end-only interactive demo of ElixiHire, a healthcare recruitment platform. Illustrative only — no live data.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ToastProvider>
            <DemoProvider>
              <AppFrame>{children}</AppFrame>
            </DemoProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
