// src/components/admin/DeleteModal.jsx
import React from "react";
import useAdmin from "./hooks/useAdmin";
import { deleteSubmission } from "./adminUtils";

const DeleteModal = () => {
  const {
    deleteTarget,
    setDeleteTarget,
    deleteLoading,
    setDeleteLoading,
    selectedIds,
    setSelectedIds,
    setSelectAll,
  } = useAdmin();

  if (!deleteTarget) {
    return null;
  }

  const handleDelete = async () => {
    setDeleteLoading(true);
    const success = await deleteSubmission(
      deleteTarget.id,
      selectedIds,
      setSelectedIds,
      setSelectAll
    );

    if (success) {
      setDeleteTarget(null);
    } else {
      alert("Failed to delete record. Please try again.");
    }

    setDeleteLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-xs sm:max-w-sm w-[90vw] text-center flex flex-col items-center animate-fade-in border-2 border-red-200">
        <h2 className="text-xl sm:text-2xl font-bold text-red-700 mb-3">
          Confirm Deletion
        </h2>
        <p className="text-gray-700 mb-4 text-base sm:text-lg">
          Are you sure you want to delete the record for
          <span className="font-semibold text-red-700">
            {" "}
            {deleteTarget.name}{" "}
          </span>
          ?
          <br />
          This cannot be undone.
        </p>
        <div className="flex gap-4 w-full justify-center mt-2">
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className={`bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow transition w-1/2 ${
              deleteLoading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {deleteLoading ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={() => setDeleteTarget(null)}
            disabled={deleteLoading}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg shadow transition w-1/2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
