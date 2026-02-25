import { useState } from "react";

export default function BillSetupModal({
  isOpen,
  onClose,
  onSubmit,
  billNumber = 1,
  isLoading = false,
}) {
  const [billName, setBillName] = useState("");
  const [billSummary, setBillSummary] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!billName.trim()) {
      newErrors.billName = "Bill name is required";
    }
    if (!billSummary.trim()) {
      newErrors.billSummary = "Bill summary is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit
    onSubmit({
      billNumber,
      billName: billName.trim(),
      billSummary: billSummary.trim(),
    });

    // Reset form
    setBillName("");
    setBillSummary("");
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in scale-95 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-blue-600 text-lg">
              edit_document
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-dark">
              Setup Bill {billNumber}
            </h2>
            <p className="text-sm text-gray-500">
              Enter bill details to proceed
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Bill Name */}
          <div>
            <label
              htmlFor="bill-name"
              className="block text-sm font-semibold text-neutral-dark mb-2"
            >
              Bill Name <span className="text-red-500">*</span>
            </label>
            <input
              id="bill-name"
              type="text"
              value={billName}
              onChange={(e) => {
                setBillName(e.target.value);
                if (errors.billName) setErrors({ ...errors, billName: "" });
              }}
              placeholder="e.g., 'National Infrastructure Development Act'"
              className={`w-full px-4 py-2 rounded-lg border-2 transition-colors font-medium text-sm
                ${
                  errors.billName
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:outline-none"
                    : "border-gray-200 bg-gray-50 focus:border-blue-500 focus:outline-none"
                }`}
              disabled={isLoading}
            />
            {errors.billName && (
              <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">error</span>
                {errors.billName}
              </p>
            )}
          </div>

          {/* Bill Summary */}
          <div>
            <label
              htmlFor="bill-summary"
              className="block text-sm font-semibold text-neutral-dark mb-2"
            >
              Bill Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              id="bill-summary"
              value={billSummary}
              onChange={(e) => {
                setBillSummary(e.target.value);
                if (errors.billSummary)
                  setErrors({ ...errors, billSummary: "" });
              }}
              placeholder="Briefly describe the bill's objective and key provisions..."
              rows={4}
              className={`w-full px-4 py-2 rounded-lg border-2 transition-colors font-medium text-sm resize-none
                ${
                  errors.billSummary
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:outline-none"
                    : "border-gray-200 bg-gray-50 focus:border-blue-500 focus:outline-none"
                }`}
              disabled={isLoading}
            />
            {errors.billSummary && (
              <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">error</span>
                {errors.billSummary}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">
                    check_circle
                  </span>
                  <span>Save & Proceed</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
