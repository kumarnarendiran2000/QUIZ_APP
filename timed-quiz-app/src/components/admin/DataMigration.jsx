// src/components/admin/DataMigration.jsx
import React, { useState } from "react";
import { db } from "../../utils/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * A component to trigger data migration for old quiz responses
 * This is an admin-only component to migrate quiz responses to the new format
 */
const DataMigration = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleMigration = async () => {
    if (isMigrating) return;

    // Confirm migration
    if (
      !window.confirm(
        "Are you sure you want to migrate all quiz responses to the new format? This operation cannot be undone."
      )
    ) {
      return;
    }

    setIsMigrating(true);
    setError(null);
    setResult(null);
    setProgress({ current: 0, total: 0 });

    try {
      // Get all documents from quiz_responses collection
      const quizResponsesRef = collection(db, "quiz_responses");
      const snapshot = await getDocs(quizResponsesRef);

      let migratedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      const errors = [];
      const migrated = [];

      setProgress({ current: 0, total: snapshot.size });

      // Process each document
      for (let i = 0; i < snapshot.docs.length; i++) {
        try {
          const docRef = snapshot.docs[i];
          const docId = docRef.id;
          const data = docRef.data();

          // Update progress
          setProgress({ current: i + 1, total: snapshot.size });

          // Check if this is already in the new format (contains underscores)
          if (docId.includes("_")) {
            console.log(`Skipping document ${docId} - already in new format`);
            skippedCount++;
            continue;
          }

          // Determine test mode - default to "pre" for old documents
          const testMode = data.testMode || (data.isPostTest ? "post" : "pre");

          // Use July 10, 2025 for migration as specified
          const migrationDate = "20250710";

          // Generate new document ID
          const newDocId = `${docId}_${testMode}_${migrationDate}`;

          console.log(`Migrating document ${docId} to ${newDocId}`);

          // Create the new document with all the data from the original
          const enhancedData = {
            ...data,
            userUid: docId, // Ensure userUid field exists
            testMode: testMode, // Set the test mode explicitly
            quizDate: "2025-07-10", // Set the date in YYYY-MM-DD format
            migratedFrom: docId,
            migratedAt: serverTimestamp(),
          };

          // Write the new document
          const newDocRef = doc(db, "quiz_responses", newDocId);
          await setDoc(newDocRef, enhancedData);

          // Mark the old document as migrated
          const oldDocRef = doc(db, "quiz_responses", docId);
          await updateDoc(oldDocRef, {
            migrated: true,
            migratedTo: newDocId,
            migratedAt: serverTimestamp(),
          });

          migratedCount++;
          migrated.push({
            oldId: docId,
            newId: newDocId,
            testMode,
          });
        } catch (err) {
          console.error(
            `Error migrating document ${snapshot.docs[i].id}:`,
            err
          );
          errorCount++;
          errors.push({
            docId: snapshot.docs[i].id,
            error: err.message,
          });
        }
      }

      setResult({
        success: true,
        stats: {
          total: snapshot.size,
          migrated: migratedCount,
          skipped: skippedCount,
          errors: errorCount,
        },
        migrated,
        errors,
      });
    } catch (err) {
      console.error("Migration failed:", err);
      setError(err.message || "Migration failed");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-xl font-bold mb-4 text-blue-800">Data Migration</h3>

      <div className="mb-4 text-gray-700">
        <p>
          This utility will migrate all old quiz response documents to the new
          format:
        </p>
        <p className="mt-2 bg-gray-100 p-2 rounded font-mono text-sm">
          Old format: <span className="text-blue-600">userUid</span>
          <br />
          New format:{" "}
          <span className="text-green-600">userUid_testMode_20250710</span>
        </p>
        <p className="mt-2">
          All existing documents will be migrated using the following rules:
        </p>
        <ul className="list-disc ml-6 mt-2">
          <li>
            Migration date (July 10, 2025) will be used for the date component
          </li>
          <li>
            Documents will be assigned "pre" or "post" test mode based on
            existing data
          </li>
          <li>Original documents will be kept and marked as migrated</li>
        </ul>
      </div>

      <button
        onClick={handleMigration}
        disabled={isMigrating}
        className={`px-4 py-2 rounded font-semibold ${
          isMigrating
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {isMigrating ? "Migrating..." : "Migrate Documents"}
      </button>

      {isMigrating && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{
                width: `${Math.round(
                  (progress.current / progress.total) * 100
                )}%`,
              }}
            ></div>
          </div>
          <p className="text-sm text-gray-600">
            Migrating {progress.current} of {progress.total} documents...
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4">
          <div className="p-3 bg-green-100 border border-green-300 rounded">
            <p className="font-bold text-green-700">Migration Complete!</p>
            <div className="mt-2">
              <p>
                <span className="font-semibold">Total documents:</span>{" "}
                {result.stats.total}
              </p>
              <p>
                <span className="font-semibold">Migrated:</span>{" "}
                {result.stats.migrated}
              </p>
              <p>
                <span className="font-semibold">Skipped:</span>{" "}
                {result.stats.skipped}
              </p>
              <p>
                <span className="font-semibold">Errors:</span>{" "}
                {result.stats.errors}
              </p>
            </div>
          </div>

          {result.migrated.length > 0 && (
            <div className="mt-4">
              <h4 className="font-bold mb-2">Migrated Documents</h4>
              <div className="max-h-60 overflow-auto border rounded p-2 bg-gray-50">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left">Old ID</th>
                      <th className="p-2 text-left">New ID</th>
                      <th className="p-2 text-left">Test Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.migrated.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2 font-mono">{item.oldId}</td>
                        <td className="p-2 font-mono">{item.newId}</td>
                        <td className="p-2">{item.testMode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="font-bold mb-2 text-red-600">Errors</h4>
              <div className="max-h-40 overflow-auto border border-red-200 rounded p-2 bg-red-50">
                <table className="w-full text-sm">
                  <thead className="bg-red-100">
                    <tr>
                      <th className="p-2 text-left">Document ID</th>
                      <th className="p-2 text-left">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((item, idx) => (
                      <tr key={idx} className="border-t border-red-200">
                        <td className="p-2 font-mono">{item.docId}</td>
                        <td className="p-2 text-red-700">{item.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataMigration;
