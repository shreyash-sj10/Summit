import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/context/useAuth';

// ── Ashoka Chakra SVG ────────────────────────────────────────────────────────
function Chakra({ size = 100 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="128" cy="128" r="120" stroke="#000080" strokeWidth="5" />
            <circle cx="128" cy="128" r="20" fill="#000080" />
            <g stroke="#000080" strokeWidth="2.5">
                {[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345].map(deg => (
                    <line key={deg} x1="128" y1="20" x2="128" y2="236"
                        transform={`rotate(${deg} 128 128)`} />
                ))}
            </g>
        </svg>
    );
}

// ── Login form (shared between mobile & desktop) ─────────────────────────────
function LoginForm({ compact = false }) {
    const { login, loading, error } = useAuth();
    const navigate = useNavigate();
    const [memberId, setMemberId] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const user = await login(memberId, password);
            navigate(user.role === 'moderator' || user.role === 'judge' ? '/moderator' : '/member');
        } catch (e) {
            console.error('Login failed:', e);
        }
    }

    return (
        <form onSubmit={handleSubmit} className={`space-y-5 ${compact ? '' : 'w-full'}`}>
            {/* Member ID */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ashoka-blue mb-2">
                    Member ID
                </label>
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-india-green text-xl group-focus-within:text-saffron transition-colors">
                        person
                    </span>
                    <input
                        type="text"
                        value={memberId}
                        onChange={e => setMemberId(e.target.value)}
                        placeholder="e.g. BJP12345"
                        autoCapitalize="characters"
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-saffron outline-none transition-all placeholder:text-gray-400 text-sm"
                    />
                </div>
            </div>

            {/* Password */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-ashoka-blue mb-2">
                    Party Password
                </label>
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-india-green text-xl group-focus-within:text-saffron transition-colors">
                        lock
                    </span>
                    <input
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Your party name"
                        required
                        className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-saffron focus:border-saffron outline-none transition-all placeholder:text-gray-400 text-sm"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-saffron">
                        <span className="material-symbols-outlined text-lg">{showPass ? 'visibility_off' : 'visibility'}</span>
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    <span className="material-symbols-outlined text-alert-red text-lg">error</span>
                    <p className="text-sm text-alert-red font-medium">{error}</p>
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={loading}
                className="w-full btn-wavy-tricolor text-white font-extrabold py-4 rounded-xl shadow-lg uppercase tracking-[0.2em] text-sm mt-2 hover:shadow-xl disabled:opacity-70 transition-all active:scale-[0.98]"
            >
                {loading ? 'Entering...' : 'Enter Session'}
            </button>
        </form>
    );
}

// ── Main Landing Page ────────────────────────────────────────────────────────
export default function Landing() {
    const loginRef = useRef(null);

    return (
        <>
            {/* ══ DESKTOP (lg+): split 16:9 canvas ══════════════════════════*/}
            <div className="hidden lg:flex items-center justify-center min-h-screen bg-gray-100">
                {/* 16:9 container */}
                <div className="relative w-full bg-background-light shadow-2xl overflow-hidden"
                    style={{ maxWidth: '177.78vh', aspectRatio: '16/9', maxHeight: '100vh' }}>

                    {/* Corner accents */}
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(circle at top left, rgba(255,153,51,0.15) 0%, transparent 70%)' }} />
                    <div className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(circle at bottom right, rgba(19,136,8,0.15) 0%, transparent 70%)' }} />

                    <div className="flex h-full w-full">
                        {/* Left — hero panel */}
                        <div className="relative w-3/5 xl:w-2/3 h-full flex flex-col items-center border-r border-gray-100 overflow-hidden">
                            {/* Background image */}
                            <div className="absolute inset-0 bg-cover bg-center scale-105 blur-sm"
                                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCqM4RGLjA2PhrKe9_Ei1E5_3yJ0NlgCD06lgOfDtIJMKRmmo43KNrIRDwYa9puHtbEDVLw380ctXMTOe4kYs7eNr49vqC8PQtcvWv1twzSLowvQOIpL6HFHjgGCtrC7ANTAAvikv91v0tLi3rJ_AfAG9akidWZdedYBCYE84w5Hv0QM-pXP8vrDdzfeBuqSCviEIm7XLwOGSoEgEBjGNzDWwaO1gED8XkEul6iFj2w9e_a1VwQHvpbvviSbkyC2Pnov6DeipUYaog')" }} />
                            {/* Tricolor overlay */}
                            <div className="absolute inset-0"
                                style={{ background: 'linear-gradient(to bottom, rgba(255,153,51,0.25) 0%, rgba(255,255,255,0.85) 50%, rgba(19,136,8,0.25) 100%)', mixBlendMode: 'overlay' }} />
                            <div className="absolute inset-0 bg-white/40" />

                            {/* Center content */}
                            <div className="relative z-10 flex flex-col items-center justify-center h-full pb-40 text-center space-y-8 px-12">
                                <div className="animate-spin-slow">
                                    <Chakra size={100} />
                                </div>
                                <div className="space-y-4">
                                    <p className="text-sm font-extrabold tracking-[0.5em] text-ashoka-blue uppercase">
                                        Enactus SPIT Presents
                                    </p>
                                    <h1 style={{ fontFamily: "'Crimson Text', serif" }}
                                        className="text-6xl xl:text-7xl font-bold text-ashoka-blue drop-shadow-md leading-none">
                                        Summit 2026
                                    </h1>
                                    <p style={{ fontFamily: "'Crimson Text', serif" }}
                                        className="italic text-2xl text-india-green mt-6 leading-snug">
                                        "Where Young Minds Debate the Nation's Future"
                                    </p>
                                </div>
                            </div>

                            {/* Stats bar */}
                            <div className="absolute bottom-12 left-0 right-0 z-10 px-12">
                                <div className="max-w-xl mx-auto grid grid-cols-3 gap-6">
                                    {[
                                        { val: '200+', label: 'Participants', color: 'border-saffron' },
                                        { val: '50+', label: 'Debates', color: 'border-white' },
                                        { val: '1', label: 'Vision', color: 'border-india-green' },
                                    ].map(({ val, label, color }) => (
                                        <div key={label}
                                            className={`bg-white/80 backdrop-blur-md rounded-2xl p-4 border-t-4 ${color} text-center shadow-lg hover:scale-105 transition-transform`}>
                                            <div className="text-2xl font-black text-ashoka-blue">{val}</div>
                                            <div className="text-[10px] uppercase font-bold tracking-widest text-gray-600">{label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right — login panel */}
                        <div className="w-2/5 xl:w-1/3 bg-white/90 backdrop-blur-sm h-full flex flex-col p-8 md:p-12 xl:p-16 justify-center overflow-y-auto">
                            <div className="max-w-sm mx-auto w-full">
                                {/* Header */}
                                <div className="mb-8">
                                    <h2 className="text-2xl font-extrabold tracking-tight text-ashoka-blue mb-2 uppercase">
                                        Parliamentary Login
                                    </h2>
                                    <p className="text-india-green text-sm font-medium">Welcome back, Honorable Member.</p>
                                    {/* Divider */}
                                    <div className="flex items-center gap-4 mt-6">
                                        <div className="h-1 bg-saffron flex-1 rounded-full opacity-60" />
                                        <div className="animate-spin-slow"><Chakra size={24} /></div>
                                        <div className="h-1 bg-india-green flex-1 rounded-full opacity-60" />
                                    </div>
                                </div>

                                <LoginForm />

                                <div className="mt-8 text-center text-xs text-gray-400">
                                    <p>© 2026 ENACTUS SPIT. All Rights Reserved.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ MOBILE (< lg): portrait full-screen ══════════════════════*/}
            <div className="lg:hidden relative w-full min-h-screen flex flex-col overflow-hidden bg-background-light">
                {/* Background */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-cover bg-center scale-110 blur-sm"
                        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCqM4RGLjA2PhrKe9_Ei1E5_3yJ0NlgCD06lgOfDtIJMKRmmo43KNrIRDwYa9puHtbEDVLw380ctXMTOe4kYs7eNr49vqC8PQtcvWv1twzSLowvQOIpL6HFHjgGCtrC7ANTAAvikv91v0tLi3rJ_AfAG9akidWZdedYBCYE84w5Hv0QM-pXP8vrDdzfeBuqSCviEIm7XLwOGSoEgEBjGNzDWwaO1gED8XkEul6iFj2w9e_a1VwQHvpbvviSbkyC2Pnov6DeipUYaog')" }} />
                    <div className="absolute inset-0"
                        style={{ background: 'linear-gradient(to bottom, rgba(255,153,51,0.2) 0%, rgba(255,255,255,0.8) 50%, rgba(19,136,8,0.2) 100%)', mixBlendMode: 'overlay' }} />
                    <div className="absolute inset-0 bg-white/40" />
                </div>

                {/* Hero section */}
                <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center py-16">
                    <div className="animate-spin-slow mb-6">
                        <Chakra size={80} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold tracking-[0.4em] text-ashoka-blue uppercase">
                            Enactus SPIT Presents
                        </p>
                        <h1 style={{ fontFamily: "'Crimson Text', serif" }}
                            className="text-5xl font-bold text-ashoka-blue drop-shadow-sm leading-tight">
                            Summit 2026
                        </h1>
                        <p style={{ fontFamily: "'Crimson Text', serif" }}
                            className="italic text-lg text-india-green mt-4 max-w-xs mx-auto leading-snug">
                            Where Young Minds Debate the Nation's Future
                        </p>
                    </div>

                    <div className="mt-10">
                        <button
                            onClick={() => loginRef.current?.scrollIntoView({ behavior: 'smooth' })}
                            className="btn-wavy-tricolor text-white font-bold py-4 px-10 rounded-full shadow-xl transition-all flex items-center gap-3 text-sm tracking-[0.1em]"
                            style={{ animation: 'pulse 2s infinite, wave-gradient 3s linear infinite' }}
                        >
                            <span>ENTER PARLIAMENT</span>
                            <span className="material-symbols-outlined">gavel</span>
                        </button>
                    </div>
                </main>

                {/* Stats */}
                <section className="relative z-10 w-full px-4 pb-6">
                    <div className="max-w-md mx-auto grid grid-cols-3 gap-3">
                        {[
                            { val: '200+', label: 'Participants' },
                            { val: '50+', label: 'Debates' },
                            { val: '1', label: 'Vision' },
                        ].map(({ val, label }) => (
                            <div key={label} className="bg-white/40 backdrop-blur-md rounded-xl p-4 border border-white/30 flex flex-col items-center text-center">
                                <span className="text-xl font-extrabold text-saffron">{val}</span>
                                <span className="text-[10px] uppercase font-bold text-gray-600">{label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Inline login section (scrolled to on mobile) */}
                <section ref={loginRef} className="relative z-10 bg-white/95 backdrop-blur-md px-6 py-10 border-t border-gray-100">
                    <div className="max-w-sm mx-auto">
                        <div className="text-center mb-8">
                            <h2 className="text-xl font-extrabold tracking-tight text-ashoka-blue uppercase mb-1">
                                Parliamentary Login
                            </h2>
                            <p className="text-india-green text-xs font-medium">Welcome back, Honorable Member.</p>
                            <div className="flex items-center justify-center gap-3 mt-4">
                                <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-saffron rounded" />
                                <div className="animate-spin-slow"><Chakra size={20} /></div>
                                <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-india-green rounded" />
                            </div>
                        </div>
                        <LoginForm compact />
                        <p className="mt-6 text-center text-[10px] text-gray-400">© 2026 ENACTUS SPIT</p>
                    </div>
                </section>
            </div>
        </>
    );
}
