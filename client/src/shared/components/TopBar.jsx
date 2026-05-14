import { useAuth } from '../context/useAuth';

export default function TopBar({ session, liveCount }) {
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
            {/* Tricolor bar */}
            <div className="h-1 flex w-full">
                <div className="flex-1 bg-saffron" />
                <div className="flex-1 bg-white border-y border-gray-200" />
                <div className="flex-1 bg-india-green" />
            </div>
            <div className="px-4 lg:px-8 py-3 flex items-center justify-between max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-saffron via-accent to-india-green flex items-center justify-center shadow-md">
                        <span className="material-symbols-outlined text-white text-2xl">gavel</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-extrabold tracking-tight text-neutral-dark leading-none">Summit</h1>
                        <p className="text-xs font-medium text-gray-500 mt-0.5 uppercase tracking-wide">
                            {user?.role === 'moderator' ? 'Moderator Panel' : 'Lok Sabha Simulator'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {user?.role !== 'moderator' && (
                        <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-50 transition-colors text-neutral-dark">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                    )}
                    <button
                        onClick={logout}
                        className="h-9 w-9 rounded-full bg-neutral-dark/5 hover:bg-red-50 flex items-center justify-center text-neutral-dark hover:text-red-600 transition-colors"
                        title="Logout"
                    >
                        <span className="material-symbols-outlined text-xl">logout</span>
                    </button>
                </div>
            </div>
            {/* Session live banner */}
            {session && (
                <div className="px-4 lg:px-8 py-1.5 bg-gradient-to-r from-saffron/10 via-white to-india-green/10 border-y border-gray-100 flex items-center justify-between text-xs font-bold text-neutral-dark max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-saffron" />
                        </span>
                        <span className="uppercase tracking-wider">Live: {session.title}</span>
                    </div>
                    {liveCount !== undefined && (
                        <span className="bg-white/80 px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                            Active: {liveCount}
                        </span>
                    )}
                </div>
            )}
        </header>
    );
}
