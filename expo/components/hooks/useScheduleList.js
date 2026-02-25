// screens/Schedule/hooks/useScheduleList.js
import { useMemo } from 'react';
import { dayName } from '../utils/dateUtils';

export const useScheduleList = (activeTab, ltSchedules, thSchedules) => {
    const listData = activeTab === 'lt' ? ltSchedules : thSchedules;

    const sections = useMemo(() => {
        const map = {};
        (listData || []).forEach(item => {
            const d = Number(item.day_of_week) || 1;
            if (!map[d]) map[d] = [];
            map[d].push(item);
        });
        const arr = Object.keys(map).map(k => {
            const items = map[k].sort((a, b) => {
                if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
                return 0;
            });
            return { day: Number(k), data: items };
        });
        arr.sort((a, b) => a.day - b.day);
        return arr.map(s => ({ title: dayName(s.day), day: s.day, data: s.data }));
    }, [listData]);

    return { sections };
};