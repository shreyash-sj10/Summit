import React from 'react';

export default function WaitingRoom() {
    return (
        <div className="bg-background-light font-display text-neutral-dark flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
            {/* Dot pattern bg */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Top Tricolor Stripe */}
            <div className="absolute top-0 w-full h-2 flex z-10">
                <div className="flex-1 bg-saffron" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-india-green" />
            </div>

            {/* Header */}
            <header className="absolute top-2 w-full px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-saffron/10 rounded-lg flex items-center justify-center border border-saffron/20 shadow-sm">
                        <span className="material-symbols-outlined text-saffron">account_balance</span>
                    </div>
                    <span className="text-xl font-bold tracking-tight text-neutral-dark uppercase">Model Lok Sabha</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-saffron/10">
                        <span className="w-2 h-2 rounded-full bg-india-green animate-pulse" />
                        <span className="text-sm font-medium text-neutral-dark">Live Server</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl px-6 text-center z-10 relative mt-20">
                <div className="w-40 h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center overflow-hidden mb-8 transition-transform hover:scale-105 duration-300 relative">
                    <div className="absolute inset-0 bg-saffron/20 blur-2xl rounded-full mix-blend-multiply" />
                    <img
                        src="/logo.png"
                        alt="Summit"
                        className="w-full h-full object-contain relative z-10 drop-shadow-lg"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                    {!document.querySelector('img[src="/logo.png"]')?.complete && (
                        <div className="absolute inset-0 flex items-center justify-center z-0">
                            <span className="material-symbols-outlined text-6xl text-saffron opacity-50">balance</span>
                        </div>
                    )}
                </div>

                <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-neutral-dark">
                    Summit
                </h1>

                <div className="h-1 w-24 bg-saffron mx-auto rounded-full mb-6" />

                <p className="text-xl md:text-2xl font-medium text-gray-500 mb-12">
                    Debate will start soon
                </p>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col items-start gap-4 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-saffron">groups</span>
                                <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">Session Status</span>
                            </div>
                            <span className="flex items-center gap-2 text-saffron font-bold text-sm">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-saffron" />
                                </span>
                                Waiting Room
                            </span>
                        </div>
                        <p className="text-lg font-bold text-left text-neutral-dark">Moderators are joining...</p>

                        <div className="w-full mt-auto">
                            <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                                <span>Loading</span>
                                <span>85% Ready</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-saffron via-saffron to-india-green w-[85%] rounded-full shadow-inner" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col items-start gap-4 hover:shadow-xl transition-shadow">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-india-green">event_note</span>
                            <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">Next Agenda</span>
                        </div>
                        <div className="flex flex-col items-start">
                            <p className="text-lg font-bold text-neutral-dark">Public Policy Reform</p>
                            <div className="flex items-center gap-2 text-gray-500 mt-1">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                <span className="text-sm font-medium">Coming Up</span>
                            </div>
                        </div>
                        <div className="flex -space-x-2 mt-auto pt-4">
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" title="Delegate 1" />
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300" title="Delegate 2" />
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-400" title="Delegate 3" />
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-saffron flex items-center justify-center text-[10px] text-white font-bold">+12</div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Decorative Element */}
            <div className="absolute bottom-0 w-full h-1 flex z-10 opacity-50">
                <div className="flex-1 bg-saffron" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-india-green" />
            </div>
        </div>
    );
}
