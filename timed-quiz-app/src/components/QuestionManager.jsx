// src/components/QuestionManager.jsx
import React, { useState, useEffect } from "react";
import {
  getQuestionsFromFirestore,
  addQuestionToFirestore,
  updateQuestionInFirestore,
  deleteQuestionFromFirestore,
  getQuestionStatistics,
  listenToQuestions
} from "../utils/questionsStorage";

const QuestionManager = ({ onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");

  // Form state
  const [formData, setFormData] = useState({
    question: "",
    options: ["", "", "", ""],
    topic: "",
    correctAnswer: 0,
    isActive: true
  });

  useEffect(() => {
    loadQuestions();
    loadStatistics();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const questionsData = await getQuestionsFromFirestore();
      setQuestions(questionsData);
    } catch (error) {
      console.error("Error loading questions:", error);
      alert("Failed to load questions. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await getQuestionStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      options: ["", "", "", ""],
      topic: "",
      correctAnswer: 0,
      isActive: true
    });
    setEditingQuestion(null);
    setShowAddForm(false);
  };

  const handleEdit = (question) => {
    setFormData({
      question: question.question,
      options: [...question.options],
      topic: question.topic,
      correctAnswer: question.correctAnswer || 0,
      isActive: question.isActive !== false
    });
    setEditingQuestion(question);
    setShowAddForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.question.trim()) {
      alert("Question is required");
      return;
    }
    
    if (formData.options.some(opt => !opt.trim())) {
      alert("All options are required");
      return;
    }
    
    if (!formData.topic.trim()) {
      alert("Topic is required");
      return;
    }

    try {
      if (editingQuestion) {
        // Update existing question
        const success = await updateQuestionInFirestore(editingQuestion.id, formData);
        if (success) {
          alert("Question updated successfully!");
          resetForm();
          await loadQuestions();
          await loadStatistics();
        } else {
          alert("Failed to update question");
        }
      } else {
        // Add new question
        const docId = await addQuestionToFirestore(formData);
        if (docId) {
          alert("Question added successfully!");
          resetForm();
          await loadQuestions();
          await loadStatistics();
        } else {
          alert("Failed to add question");
        }
      }
    } catch (error) {
      console.error("Error saving question:", error);
      alert("Error saving question");
    }
  };

  const handleDelete = async (question) => {
    if (window.confirm(`Are you sure you want to delete this question: "${question.question.substring(0, 50)}..."?`)) {
      try {
        const success = await deleteQuestionFromFirestore(question.id);
        if (success) {
          alert("Question deleted successfully!");
          await loadQuestions();
          await loadStatistics();
        } else {
          alert("Failed to delete question");
        }
      } catch (error) {
        console.error("Error deleting question:", error);
        alert("Error deleting question");
      }
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  // Filter questions based on search and topic
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = selectedTopic === "all" || question.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  const uniqueTopics = [...new Set(questions.map(q => q.topic))].sort();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-md shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Question Management</h1>
          <p className="text-gray-600">Manage quiz questions and correct answers</p>
        </div>
        <button
          onClick={onBack}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* System Info */}
      {questions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Question Management System</h3>
          <p className="text-green-700 mb-2">
            <strong>All questions are stored in Firestore quiz_questions collection</strong>
          </p>
          <p className="text-green-600 text-sm mb-2">
            • <strong>Questions:</strong> Firestore quiz_questions collection<br/>
            • <strong>Correct Answers:</strong> Stored with each question<br/>
            • <strong>Management:</strong> Full UI-based editing through this interface
          </p>
          <div className="bg-green-100 border border-green-300 rounded p-3">
            <p className="text-sm text-green-800">
              🎉 <strong>Manage everything here:</strong> Add, edit, delete questions and set correct answers through this interface.
            </p>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800">Total Questions</h3>
          <p className="text-2xl font-bold text-blue-600">{statistics.totalQuestions || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-green-800">Active Questions</h3>
          <p className="text-2xl font-bold text-green-600">{statistics.activeQuestions || 0}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-red-800">Inactive Questions</h3>
          <p className="text-2xl font-bold text-red-600">{statistics.inactiveQuestions || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-purple-800">Topics</h3>
          <p className="text-2xl font-bold text-purple-600">{statistics.topics?.length || 0}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
        >
          + Add New Question
        </button>
        
        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Topics</option>
          {uniqueTopics.map(topic => (
            <option key={topic} value={topic}>{topic}</option>
          ))}
        </select>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingQuestion ? "Edit Question" : "Add New Question"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Question *</label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Options *</label>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold w-8">{String.fromCharCode(65 + index)}.</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={formData.correctAnswer === index}
                      onChange={() => setFormData({ ...formData, correctAnswer: index })}
                      className="w-4 h-4 text-green-600"
                      title="Mark as correct answer"
                    />
                  </div>
                ))}
                <p className="text-xs text-gray-500 mt-2">Select the radio button next to the correct answer</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Topic *</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  {editingQuestion ? "Update Question" : "Add Question"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Questions ({filteredQuestions.length} of {questions.length})
        </h2>
        
        {filteredQuestions.map((question, index) => (
          <div key={question.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800">
                Q{index + 1}. {question.question}
              </h3>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(question)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(question)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className="mb-2">
              <span className="text-sm font-semibold text-purple-600">Topic: {question.topic}</span>
              <span className={`ml-4 text-sm font-semibold ${question.isActive !== false ? 'text-green-600' : 'text-red-600'}`}>
                {question.isActive !== false ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {question.options.map((option, optIndex) => (
                <div
                  key={optIndex}
                  className={`p-2 rounded ${
                    question.correctAnswer === optIndex
                      ? 'bg-green-100 border-2 border-green-500 font-semibold'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <span className="font-semibold">{String.fromCharCode(65 + optIndex)}.</span> {option}
                  {question.correctAnswer === optIndex && (
                    <span className="ml-2 text-green-600 font-bold">✓ Correct</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {filteredQuestions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No questions found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionManager;