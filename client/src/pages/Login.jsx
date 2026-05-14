import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/useAuth';

export default function Login() {
    const { login, loading, error } = useAuth();
    const navigate = useNavigate();
    const [memberId, setMemberId] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const user = await login(memberId, password);
            // DASHMOD goes to display dashboard (queue & timer only)
            if (user.member_id === 'DASHMOD') {
                navigate('/display');
            } else {
                navigate(user.role === 'moderator' ? '/moderator' : '/member');
            }
        } catch (e) {
            console.error('Login failed:', e);
        }
    }

    return (
        <div className="bg-white font-display min-h-screen flex items-center justify-center overflow-hidden relative">
            {/* Background image with overlay */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-white/80" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_white_100%)] opacity-40" />
                {/* Subtle dot pattern */}
                <div className="absolute inset-0 bg-pattern opacity-30" />
            </div>

            <main className="relative z-10 w-full max-w-[400px] px-6 py-12 flex flex-col items-center justify-center min-h-screen">
                <div className="w-full bg-white rounded-xl shadow-2xl p-8 relative overflow-hidden">
                    {/* Watermark */}
                    <div className="absolute bottom-4 right-4 opacity-[0.05] pointer-events-none select-none">
                        <span className="material-symbols-outlined text-[8rem] text-neutral-dark">account_balance</span>
                    </div>

                    <div className="relative z-10">
                        <header className="text-center mb-8">
                            {/* Gavel icon */}
                            <div className="flex justify-center mb-4">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-saffron via-accent to-india-green flex items-center justify-center shadow-xl">
                                    <span className="material-symbols-outlined text-white text-3xl">gavel</span>
                                </div>
                            </div>
                            <h1 className="text-2xl font-black text-neutral-dark tracking-tight">Summit</h1>
                            <h3 className="text-india-green font-bold text-sm tracking-widest uppercase mt-1">Parliamentary Login</h3>
                            {/* Tricolor divider */}
                            <div className="flex items-center justify-center gap-3 mt-4">
                                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-saffron" />
                                <span className="material-symbols-outlined text-ashoka-blue text-2xl animate-spin-slow">brightness_7</span>
                                <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-india-green" />
                            </div>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                                    Member ID
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-saffron text-lg">badge</span>
                                    <input
                                        type="text"
                                        value={memberId}
                                        onChange={e => setMemberId(e.target.value)}
                                        placeholder="e.g. BJP12345"
                                        autoCapitalize="characters"
                                        required
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron transition-colors text-neutral-dark placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
                                    Party Password
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-india-green text-lg">lock</span>
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Your party name"
                                        required
                                        className="w-full pl-10 pr-12 py-3 bg-gray-50 border-2 border-gray-100 rounded-lg focus:outline-none focus:border-india-green focus:ring-1 focus:ring-india-green transition-colors text-neutral-dark placeholder:text-gray-300"
                                    />
                                    <button type="button" onClick={() => setShowPass(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-saffron">
                                        <span className="material-symbols-outlined text-lg">{showPass ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                                    <span className="material-symbols-outlined text-alert-red text-lg">error</span>
                                    <p className="text-sm text-alert-red font-medium">{error}</p>
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn-wavy-tricolor rounded-lg px-6 py-3.5 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saffron active:scale-[0.98] disabled:opacity-70"
                                >
                                    <span className="text-white font-bold tracking-widest uppercase text-sm drop-shadow-md">
                                        {loading ? 'Entering...' : 'Enter Session'}
                                    </span>
                                    <span className="material-symbols-outlined text-white text-lg drop-shadow-md">
                                        {loading ? 'hourglass_top' : 'login'}
                                    </span>
                                </button>
                            </div>
                        </form>

                        <footer className="mt-8 text-center">
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-saffron" />
                                Model Lok Sabha 2026
                                <span className="w-1.5 h-1.5 rounded-full bg-india-green" />
                            </p>
                        </footer>
                    </div>
                </div>
            </main>
        </div>
    );
}
