import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiGet, apiPost, apiDelete } from '../services/api';

export const CampusContext = createContext();

export const CampusProvider = ({ children }) => {
    const [campuses, setCampuses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCampuses = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiGet('/api/campuses');
            const list = res?.campuses || res?.data || [];
            setCampuses(list);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const createCampus = async (campusData) => {
        const res = await apiPost('/api/campuses', campusData);
        await fetchCampuses();
        return res;
    };

    const deleteCampus = async (id) => {
        try {
            setLoading(true);
            const res = await apiDelete(`/api/campuses/${id}`);
            if (res.success) {
                setCampuses(prev => prev.filter(c => c.cam_id !== id));
            }
            return res;
        } catch (err) {
            console.error("Lỗi xóa campus:", err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampuses();
    }, []);

    return (
        <CampusContext.Provider value={{ campuses, loading, error, fetchCampuses, createCampus, deleteCampus }}>
            {children}
        </CampusContext.Provider>
    );
};

export const useCampuses = () => useContext(CampusContext);