import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stellar Sleep Dashboard',
  description: 'Patient dashboard for Stellar Sleep',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased">
        <div className="flex h-full">
          <div className="flex-1 flex flex-col">
            <main className="flex-1 overflow-auto bg-white">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
