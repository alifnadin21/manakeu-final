'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
    return (
        <main className="standalone">
            <div className="card empty">
                <h1>Something went wrong</h1>
                <p>Please try loading the page again.</p>
                <button className="button primary" onClick={reset}>
                    Try again
                </button>
            </div>
        </main>
    );
}
