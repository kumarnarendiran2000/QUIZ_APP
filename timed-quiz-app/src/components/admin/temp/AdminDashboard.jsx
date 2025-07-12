// src/components/AdminDashboard.jsx - New clean version
import React from "react";
import { AdminProvider } from "./admin/AdminContext";
import MobileSnackbar from "./MobileSnackbar";
import AdminVisualizations from "./AdminVisualizations";
import TestModeSelector from "./admin/TestModeSelector";
import SubmissionsTable from "./admin/SubmissionsTable";
import ResultView from "./admin/ResultView";
import DeleteModal from "./admin/DeleteModal";
import BulkDeleteModal from "./admin/BulkDeleteModal";
import EmailToast from "./admin/EmailToast";
import ExportControls from "./admin/ExportControls";
import { useAdmin } from "./admin/AdminContext";
import NavigationControls from "./admin/NavigationControls";

// Main component that uses the context
const AdminDashboardContent = () => {
  const {
    showMobileSnackbar,
    setShowMobileSnackbar,
    selectedIds,
    loading,
    submissions,
    viewing,
    deleteTarget,
    showBulkDeleteModal,
    showVisualizations,
    setShowVisualizations,
    setShowBulkDeleteModal,
  } = useAdmin();

  return (
    <>
      {/* Add fade-out animation style */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes fadeOut {
            0% { opacity: 1; }
            70% { opacity: 1; }
            100% { opacity: 0; }
          }
          .animate-fade-out {
            animation: fadeOut 3s forwards;
          }
        `,
        }}
      />
      <MobileSnackbar
        open={showMobileSnackbar}
        message="PDF saved to Downloads. Open with a PDF viewer for best experience. For best results, try exporting from a desktop browser."
        onClose={() => setShowMobileSnackbar(false)}
      />

      {/* Navigation Controls */}
      <NavigationControls />

      {/* Email Status Toast */}
      <EmailToast />

      <div className="max-w-8xl mx-auto mt-10 p-6 bg-white rounded-md shadow-sm">
        {/* Enhanced Admin Dashboard Heading */}
        <h2
          className="text-xl font-semibold text-blue-800 tracking-wide mb-4 bg-blue-50 border border-blue-200 px-6 py-3 rounded-xl shadow-lg w-full flex justify-center items-center mx-auto"
          style={{ maxWidth: "420px" }}
        >
          🧾 Admin Dashboard
        </h2>

        {/* Navigation Controls Info */}
        <div className="hidden md:block mb-4 text-center">
          <p className="text-xs text-gray-600 italic">
            Tip: Press and hold the navigation buttons for continuous scrolling
          </p>
        </div>

        {/* Test Mode Selector */}
        <TestModeSelector />

        {/* Visualizations Button */}
        <div className="mb-8 flex justify-end print:hidden">
          <button
            onClick={() => setShowVisualizations(true)}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg shadow cursor-pointer"
          >
            View Visualizations
          </button>
        </div>

        {/* Visualizations Modal */}
        {showVisualizations && (
          <AdminVisualizations
            submissions={submissions}
            onClose={() => setShowVisualizations(false)}
          />
        )}

        {/* Bulk Delete Button */}
        {selectedIds.length > 0 && (
          <div className="mb-4 flex items-center gap-4">
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow transition cursor-pointer"
            >
              Delete Selected ({selectedIds.length})
            </button>
            <span className="text-gray-600 text-sm">
              {selectedIds.length} selected
            </span>
          </div>
        )}

        {/* Export Controls */}
        <ExportControls />

        {/* Main content area - submissions table or loading state */}
        {loading ? (
          <p className="text-center text-gray-500 text-lg">
            Loading submissions...
          </p>
        ) : submissions.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">
            No submissions found yet.
          </p>
        ) : (
          <div>
            {/* Mobile-friendly notice */}
            <div className="md:hidden mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm">
              <p className="font-medium text-blue-800">
                Note: This table is scrollable horizontally.
              </p>
              <p className="text-blue-600">
                Swipe left/right to view all columns or use the navigation
                controls available.
              </p>
            </div>

            {/* Submissions Table */}
            <SubmissionsTable />
          </div>
        )}

        {/* Result View */}
        {viewing && <ResultView />}

        {/* Delete Confirmation Modal */}
        {deleteTarget && <DeleteModal />}

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteModal && <BulkDeleteModal />}
      </div>
    </>
  );
};

// Wrapper component that provides context to the dashboard
const AdminDashboard = () => {
  return (
    <AdminProvider>
      <AdminDashboardContent />
    </AdminProvider>
  );
};

export default AdminDashboard;
