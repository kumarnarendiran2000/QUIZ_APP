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
  const [sortBy, setSortBy] = useState("order"); // order, topic, status
  
  // Multi-select state
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [questionToDelete, setQuestionToDelete] = useState(null);

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
      setModalMessage("Question is required");
      setShowSuccessModal(true);
      return;
    }
    
    if (formData.options.some(opt => !opt.trim())) {
      setModalMessage("All options are required");
      setShowSuccessModal(true);
      return;
    }
    
    if (!formData.topic.trim()) {
      setModalMessage("Topic is required");
      setShowSuccessModal(true);
      return;
    }

    try {
      if (editingQuestion) {
        // Update existing question
        const success = await updateQuestionInFirestore(editingQuestion.id, formData);
        if (success) {
          setModalMessage("Question updated successfully!");
          setShowSuccessModal(true);
          resetForm();
          await loadQuestions();
          await loadStatistics();
        } else {
          setModalMessage("Failed to update question");
          setShowSuccessModal(true);
        }
      } else {
        // Add new question
        const docId = await addQuestionToFirestore(formData);
        if (docId) {
          setModalMessage("Question added successfully!");
          setShowSuccessModal(true);
          resetForm();
          await loadQuestions();
          await loadStatistics();
        } else {
          setModalMessage("Failed to add question");
          setShowSuccessModal(true);
        }
      }
    } catch (error) {
      console.error("Error saving question:", error);
      setModalMessage("Error saving question");
      setShowSuccessModal(true);
    }
  };

  const handleDelete = (question) => {
    setQuestionToDelete(question);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;
    
    try {
      const success = await deleteQuestionFromFirestore(questionToDelete.id);
      if (success) {
        setModalMessage("Question deleted successfully!");
        setShowSuccessModal(true);
        await loadQuestions();
        await loadStatistics();
      } else {
        setModalMessage("Failed to delete question");
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error deleting question:", error);
      setModalMessage("Error deleting question");
      setShowSuccessModal(true);
    } finally {
      setShowDeleteModal(false);
      setQuestionToDelete(null);
    }
  };

  // Multi-select handlers
  const toggleQuestionSelect = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const selectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedQuestions.length === 0) {
      setModalMessage("Please select questions to delete");
      setShowSuccessModal(true);
      return;
    }
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const deletePromises = selectedQuestions.map(id => deleteQuestionFromFirestore(id));
      await Promise.all(deletePromises);
      
      setModalMessage(`Successfully deleted ${selectedQuestions.length} question(s)!`);
      setShowSuccessModal(true);
      setSelectedQuestions([]);
      await loadQuestions();
      await loadStatistics();
    } catch (error) {
      console.error("Error bulk deleting:", error);
      setModalMessage("Error deleting questions");
      setShowSuccessModal(true);
    } finally {
      setShowBulkDeleteModal(false);
    }
  };

  const handleBulkStatusChange = async (isActive) => {
    if (selectedQuestions.length === 0) {
      setModalMessage("Please select questions to update");
      setShowSuccessModal(true);
      return;
    }

    try {
      const updatePromises = selectedQuestions.map(id => {
        const question = questions.find(q => q.id === id);
        return updateQuestionInFirestore(id, { ...question, isActive });
      });
      await Promise.all(updatePromises);
      
      const action = isActive ? "activated" : "deactivated";
      setModalMessage(`Successfully ${action} ${selectedQuestions.length} question(s)!`);
      setShowSuccessModal(true);
      setSelectedQuestions([]);
      await loadQuestions();
      await loadStatistics();
    } catch (error) {
      console.error("Error updating status:", error);
      setModalMessage("Error updating questions");
      setShowSuccessModal(true);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  // Filter and sort questions
  const filteredQuestions = questions
    .filter(question => {
      const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           question.topic.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTopic = selectedTopic === "all" || question.topic === selectedTopic;
      return matchesSearch && matchesTopic;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "topic":
          return a.topic.localeCompare(b.topic);
        case "status":
          return (b.isActive !== false ? 1 : 0) - (a.isActive !== false ? 1 : 0);
        case "order":
        default:
          return (a.order || 0) - (b.order || 0);
      }
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
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">📝 Question Management</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage quiz questions and correct answers stored in Firestore</p>
            </div>
            <button
              onClick={onBack}
              className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg transition-all duration-200 shadow cursor-pointer font-semibold whitespace-nowrap"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Total Questions</p>
                <p className="text-3xl font-bold">{statistics.totalQuestions || 0}</p>
              </div>
              <div className="text-4xl opacity-50">📚</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Active Questions</p>
                <p className="text-3xl font-bold">{statistics.activeQuestions || 0}</p>
              </div>
              <div className="text-4xl opacity-50">✅</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium mb-1">Inactive Questions</p>
                <p className="text-3xl font-bold">{statistics.inactiveQuestions || 0}</p>
              </div>
              <div className="text-4xl opacity-50">❌</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium mb-1">Topics</p>
                <p className="text-3xl font-bold">{statistics.topics?.length || 0}</p>
              </div>
              <div className="text-4xl opacity-50">🏷️</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6">
          {/* Primary Actions */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg shadow cursor-pointer transition-all duration-200"
            >
              ➕ Add New Question
            </button>
            
            <button
              onClick={() => setShowTimerSettings(true)}
              className="bg-purple-700 hover:bg-purple-800 text-white font-semibold px-6 py-3 rounded-lg shadow cursor-pointer transition-all duration-200"
            >
              ⏱️ Timer Settings
            </button>
          </div>

          {/* Bulk Actions (show when items are selected) */}
          {selectedQuestions.length > 0 && (
            <div className="flex flex-wrap gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
              <span className="font-semibold text-blue-900 self-center">
                {selectedQuestions.length} selected
              </span>
              <button
                onClick={selectAll}
                className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200"
              >
                {selectedQuestions.length === filteredQuestions.length ? '☐ Deselect All' : '☑️ Select All'}
              </button>
              <button
                onClick={() => handleBulkStatusChange(true)}
                className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200"
              >
                ✅ Activate Selected
              </button>
              <button
                onClick={() => handleBulkStatusChange(false)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200"
              >
                ⚠️ Deactivate Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200"
              >
                🗑️ Delete Selected
              </button>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="🔍 Search questions by text or topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            </div>
            
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium transition-all min-w-[180px] cursor-pointer"
            >
              <option value="all">📋 All Topics</option>
              {uniqueTopics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium transition-all min-w-[180px] cursor-pointer"
            >
              <option value="order">📊 Sort by Order</option>
              <option value="topic">🏷️ Sort by Topic</option>
              <option value="status">📈 Sort by Status</option>
            </select>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all">
              <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingQuestion ? "✏️ Edit Question" : "➕ Add New Question"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition-all"
                >
                  ×
                </button>
              </div>
            
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Question Input */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📝 Question Text *
                  </label>
                  <textarea
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    rows="3"
                    placeholder="Enter your question here..."
                    required
                  />
                </div>

                {/* Options Input */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    🎯 Answer Options * 
                    <span className="text-xs font-normal text-gray-500 ml-2">(Select the correct answer using the radio button)</span>
                  </label>
                  <div className="space-y-3">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all">
                        <span className="text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded">{String.fromCharCode(65 + index)}</span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          required
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={formData.correctAnswer === index}
                            onChange={() => setFormData({ ...formData, correctAnswer: index })}
                            className="w-5 h-5 text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
                            title="Mark as correct answer"
                          />
                          {formData.correctAnswer === index && (
                            <span className="text-green-600 font-bold">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Topic and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      🏷️ Topic *
                    </label>
                    <input
                      type="text"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="e.g., Anatomy, Physiology"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      📊 Status
                    </label>
                    <select
                      value={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === "true" })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium transition-all"
                    >
                      <option value={true}>✅ Active</option>
                      <option value={false}>❌ Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white px-8 py-3 rounded-lg font-bold shadow cursor-pointer transition-all duration-200"
                  >
                    {editingQuestion ? "💾 Update Question" : "➕ Add Question"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold cursor-pointer transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

        {/* Questions List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              📝 Questions List
            </h2>
            <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
              {filteredQuestions.length} of {questions.length} shown
            </span>
          </div>
          
          <div className="space-y-4">
            {filteredQuestions.map((question, index) => (
              <div key={question.id} className={`border-2 rounded-xl p-5 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-gray-50 ${
                selectedQuestions.includes(question.id) 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}>
                {/* Question Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                  <div className="flex gap-3 flex-1">
                    {/* Checkbox for multi-select - Always visible */}
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(question.id)}
                      onChange={() => toggleQuestionSelect(question.id)}
                      className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">
                        <span className="text-blue-600">Q{index + 1}.</span> {question.question}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                          🏷️ {question.topic}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          question.isActive !== false 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {question.isActive !== false ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(question)}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow cursor-pointer transition-all duration-200"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(question)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow cursor-pointer transition-all duration-200"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
                
                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-3 rounded-lg transition-all duration-200 ${
                        question.correctAnswer === optIndex
                          ? 'bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-500 shadow-md'
                          : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 font-bold text-gray-700 bg-white px-2 py-1 rounded">
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span className="flex-1">{option}</span>
                        {question.correctAnswer === optIndex && (
                          <span className="flex-shrink-0 text-green-600 font-bold text-lg">✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          
            {filteredQuestions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-xl font-semibold">No questions found</p>
                <p className="text-gray-400 mt-2">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Delete Question?</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this question? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold cursor-pointer transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Delete Confirmation Modal */}
        {showBulkDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Delete Multiple Questions?</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <span className="font-bold text-red-600">{selectedQuestions.length}</span> question(s)? 
                  This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBulkDeleteModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmBulkDelete}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold cursor-pointer transition-all"
                  >
                    Delete All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success/Info Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {modalMessage.includes('success') || modalMessage.includes('Successfully') ? '✅' : '⚠️'}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  {modalMessage.includes('success') || modalMessage.includes('Successfully') ? 'Success!' : 'Notice'}
                </h3>
                <p className="text-gray-600 mb-6">{modalMessage}</p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold cursor-pointer transition-all"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Timer Settings Modal */}
        {showTimerSettings && (
          <TimerSettingsModal onClose={() => setShowTimerSettings(false)} />
        )}
      </div>
    </div>
  );
};

// Timer Settings Modal Component
const TimerSettingsModal = ({ onClose }) => {
  const [timerMinutes, setTimerMinutes] = useState(20);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimerSettings();
  }, []);

  const loadTimerSettings = async () => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../utils/firebase');
      const settingsRef = doc(db, 'quiz_settings', 'timer');
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        setTimerMinutes(settingsSnap.data().minutes || 20);
      }
    } catch (error) {
      console.error('Error loading timer settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../utils/firebase');
      const settingsRef = doc(db, 'quiz_settings', 'timer');
      
      await setDoc(settingsRef, {
        minutes: timerMinutes,
        seconds: timerMinutes * 60,
        updatedAt: Date.now()
      });
      
      alert('Timer settings updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving timer settings:', error);
      alert('Failed to save timer settings');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">⏱️ Timer Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer transition-all"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">⏳</div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Quiz Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-2xl font-bold text-center"
              />
              <p className="text-sm text-gray-500 mt-2 text-center">
                = {timerMinutes * 60} seconds
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-semibold cursor-pointer transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionManager;