// context/AILearningContext.js (CHỈ PHẦN CẦN THIẾT)
import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiPost } from '../services/api';

export const AILearningContext = createContext();

export const AILearningProvider = ({ children }) => {
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    const generateQuiz = useCallback(async (subjectName, topicDetails = '', questionCount = 10) => {
        setLoading(true);
        setQuiz(null);
        setResults(null);
        try {
            const response = await apiPost('/api/ai/quiz/generate', {
                subjectName,
                topicDetails: topicDetails.trim(),
                questionCount: questionCount 
            });

            if (response.success && Array.isArray(response.quiz)) {
                setQuiz(response.quiz);
            } else {
                Alert.alert("Lỗi", response.message || "Không tạo được đề thi!");
            }
        } catch (error) {
            console.error('Lỗi gọi AI:', error);
            Alert.alert("Lỗi mạng", "Không kết nối được với server AI!");
        } finally {
            setLoading(false);
        }
    }, []);

    const gradeQuiz = useCallback((quizData, userAnswersObj) => {
        if (!quizData || !userAnswersObj) return null;

        let correctCount = 0;
        quizData.forEach(q => {
            const questionId = q.id ?? q.index;
            if (userAnswersObj[questionId] === q.correctAnswer) {
                correctCount++;
            }
        });

        const scoreResult = {
            score: correctCount,
            total: quizData.length,
            percentage: Math.round((correctCount / quizData.length) * 100)
        };

        setResults(scoreResult);
        return scoreResult;
    }, []);

    // Resret toàn bộ khi cần 
    const resetQuiz = useCallback(() => {
        setQuiz(null);
        setResults(null);
        setLoading(false);
    }, []);

    // Xuất khẩu các hàm ra
    return (
        <AILearningContext.Provider value={{ quiz, loading, results, generateQuiz, gradeQuiz }}>
            {children}
        </AILearningContext.Provider>
    );
};
export const useAILearning = () => {
    const context = useContext(AILearningContext);
    if (!context) {
        throw new Error('useAILearning phải được dùng trong AILearningProvider');
    }
    return context;
};