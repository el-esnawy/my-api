import type { Metadata } from 'next';
import { QueryProvider } from '@/providers/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'my-api — Custom REST Endpoints',
  description:
    'Define your own data schemas, generate REST endpoints, and query them from anywhere with per-account access tokens.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className='min-h-screen antialiased'>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
