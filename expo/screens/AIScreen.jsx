// screens/AIScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAILearning } from '../context/AILearningContext';
import { useSchedules } from '../context/scheduleContext';

export default function AIScreen() {
    const { quiz, loading, generateQuiz } = useAILearning();
    const { ltSchedules, thSchedules } = useSchedules();

    const [selectedSubject, setSelectedSubject] = useState('');
    const [topicDetails, setTopicDetails] = useState('');
    const [questionCount, setQuestionCount] = useState(10);
    const [userAnswers, setUserAnswers] = useState({});
    const [showResult, setShowResult] = useState(false);

    // Tạo danh sách môn học duy nhất
    const subjectList = useMemo(() => {
        const all = [...ltSchedules, ...thSchedules];
        const map = {};
        all.forEach(s => {
            if (s.subject_name && s.sub_id) {
                map[s.subject_name] = s.sub_id;
            }
        });
        return Object.keys(map)
            .map(name => ({ label: name, value: name }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [ltSchedules, thSchedules]);

    useEffect(() => {
        if (subjectList.length > 0 && !selectedSubject) {
            setSelectedSubject(subjectList[0].value);
        }
    }, [subjectList]);

    const handleGenerate = async () => {
        if (!selectedSubject) {
            Alert.alert("Lỗi", "Vui lòng chọn môn học");
            return;
        }
        setShowResult(false);
        setUserAnswers({});

        await generateQuiz(selectedSubject, topicDetails, questionCount);
    };

    const handleAnswer = (qIndex, answer) => {
        setUserAnswers(prev => ({ ...prev, [qIndex]: answer }));
    };

    const handleSubmit = () => {
        if (!quiz) return;
        const total = quiz.length;
        const answered = Object.keys(userAnswers).length;
        if (answered < total) {
            Alert.alert("Chưa xong", `Bạn mới trả lời ${answered}/${total} câu!`);
            return;
        }
        setShowResult(true);
    };

    const getScoreMessage = (score, total) => {
        const percent = (score / total) * 10;
        if (percent >= 8) return "XUẤT SẮC! Giỏi quá bạn ơi! 🎉";
        if (percent >= 5) return "TỐT LẮM! Cố lên chút nữa là hoàn hảo! 💪";
        return "CỐ GẮNG HƠN NHA! Mình tin bạn làm được! 🔥";
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Gemini đang tạo đề cho bạn...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.title}>Trợ Lý Ôn Tập AI</Text>

            {/* Phần chọn môn + số câu + chủ đề */}
            <View style={styles.card}>
                <Text style={styles.label}>Chọn môn học</Text>
                <View style={styles.picker}>
                    <Picker
                        selectedValue={selectedSubject}
                        onValueChange={setSelectedSubject}
                    >
                        {subjectList.map(s => (
                            <Picker.Item key={s.value} label={s.label} value={s.value} />
                        ))}
                    </Picker>
                </View>

                <Text style={styles.label}>Số câu hỏi</Text>
                <View style={styles.row}>
                    {[5, 10].map(num => (
                        <TouchableOpacity
                            key={num}
                            style={[styles.countBtn, questionCount === num && styles.countBtnActive]}
                            onPress={() => setQuestionCount(num)}
                        >
                            <Text style={[styles.countText, questionCount === num && styles.countTextActive]}>
                                {num} câu
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Chủ đề ôn tập (tùy chọn)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ví dụ: React Hooks, Cơ sở dữ liệu..."
                    value={topicDetails}
                    onChangeText={setTopicDetails}
                />

                <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
                    <Text style={styles.generateText}>Tạo đề ôn tập {questionCount} câu</Text>
                </TouchableOpacity>
            </View>

            {/* Hiển thị đề thi */}
            {quiz && !showResult && (
                <View style={styles.card}>
                    <Text style={styles.quizTitle}>Ôn tập: {quiz.length} câu</Text>
                    {quiz.map((q, i) => {
                        const userAns = userAnswers[i];
                        return (
                            <View key={i} style={styles.questionCard}>
                                <Text style={styles.question}>{i + 1}. {q.question}</Text>
                                {q.options.map((opt, j) => {
                                    const letter = ['A', 'B', 'C', 'D'][j];
                                    const isSelected = userAns === opt;
                                    return (
                                        <TouchableOpacity
                                            key={j}
                                            style={[
                                                styles.option,
                                                isSelected && styles.optionSelected
                                            ]}
                                            onPress={() => handleAnswer(i, opt)}
                                        >
                                            <Text style={[
                                                styles.optionText,
                                                isSelected && styles.optionTextSelected
                                            ]}>
                                                {letter}. {opt}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        );
                    })}

                    <TouchableOpacity
                        style={[
                            styles.submitBtn,
                            Object.keys(userAnswers).length < quiz.length && styles.submitBtnDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={Object.keys(userAnswers).length < quiz.length}
                    >
                        <Text style={styles.submitText}>
                            NỘP BÀI ({Object.keys(userAnswers).length}/{quiz.length})
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Kết quả */}
            {/* ==================== KẾT QUẢ ÔN TẬP (CHỈ CÒN SỐ CÂU ĐÚNG + GIẢI THÍCH) ==================== */}
            {showResult && quiz && (
                <View style={styles.card}>
                    <Text style={styles.resultTitle}>Kết quả ôn tập</Text>

                    {(() => {
                        let correct = 0;
                        quiz.forEach((q, i) => {
                            const userAns = userAnswers[i];
                            // So sánh đúng chữ cái đầu (A, B, C, D)
                            if (userAns && userAns.charAt(0) === q.correctAnswer) {
                                correct++;
                            }
                        });

                        return (
                            <>
                                {/* Chỉ hiện số câu đúng - KHÔNG CÒN ĐIỂM % */}
                                <Text style={styles.correctCount}>
                                    Bạn trả lời đúng <Text style={styles.highlight}>{correct}</Text> / {quiz.length} câu
                                </Text>

                                {/* Động viên nhẹ nhàng, không dùng % */}
                                <Text style={styles.motivation}>
                                    {correct === quiz.length
                                        ? "HOÀN HẢO! Bạn nắm chắc kiến thức rồi!"
                                        : correct >= quiz.length * 0.7
                                            ? "RẤT TỐT! Bạn đang tiến bộ rõ rệt!"
                                            : correct >= quiz.length * 0.5
                                                ? "KHÁ LẮM! Cố lên chút nữa là giỏi rồi!"
                                                : "KHÔNG SAO ĐÂU! Mỗi lần làm là một lần học hỏi mà!"}
                                </Text>

                                {/* Giải thích chi tiết từng câu */}
                                <Text style={styles.reviewTitle}>Giải thích chi tiết</Text>
                                {quiz.map((q, i) => {
                                    const userAns = userAnswers[i];
                                    const isCorrect = userAns && userAns.charAt(0) === q.correctAnswer;

                                    return (
                                        <View key={i} style={styles.reviewItem}>
                                            <Text style={styles.reviewQuestion}>
                                                {i + 1}. {q.question}
                                            </Text>

                                            <Text style={[styles.reviewAnswer, isCorrect ? styles.correct : styles.wrong]}>
                                                Bạn chọn: <Text style={styles.bold}>{userAns || "Chưa chọn"}</Text>
                                                {' → '}Đáp án đúng: <Text style={styles.bold}>{q.correctAnswer}</Text>
                                            </Text>

                                            <View style={styles.explanationBox}>
                                                <Text style={styles.explanationTitle}>Giải thích:</Text>
                                                <Text style={styles.explanationText}>
                                                    {q.explanation || "Chưa có giải thích chi tiết."}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}

                                {/* 2 nút cuối */}
                                <TouchableOpacity
                                    style={styles.retryBtn}
                                    onPress={() => {
                                        setShowResult(false);
                                        setUserAnswers({});
                                    }}
                                >
                                    <Text style={styles.retryText}>Làm lại đề này</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.newQuizBtn} onPress={handleGenerate}>
                                    <Text style={styles.newQuizText}>Tạo đề mới</Text>
                                </TouchableOpacity>
                            </>
                        );
                    })()}
                </View>
            )}
        </ScrollView>
    );
}

// styles/AIScreenStyles.js

export const styles = StyleSheet.create({
    // Layout chính
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        marginBottom: 100
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },

    // Tiêu đề
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 20,
        color: '#1e293b'
    },

    // Card container
    card: {
        backgroundColor: '#fff',
        margin: 15,
        padding: 20,
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8
    },

    // Form elements
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 8
    },
    picker: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        marginBottom: 16
    },
    input: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 14,
        backgroundColor: '#f8fafc',
        marginBottom: 20
    },

    // Row layout
    row: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16
    },

    // Nút số câu hỏi
    countBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#e2e8f0'
    },
    countBtnActive: {
        backgroundColor: '#2563eb'
    },
    countText: {
        fontWeight: 'bold',
        color: '#475569'
    },
    countTextActive: {
        color: '#fff'
    },

    // Nút tạo đề
    generateBtn: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    generateText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },

    // Phần đề thi
    quizTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#1e293b'
    },
    questionCard: {
        marginBottom: 20,
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12
    },
    question: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#1e293b'
    },

    // Lựa chọn đáp án
    option: {
        padding: 14,
        marginVertical: 6,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    optionSelected: {
        backgroundColor: '#dbeafe',
        borderColor: '#3b82f6'
    },
    optionText: {
        fontSize: 15,
        color: '#1e293b'
    },
    optionTextSelected: {
        fontWeight: 'bold',
        color: '#1d4ed8'
    },

    // Nút nộp bài
    submitBtn: {
        backgroundColor: '#10b981',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10
    },
    submitBtnDisabled: {
        backgroundColor: '#94a3b8'
    },
    submitText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    },

    // Kết quả
    resultTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#1e293b'
    },
    bigScore: {
        fontSize: 48,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#2563eb'
    },
    motivation: {
        fontSize: 20,
        textAlign: 'center',
        marginVertical: 20,
        fontWeight: '600',
        color: '#059669'
    },

    // Xem lại đáp án
    reviewTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: '#1e293b'
    },
    reviewItem: {
        padding: 12,
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        marginVertical: 6
    },
    reviewQuestion: {
        fontWeight: '600',
        marginBottom: 4
    },
    reviewAnswer: {
        color: '#16a34a'
    },
    correct: {
        color: '#16a34a'
    },
    wrong: {
        color: '#dc2626'
    },

    // Các nút hành động kết quả
    retryBtn: {
        backgroundColor: '#f59e0b',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },
    newQuizBtn: {
        backgroundColor: '#2563eb',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10
    },
    newQuizText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16
    },

    // Loading
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: '#475569'
    },

    correctCount: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#2563eb',
        marginVertical: 20,
    },
    highlight: {
        fontSize: 36,
        color: '#1d4ed8',
    },
    motivation: {
        fontSize: 19,
        textAlign: 'center',
        marginVertical: 20,
        lineHeight: 28,
        color: '#059669',
        fontWeight: '600',
    },
    reviewTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        marginTop: 30,
        marginBottom: 16,
        color: '#1e293b',
    },
    reviewItem: {
        padding: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    reviewQuestion: {
        fontWeight: '600',
        marginBottom: 8,
        color: '#1e293b',
        fontSize: 16,
    },
    reviewAnswer: {
        marginBottom: 12,
        fontSize: 15.5,
    },
    bold: {
        fontWeight: 'bold',
        color: '#1e40af',
    },
    correct: { color: '#16a34a' },
    wrong: { color: '#dc2626' },
    explanationBox: {
        backgroundColor: '#ecfdf5',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 5,
        borderLeftColor: '#10b981',
        marginTop: 10,
    },
    explanationTitle: {
        fontWeight: 'bold',
        color: '#059669',
        marginBottom: 6,
    },
    explanationText: {
        color: '#065f46',
        lineHeight: 23,
    },
    correctCount: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#2563eb',
    },
    highlight: {
        fontSize: 18,
        color: '#1d4ed8',
    },
});