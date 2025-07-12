// src/components/admin/BulkDeleteModal.jsx
import React from "react";
import useAdmin from "./hooks/useAdmin";
import { bulkDeleteSubmissions } from "./adminUtils";

const BulkDeleteModal = () => {
  const {
    showBulkDeleteModal,
    setShowBulkDeleteModal,
    bulkDeleteLoading,
    setBulkDeleteLoading,
    selectedIds,
    setSelectedIds,
    setSelectAll,
  } = useAdmin();

  if (!showBulkDeleteModal) {
    return null;
  }

  const confirmBulkDelete = async () => {
    setBulkDeleteLoading(true);
    const results = await bulkDeleteSubmissions(selectedIds);

    if (results.errors.length > 0) {
      alert(
        `Deleted ${results.success} items. Failed to delete ${results.errors.length} items.`
      );
    }

    setSelectedIds([]);
    setSelectAll(false);
    setBulkDeleteLoading(false);
    setShowBulkDeleteModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-xs sm:max-w-sm w-[90vw] text-center flex flex-col items-center animate-fade-in border-2 border-red-200">
        <h2 className="text-xl sm:text-2xl font-bold text-red-700 mb-3">
          Confirm Bulk Deletion
        </h2>
        <p className="text-gray-700 mb-4 text-base sm:text-lg">
          Are you sure you want to delete
          <span className="font-semibold text-red-700">
            {" "}
            {selectedIds.length}{" "}
          </span>
          selected record(s)?
          <br />
          This cannot be undone.
        </p>
        <div className="flex gap-4 w-full justify-center mt-2">
          <button
            onClick={confirmBulkDelete}
            disabled={bulkDeleteLoading}
            className={`bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow transition w-1/2 ${
              bulkDeleteLoading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {bulkDeleteLoading ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={() => setShowBulkDeleteModal(false)}
            disabled={bulkDeleteLoading}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg shadow transition w-1/2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkDeleteModal;
