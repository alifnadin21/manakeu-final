'use client';
import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback
} from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, User } from '@/lib/api';
import { ErrorState, Loading } from './ui';
const Session = createContext<{ user: User; refresh: () => void }>({
    user: null as unknown as User,
    refresh: () => {}
});
export const useSession = () => useContext(Session);
export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>();
    const [error, setError] = useState('');
    const router = useRouter();
    const refresh = useCallback(() => {
        setError('');
        api<{ user: User }>('/api/session')
            .then((r) => setUser(r.user))
            .catch((e) => {
                if (e instanceof ApiError && e.status === 401)
                    router.replace('/login');
                else setError(e.message);
            });
    }, [router]);
    useEffect(() => {
        refresh();
        const expired = () => {
            setUser(undefined);
            router.replace('/login');
        };
        window.addEventListener('session-expired', expired);
        return () => window.removeEventListener('session-expired', expired);
    }, [refresh, router]);
    if (error)
        return (
            <main className="standalone">
                <ErrorState message={error} retry={refresh} />
            </main>
        );
    if (!user)
        return (
            <main className="standalone">
                <Loading />
            </main>
        );
    return (
        <Session.Provider value={{ user, refresh }}>
            {children}
        </Session.Provider>
    );
}
