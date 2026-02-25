import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import { useSemester } from './semesterContext';

const NoteContext = createContext();
export const useNotes = () => useContext(NoteContext);

export const NoteProvider = ({ children }) => {
    const [notes, setNotes] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { selectedSemester } = useSemester();

    // Hàm giúp ép React re-render khi dữ liệu "giống nhau"
    const createNewArray = (arr) => {
        return arr.map(item => ({ ...item, _cacheKey: Date.now() + Math.random() }));
    };

    // --- Lấy danh sách môn học ---
    const fetchSubjects = useCallback(async (sem_id) => {
        if (!sem_id) {
            setSubjects([]);
            return;
        }
        try {
            setLoading(true);
            const res = await apiGet(`/api/notes/subjects/${sem_id}`);
            const data = Array.isArray(res.data) ? res.data : [];
            // ÉP TẠO MẢNG MỚI + OBJECT MỚI → React bắt buộc re-render
            setSubjects(createNewArray(data));
        } catch (err) {
            console.error('Lỗi fetchSubjects:', err);
            setSubjects([]);
            setError(err.message || 'Không thể lấy danh sách môn học');
        } finally {
            setLoading(false);
        }
    }, []);

    // --- Lấy danh sách ghi chú ---
    const fetchNotes = useCallback(async (sem_id) => {
        if (!sem_id) {
            setNotes([]);
            return;
        }
        try {
            setLoading(true);
            const res = await apiGet(`/api/notes/${sem_id}`);
            const rawNotes = Array.isArray(res.data) ? res.data : [];

            const safeNotes = rawNotes.map(n => ({
                note_id: n.note_id,
                sub_id: n.sub_id,
                title: n.title || '(Không tiêu đề)',
                content: n.content || '',
                created_at: n.created_at,
                updated_at: n.updated_at,
                subject_name: n.subject_name || 'Chưa có môn',
                _cacheKey: Date.now() + Math.random() // ÉP React thấy thay đổi
            }));

            // Dùng callback để đảm bảo luôn có reference mới
            setNotes(prev => {
                // Nếu giống hệt thì vẫn ép render bằng cách trả mảng mới
                return [...safeNotes];
            });
        } catch (err) {
            console.error('Lỗi fetchNotes:', err);
            setNotes([]);
            setError(err.message || 'Không thể lấy ghi chú');
        } finally {
            setLoading(false);
        }
    }, []);

    // --- THÊM GHI CHÚ ---
    const addNote = async (data) => {
        try {
            await apiPost('/api/notes/note', data);
            await fetchNotes(data.sem_id); // Tự động reload
            await fetchSubjects(data.sem_id); // Cập nhật luôn danh sách môn (nếu cần)
        } catch (err) {
            console.error('Lỗi addNote:', err);
            throw err;
        }
    };

    // --- CẬP NHẬT GHI CHÚ ---
    const updateNote = async (note_id, data) => {
        try {
            await apiPut(`/api/notes/note/${note_id}`, data);
            await fetchNotes(data.sem_id);
            await fetchSubjects(data.sem_id);
        } catch (err) {
            console.error('Lỗi updateNote:', err);
            throw err;
        }
    };

    // --- XÓA GHI CHÚ ---
    const deleteNote = async (note_id, sem_id) => {
        try {
            await apiDelete(`/api/notes/note/${note_id}`);
            await fetchNotes(sem_id);     // Reload ghi chú
            await fetchSubjects(sem_id);  // Reload môn học (rất quan trọng nếu xóa môn!)
        } catch (err) {
            console.error('Lỗi deleteNote:', err);
            throw err;
        }
    };

    // --- Auto load khi đổi học kỳ ---
    useEffect(() => {
        const sem_id = selectedSemester?.sem_id;
        if (sem_id) {
            fetchSubjects(sem_id);
            fetchNotes(sem_id);
        } else {
            setNotes([]);
            setSubjects([]);
        }
    }, [selectedSemester]);

    return (
        <NoteContext.Provider
            value={{
                notes,
                subjects,
                loading,
                error,
                fetchNotes,
                fetchSubjects,
                addNote,
                updateNote,
                deleteNote,
            }}
        >
            {children}
        </NoteContext.Provider>
    );
};