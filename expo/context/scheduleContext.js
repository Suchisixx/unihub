// context/scheduleContext.js
import * as Notifications from 'expo-notifications';
import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from "react";
import { apiGet, apiPost, apiPut, apiDelete, apiPostFormData } from "../services/api";
import { SemesterContext } from './semesterContext'; // Import context, không phải hook
import { AuthContext } from "./authContext";
import { registerForNotificationsAsync, checkAndNotifyTodaySchedules } from '../services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ScheduleContext = createContext();

export const ScheduleProvider = ({ children }) => {
    // Giữ nguyên lt/th và schedules tổng hợp
    const [ltSchedules, setLtSchedules] = useState([]);
    const [thSchedules, setThSchedules] = useState([]);
    const schedules = useMemo(() => [...ltSchedules, ...thSchedules], [ltSchedules, thSchedules]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { user } = useContext(AuthContext);

    const { selectedSemester } = useContext(SemesterContext);

    // Hàm fetch đã rút gọn (không cần xử lý currentWeek/status)
    const fetchSchedules = useCallback(async (sem_id) => {
        if (!sem_id) {
            setLtSchedules([]);
            setThSchedules([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await apiGet(`/api/schedules/semester/${sem_id}`);
            const rows = response?.schedules || [];

            setLtSchedules(rows
                .filter(s => s.type === 'lt')
                .map(s => ({ ...s, _refreshKey: Date.now() })) // thêm key ảo ép re-render
            );

            setThSchedules(rows
                .filter(s => s.type === 'th')
                .map(s => ({ ...s, _refreshKey: Date.now() }))
            );

            console.log(`ScheduleContext: Lấy lịch học thành công (${rows.length} môn)`);

            // kiểm tra xem người dùng có bật thông báo không
            const enabled = await AsyncStorage.getItem('schedule_reminder_enabled');

            if (enabled === 'true') {
                const granted = await registerForNotificationsAsync();
                if (granted) {
                    // Trước khi set thông báo mới, xoá hết thông báo cũ
                    await Notifications.cancelAllScheduledNotificationsAsync();
                    console.log('♻️ Xoá tất cả thông báo cũ để tránh trùng.');

                    // Set lại thông báo cho hôm nay
                    await checkAndNotifyTodaySchedules(rows);
                }
            } else {
                // Nếu user tắt thông báo thì clear và xoá luôn noti cũ
                await Notifications.cancelAllScheduledNotificationsAsync();
                console.log('🔕 User tắt thông báo — xoá hết lịch thông báo cũ.');
            }
        } catch (err) {
            console.error("Lỗi fetch schedules:", err.message);
            setError(err);
            setLtSchedules([]);
            setThSchedules([]);
        } finally {
            setLoading(false);
        }
    }, [setLtSchedules, setThSchedules, setLoading, setError]);

    // useEffect lắng nghe selectedSemester giữ nguyên
    useEffect(() => {
        const currentSemId = selectedSemester?.sem_id;

        if (user) {
            if (currentSemId) {
                console.log(`ScheduleContext: User đã đăng nhập. Lấy lịch học của ${selectedSemester.name}...`);
                fetchSchedules(currentSemId);
            } else {
                // Log nếu user đăng nhập nhưng chưa có học kỳ
                console.log(`ScheduleContext: User đã đăng nhập, nhưng chưa có học kì được chọn.`);
                setLtSchedules([]); setThSchedules([]);
            }
        } else {
            // LOG NÀY CHỈ XẢY RA KHI CHƯA ĐĂNG NHẬP
            console.log(`ScheduleContext: User CHƯA đăng nhập. Làm sạch lịch học.`);
        }
    }, [selectedSemester, user, fetchSchedules]);

    // Các hàm CRUD giữ nguyên logic gọi API và fetch lại
    const addSchedule = async (scheduleData) => {
        // setLoading(true); // Có thể thêm loading cục bộ nếu muốn
        try {
            const result = await apiPost("/api/schedules", scheduleData);
            if (selectedSemester?.sem_id) {
                await fetchSchedules(selectedSemester.sem_id); // Fetch lại
            }
            return result; // Trả về kết quả từ API (vd: { insertId: ... })
        } catch (error) { /*...*/ throw error; }
        // finally { setLoading(false); }
    };

    const updateSchedule = async (schedule_id, scheduleData) => {
        // setLoading(true);
        try {
            await apiPut(`/api/schedules/${schedule_id}`, scheduleData);
            if (selectedSemester?.sem_id) {
                await fetchSchedules(selectedSemester.sem_id); // Fetch lại
            }
            return true;
        } catch (error) { throw error; }
    };

    const deleteSchedule = async (schedule_id) => {
        // setLoading(true);
        try {
            await apiDelete(`/api/schedules/${schedule_id}`);
            if (selectedSemester?.sem_id) {
                await fetchSchedules(selectedSemester.sem_id); // Fetch lại
            }
            return true;
        } catch (error) { throw error; }
    };

    const importSchedules = async (fileObject) => {
        setLoading(true);
        try {
            if (!selectedSemester?.sem_id) {
                throw new Error("Chưa chọn học kỳ");
            }

            const formData = new FormData();

            formData.append('file', {
                uri: fileObject.uri,
                name: fileObject.name || 'schedule.csv',
                type: fileObject.type || 'text/csv'
            });

            formData.append('sem_id', selectedSemester.sem_id.toString());
            formData.append('confirm', 'true');

            console.log('Gửi import request...', {
                sem_id: selectedSemester.sem_id,
                file: fileObject.name
            });

            console.log(' Debug FormData:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            // Dùng apiPostFormData thay vì apiPost
            const result = await apiPostFormData("/api/schedules/import", formData);

            console.log(' Kết quả import:', result);

            if (result.success) {
                if (selectedSemester?.sem_id) {
                    await fetchSchedules(selectedSemester.sem_id);
                }
                return result;
            } else {
                throw new Error(result.message || 'Import thất bại');
            }

        } catch (error) {
            console.error(' Lỗi import từ file:', error);
            setError(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScheduleContext.Provider
            value={{
                ltSchedules,    // Danh sách LT
                thSchedules,    // Danh sách TH
                schedules,      // Danh sách tổng hợp
                loading,        // Loading fetch
                error,          // Lỗi fetch
                // Bỏ currentWeek
                fetchSchedules,
                addSchedule,
                updateSchedule,
                deleteSchedule,
                importSchedules,
            }}>
            {children}
        </ScheduleContext.Provider>
    );
}

export const useSchedules = () => useContext(ScheduleContext);