// src/App.jsx
import React, { useState } from "react"
import Login from "./components/Login"
import UserForm from "./components/UserForm"
import QuizPage from "./components/QuizPage"
import ResultPage from "./components/ResultPage"
import { db } from "./utils/firebase"
import { doc, setDoc } from "firebase/firestore"
import { questions } from "./data/questions"

const App = () => {
  const [step, setStep] = useState("login")
  const [user, setUser] = useState(null)
  const [userInfo, setUserInfo] = useState({ name: "", mobile: "" })
  const [answers, setAnswers] = useState([])
  const [timeLeft, setTimeLeft] = useState(1800)

  const startQuiz = () => setStep("quiz")

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser)
    setStep("form")
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
