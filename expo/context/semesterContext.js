import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import { AuthContext } from './authContext';

export const SemesterContext = createContext();

export const SemesterProvider = ({ children }) => {
    const [years, setYears] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { user } = useContext(AuthContext);


    //  FETCH DATA 
    const fetchYearsAndSemesters = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiGet('/api/year-semester');
            const fetchedYears = response?.data || [];
            setYears(fetchedYears);

            // Gom toàn bộ học kỳ
            const allSemesters = fetchedYears.flatMap(y =>
                (y.semesters || []).map(s => ({ ...s, year_name: y.name }))
            );

            // Ưu tiên học kỳ có is_current = 1
            const currentSem = allSemesters.find(s => s.is_current === 1) || null;

            setSelectedSemester(currentSem);
            return fetchedYears;
        } catch (err) {
            console.error("Lỗi fetchYearsAndSemesters:", err);
            setError(err);
            setYears([]);
            setSelectedSemester(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchYearsOnly = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await apiGet('/api/year-semester/years');
            const fetchedYears = response?.data || [];
            setYears(fetchedYears);
            return fetchedYears;
        } catch (err) {
            setError(err);
            setYears([]);
        } finally {
            setLoading(false);
        }
    };


    // CRUD NĂM & HỌC KỲ
    const addYear = async (name) => {
        const response = await apiPost('/api/year-semester/year', { name });
        if (response.success) await fetchYearsAndSemesters();
        return response;
    };

    const updateYear = async (yearId, name) => {
        const response = await apiPut(`/api/year-semester/year/${yearId}`, { name });
        if (response.success) await fetchYearsAndSemesters();
        return response;
    };

    const deleteYear = async (yearId) => {
        try {
            const response = await apiDelete(`/api/year-semester/year/${yearId}`);

            // CHỈ GỌI fetchYearsAndSemesters() NẾU API TRẢ VỀ JSON HỢP LỆ
            if (response && response.success) {
                // Ép cập nhật state ngay lập tức (không phụ thuộc vào fetch)
                setYears(prev => prev.filter(y => y.year_id !== yearId));

                // Nếu năm bị xóa là năm hiện tại → reset selectedSemester
                if (selectedSemester && selectedSemester.year_id === yearId) {
                    setSelectedSemester(null);
                }
            }

            return response;
        } catch (err) {
            console.error("Lỗi deleteYear:", err);
            throw err;
        }
    };

    const addSemester = async (yearId, name) => {
        const response = await apiPost('/api/year-semester/semester', { year_id: yearId, name });
        if (response.success) await fetchYearsAndSemesters();
        return response;
    };

    const updateSemester = async (semId, name) => {
        const response = await apiPut(`/api/year-semester/semester/${semId}`, { name });
        if (response.success) await fetchYearsAndSemesters();
        return response;
    };

    const deleteSemester = async (semId) => {
        try {
            const response = await apiDelete(`/api/year-semester/semester/${semId}`);

            if (response && response.success) {
                // Cập nhật state ngay → không cần fetch lại (tránh lỗi HTML)
                setYears(prev => prev.map(year => ({
                    ...year,
                    semesters: year.semesters?.filter(s => s.sem_id !== semId) || []
                })).filter(year => year.semesters?.length > 0)); // xóa năm nếu không còn kỳ nào

                // Nếu học kỳ bị xóa là hiện tại → reset
                if (selectedSemester?.sem_id === semId) {
                    setSelectedSemester(null);
                }
            }

            return response;
        } catch (err) {
            console.error("Lỗi deleteSemester:", err);
            throw err;
        }
    };

    // HANDLE CURRENT SEMESTER
    const handleSelectionChange = async (yearId, semId) => {
        try {
            // 1. Gửi API lên server để set is_current = 1
            await apiPost("/api/year-semester/semester/set-current", { sem_id: semId });

            // 2. Refresh lại toàn bộ dữ liệu để lấy đúng is_current mới
            await fetchYearsAndSemesters();

            console.log("✔ Đã đặt học kỳ hiện tại:", semId);
        } catch (err) {
            console.error("Lỗi handleSelectionChange:", err);
        }
    };

    // AUTO FETCH KHI LOGIN
    useEffect(() => {
        if (user) {
            fetchYearsAndSemesters();
        } else {
            setYears([]);
            setSelectedSemester(null);
            setLoading(false);
            setError(null);
        }
    }, [user]);


    return (
        <SemesterContext.Provider value={{
            years,
            selectedSemester,
            setSelectedSemester: handleSelectionChange,
            loading,
            error,
            fetchYearsAndSemesters,
            fetchYearsOnly,
            addYear,
            updateYear,
            deleteYear,
            addSemester,
            updateSemester,
            deleteSemester,
        }}>
            {children}
        </SemesterContext.Provider>
    );
};

export const useSemester = () => useContext(SemesterContext);
