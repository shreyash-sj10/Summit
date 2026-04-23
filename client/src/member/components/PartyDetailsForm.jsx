import { useState, useMemo } from 'react';
import { submitPartyDetails } from '../../shared/services/api';
import { motion as Motion, AnimatePresence } from 'framer-motion';

export default function PartyDetailsForm({ user, onComplete }) {
    const [totalMembers, setTotalMembers] = useState(1);
    const [membersData, setMembersData] = useState([{ name: '', college: '' }]);
    const [logoUrl, setLogoUrl] = useState('');
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const updateMembersData = (newVal) => {
        setTotalMembers(newVal);
        const newData = [...membersData];
        if (newVal > newData.length) {
            for (let i = newData.length; i < newVal; i++) {
                newData.push({ name: '', college: '' });
            }
        } else if (newVal < newData.length) {
            newData.length = newVal;
        }
        setMembersData(newData);
    };

    const increment = () => {
        if (totalMembers < 10) updateMembersData(totalMembers + 1);
    };

    const decrement = () => {
        if (totalMembers > 1) updateMembersData(totalMembers - 1);
    };

    const handleMemberDataChange = (index, field, value) => {
        const newData = [...membersData];
        newData[index][field] = value;
        setMembersData(newData);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
            setError('Image size must be 1MB or less.');
            e.target.value = '';
            return;
        }

        setUploadingLogo(true);
        setError('');

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            // Bypass Cloudinary upload if not configured, allowing user to proceed
            setLogoUrl('https://ui-avatars.com/api/?name=Party&background=f1f5f9&color=64748b&size=128');
            setUploadingLogo(false);
            e.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.secure_url) {
                setLogoUrl(data.secure_url);
            } else {
                setError('Failed to upload logo.');
            }
        } catch {
            setError('Error uploading logo. Please try again.');
        } finally {
            setUploadingLogo(false);
            e.target.value = '';
        }
    };

    const isValid = useMemo(() => {
        if (!logoUrl) return false;
        if (membersData.some(m => !m.name.trim() || !m.college.trim())) return false;
        return true;
    }, [logoUrl, membersData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isValid) {
            setError('Please complete all fields and upload a logo.');
            return;
        }

        setSubmitting(true);
        try {
            await submitPartyDetails({
                party: user.party,
                total_members: totalMembers,
                members_data: membersData,
                logo_url: logoUrl
            });
            onComplete();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to submit party details.');
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-neutral-dark/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <Motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-full"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-saffron via-white to-india-green h-2 w-full shrink-0" />
                <div className="p-6 md:p-8 shrink-0 border-b border-gray-100">
                    <h2 className="text-2xl md:text-3xl font-black text-neutral-dark tracking-tight text-center">
                        Party Registration
                    </h2>
                    <p className="text-gray-500 font-medium mt-1 text-center text-sm md:text-base">
                        Welcome, <span className="text-india-green font-bold">{user.party}</span> delegate!
                    </p>
                </div>

                {/* Scrollable Form Body */}
                <div className="p-6 md:p-8 overflow-y-auto no-scrollbar flex-1 bg-gray-50/30">
                    <form onSubmit={handleSubmit} className="space-y-8 max-w-md mx-auto">

                        {/* Logo Upload */}
                        <section className="space-y-3">
                            <label className="block text-sm font-bold text-neutral-dark">
                                Party Logo <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="h-20 w-20 shrink-0 bg-white rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
                                    ) : (
                                        <span className="material-symbols-outlined text-gray-300 text-3xl">add_photo_alternate</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                        id="logo-upload"
                                        disabled={uploadingLogo}
                                    />
                                    <label
                                        htmlFor="logo-upload"
                                        className={`cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all w-full md:w-auto h-11 ${uploadingLogo
                                            ? 'bg-gray-100 text-gray-400 pointer-events-none'
                                            : 'bg-saffron/10 text-saffron-dark hover:bg-saffron/20 active:scale-95'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {uploadingLogo ? 'hourglass_empty' : 'upload'}
                                        </span>
                                        {uploadingLogo ? 'Uploading...' : (logoUrl ? 'Change Logo' : 'Upload Logo')}
                                    </label>
                                    <p className="text-[10px] text-gray-400 mt-2 font-medium">JPEG, PNG, GIF (Max 1MB)</p>
                                </div>
                            </div>
                        </section>

                        {/* Participant Count Selector */}
                        <section className="space-y-3">
                            <label className="block text-sm font-bold text-neutral-dark">
                                Total Participants <span className="text-red-500">*</span>
                            </label>
                            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm w-fit border-b-[3px]">
                                <button
                                    type="button"
                                    onClick={decrement}
                                    disabled={totalMembers <= 1}
                                    className="h-10 w-12 flex items-center justify-center text-gray-500 hover:text-neutral-dark hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer active:scale-95 touch-manipulation"
                                    aria-label="Decrease participants"
                                >
                                    <span className="material-symbols-outlined">remove</span>
                                </button>

                                <div className="w-16 text-center font-black text-xl text-neutral-dark tabular-nums tracking-wider">
                                    {totalMembers}
                                </div>

                                <button
                                    type="button"
                                    onClick={increment}
                                    disabled={totalMembers >= 10}
                                    className="h-10 w-12 flex items-center justify-center text-gray-500 hover:text-neutral-dark hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer active:scale-95 touch-manipulation"
                                    aria-label="Increase participants"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium">
                                Minimum 1, Maximum 10 participants.
                            </p>
                        </section>

                        {/* Participant Details */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-neutral-dark">Participant Details</h3>
                                <span className="text-[10px] py-1 px-2 uppercase tracking-wider font-bold bg-amber-100 text-amber-700 rounded-lg border border-amber-200">
                                    Required for Entry
                                </span>
                            </div>

                            <div className="space-y-3">
                                <AnimatePresence initial={false}>
                                    {membersData.map((member, index) => (
                                        <Motion.div
                                            key={`member-${index}`}
                                            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                                            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                            transition={{ duration: 0.2 }}
                                            className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4"
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500 border border-gray-200">
                                                    {index + 1}
                                                </div>
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                                    Participant
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Full Name</label>
                                                    <input
                                                        type="text"
                                                        value={member.name}
                                                        onChange={(e) => handleMemberDataChange(index, 'name', e.target.value)}
                                                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all placeholder:text-gray-300 shadow-sm"
                                                        placeholder="e.g. Rahul Sharma"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">College</label>
                                                    <input
                                                        type="text"
                                                        value={member.college}
                                                        onChange={(e) => handleMemberDataChange(index, 'college', e.target.value)}
                                                        className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-saffron/20 focus:border-saffron outline-none transition-all placeholder:text-gray-300 shadow-sm"
                                                        placeholder="e.g. SPIT Mumbai"
                                                    />
                                                </div>
                                            </div>
                                        </Motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>

                        {/* Error Space */}
                        <AnimatePresence>
                            {error && (
                                <Motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium flex items-center gap-2 border border-red-100"
                                >
                                    <span className="material-symbols-outlined text-[18px]">error</span>
                                    {error}
                                </Motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>

                {/* Footer Action */}
                <div className="p-6 shrink-0 border-t border-gray-100 bg-white">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || uploadingLogo || !isValid}
                        className="w-full h-14 rounded-xl bg-neutral-dark hover:bg-black text-white font-black uppercase tracking-widest text-sm transition-all shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-neutral-dark disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <span>Complete Registration</span>
                                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                            </>
                        )}
                    </button>
                    {!isValid && !error && (
                        <p className="text-center text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-wide">
                            Please complete all required fields to continue
                        </p>
                    )}
                </div>
            </Motion.div>
        </div>
    );
}
