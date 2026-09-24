import Link from 'next/link';
export default function NotFound() {
    return (
        <main className="standalone">
            <div className="card empty">
                <h1>Page not found</h1>
                <p>This page is no longer available.</p>
                <Link className="button primary" href="/dashboard">
                    Back to dashboard
                </Link>
            </div>
        </main>
    );
}
