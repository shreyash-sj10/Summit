import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../store/useUserStore';
import useSessionStore from '../../store/useSessionStore';
import useQueueStore from '../../store/useQueueStore';
import { useAuth } from '../../shared/context/useAuth';
import QueueView from '../components/QueueView';
import ActiveSpeakerView from '../components/ActiveSpeakerView';

export default function DisplayDashboard() {
    const { initRealtimeUser } = useUserStore();
    const { activeSpeaker, initRealtimeSession } = useSessionStore();
    const { initQueueRealtime } = useQueueStore();
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Initialize Realtime Stores on Mount
    useEffect(() => {
        initRealtimeSession();
        initQueueRealtime();
        initRealtimeUser();
    }, [initRealtimeSession, initQueueRealtime, initRealtimeUser]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="bg-background-light font-display antialiased text-neutral-dark min-h-screen w-full flex flex-col relative overflow-hidden">
            {/* Top Tricolor Stripe */}
            <div className="absolute top-0 w-full h-3 flex z-50 shadow-md">
                <div className="flex-1 bg-saffron" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-india-green" />
            </div>

            {/* Logout Button */}
            <div className="absolute top-5 right-6 z-40">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all font-semibold text-sm shadow-md"
                    title="Logout"
                >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    <span>Logout</span>
                </button>
            </div>

            {/* Subtle Dot pattern bg */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />

            <main className="flex-1 flex w-full h-full relative z-10 pt-3">
                {/* Switch between the Queue view and Active Speaker view based on Session state */}
                {activeSpeaker ? (
                    <ActiveSpeakerView />
                ) : (
                    <QueueView />
                )}
            </main>

            {/* Bottom Decorative Element */}
            <div className="absolute bottom-0 w-full h-2 flex z-50 opacity-50">
                <div className="flex-1 bg-saffron" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-india-green" />
            </div>

        </div>
    );
}
