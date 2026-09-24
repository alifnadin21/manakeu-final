import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
    title: 'Manakeu ? Financial workspace',
    description:
        'Your projects, transactions, and financial decisions in one place.'
};
export default function RootLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
