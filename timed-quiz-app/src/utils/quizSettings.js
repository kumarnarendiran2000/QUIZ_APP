// src/utils/quizSettings.js
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const SETTINGS_DOC = "quiz_settings";
const SETTINGS_ID = "default";

export async function getTestMode() {
  const ref = doc(db, SETTINGS_DOC, SETTINGS_ID);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data().testMode || "post";
  }
  return "post";
}

export async function setTestMode(mode) {
  const ref = doc(db, SETTINGS_DOC, SETTINGS_ID);
  await setDoc(ref, { testMode: mode }, { merge: true });
}
