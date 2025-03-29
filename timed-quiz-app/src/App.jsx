// src/App.jsx
import React, { useState } from "react"
import Login from "./components/Login"
import UserForm from "./components/UserForm"
import QuizPage from "./components/QuizPage"
import ResultPage from "./components/ResultPage"
import { db } from "./utils/firebase"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { questions } from "./data/questions"

const App = () => {
  const [step, setStep] = useState("login")
  const [user, setUser] = useState(null)
  const [userInfo, setUserInfo] = useState({ name: "", mobile: "" })
  const [answers, setAnswers] = useState([])
  const [timeLeft, setTimeLeft] = useState(300)

  const handleLogin = async (loggedInUser) => {
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
        const remaining = Math.max(300 - elapsed, 0)

        if (remaining > 0) {
          setUser(loggedInUser)
          setUserInfo({ name: data.name || "", mobile: data.mobile || "" })
          setAnswers(data.answers || [])
          setTimeLeft(remaining)
          setStep("quiz")
          return
        }
      }
    }

    // Default: new user or fresh start
    setUser(loggedInUser)
    setStep("form")
  }

  const startQuiz = async () => {
    if (user) {
      const ref = doc(db, "quiz_responses", user.uid)
      await setDoc(
        ref,
        {
          name: userInfo.name,
          email: user.email,
          mobile: userInfo.mobile,
          startedAt: Date.now(),
          answers: [],
        },
        { merge: true }
      )
    }

    setTimeLeft(300)
    setAnswers([])
    setStep("quiz")
  }

  const handleSubmit = async () => {
    const score = answers.reduce((total, ans, i) => {
      return ans === undefined ? total : total + (ans === questions[i].answer ? 1 : 0)
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
          user={user} // <-- this!
        />
      )}
      {step === "result" && (
        <ResultPage
          userInfo={userInfo}
          userEmail={user?.email}
          answers={answers}
        />
      )}
    </>
  )
}

export default App