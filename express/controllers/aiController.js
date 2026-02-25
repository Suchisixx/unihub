import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.API_GEMINI_KEY);

// express/controllers/aiController.js
export const generateQuiz = async (req, res) => {
    const { subjectName, topicDetails = "", questionCount = 10 } = req.body; // THÊM questionCount
    const user_id = req.user?.id;

    if (!user_id || !subjectName) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin môn học" });
    }

    // Ép về số, mặc định 10, giới hạn 5-20 để tránh AI lag
    const count = Math.max(5, Math.min(20, parseInt(questionCount) || 10));

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash" // Dùng cái mạnh + ổn định nhất
        });

        const prompt = `Bạn là giáo viên đại học cực kỳ giỏi và tận tâm. Hãy tạo đúng ${count} câu hỏi trắc nghiệm về môn "${subjectName}"${topicDetails ? `, tập trung vào: "${topicDetails}"` : ''}. Mỗi câu có đúng 4 đáp án A/B/C/D, chỉ 1 đáp án đúng.

TRẢ VỀ CHỈ JSON THUẦN, KHÔNG markdown, KHÔNG text thừa, đúng định dạng sau:

[
  {
    "id": 1,
    "question": "React là gì?",
    "options": ["A. Framework đầy đủ", "B. Thư viện JavaScript", "C. Ngôn ngữ lập trình", "D. Công cụ build"],
    "correctAnswer": "B",
    "explanation": "React là một thư viện JavaScript do Facebook phát triển, dùng để xây dựng giao diện người dùng, không phải framework đầy đủ như Angular."
  }
]

Bắt đầu tạo ngay!`.trim();

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();

        // Xử lý ```json
        if (responseText.includes("```")) {
            responseText = responseText.replace(/```json|```/g, "").trim();
        }

        let quiz = JSON.parse(responseText);

        // Đảm bảo đúng số lượng câu (AI hay trả thừa/thiếu)
        if (Array.isArray(quiz)) {
            quiz = quiz.slice(0, count);
            quiz.forEach((q, i) => q.id = i + 1); // Đánh lại id cho chắc
        }

        res.json({ success: true, quiz });

    } catch (error) {
        console.error("Lỗi Gemini:", error.message);
        res.status(500).json({
            success: false,
            message: "AI đang bận, thử lại sau 5s nha bro!"
        });
    }
};