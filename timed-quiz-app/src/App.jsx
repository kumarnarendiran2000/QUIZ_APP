// src/App.jsx
import React, { useState } from "react"
import Login from "./components/Login"
import UserForm from "./components/UserForm"
import QuizPage from "./components/QuizPage"
import ResultPage from "./components/ResultPage"
import AdminDashboard from "./components/AdminDashboard"
import { db } from "./utils/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { questions } from "./data/questions"

const QUIZ_DURATION = 420 // in seconds (7 minutes)

const App = () => {
  const [step, setStep] = useState("login")
  const [user, setUser] = useState(null)
  const [userInfo, setUserInfo] = useState({ name: "", mobile: "" })
  const [answers, setAnswers] = useState([])
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION)
  const ADMIN_EMAILS = ["kumarnarendiran2211@gmail.com", "kumargowtham1994@gmail.com"]

  const handleLogin = async (loggedInUser) => {
    if (ADMIN_EMAILS.includes(loggedInUser.email)) {
      setUser(loggedInUser)
      setStep("admin")
      return
    }
  
    const ref = doc(db, "quiz_responses", loggedInUser.uid)
    const snap = await getDoc(ref)

    if (snap.exists()) {
      const data = snap.data()

      // If quiz was submitted
      if (data.score !== undefined) {
        setUser(loggedInUser)
        setUserInfo({ name: data.name, mobile: data.mobile })
        setAnswers(data.answers || [])
        setStep("result")
        return
      }

      // If quiz already started and not submitted
      if (data.startedAt) {
        const elapsed = Math.floor((Date.now() - data.startedAt) / 1000)
        const remaining = Math.max(QUIZ_DURATION - elapsed, 0)

        if (remaining > 0) {
          setUser(loggedInUser)
          setUserInfo({ name: data.name || "", mobile: data.mobile || "" })

          // Normalize answers with nulls
          const normalized = Array(questions.length).fill(null)
          const saved = data.answers || []
          for (let i = 0; i < saved.length; i++) {
            normalized[i] = saved[i]
          }
          setAnswers(normalized)

          setTimeLeft(remaining)
          setStep("quiz")
          return
        }
      }
    }
  
    // New user (non-admin)
    setUser(loggedInUser)
    setStep("form")
  }

  const startQuiz = async () => {
    const initialAnswers = Array(questions.length).fill(null)

    if (user) {
      const ref = doc(db, "quiz_responses", user.uid)
      await setDoc(
        ref,
        {
          name: userInfo.name,
          email: user.email,
          mobile: userInfo.mobile,
          startedAt: Date.now(),
          answers: initialAnswers,
        },
        { merge: true }
      )
    }

    setTimeLeft(QUIZ_DURATION)
    setAnswers(initialAnswers)
    setStep("quiz")
  }

  const handleSubmit = async () => {
    const score = answers.reduce((total, ans, i) => {
      return ans === null ? total : total + (ans === questions[i].answer ? 1 : 0)
    }, 0)

    if (user) {
      const ref = doc(db, "quiz_responses", user.uid)
      await setDoc(ref, {
        name: userInfo.name,
        email: user.email,
        mobile: userInfo.mobile,
        answers,
        score,
        submittedAt: new Date().toISOString(),
      })
    }

    setStep("result")
  }

  return (
    <>
      {step === "login" && <Login onLogin={handleLogin} />}
      {step === "form" && (
        <UserForm
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          onStartQuiz={startQuiz}
        />
      )}
      {step === "quiz" && (
        <QuizPage
          answers={answers}
          setAnswers={setAnswers}
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          onSubmit={handleSubmit}
          user={user}
        />
      )}
      {step === "result" && (
        <ResultPage
          userInfo={userInfo}
          userEmail={user?.email}
          answers={answers}
        />
      )}
      {step === "admin" && <AdminDashboard />}
    </>
  )
}

export default App