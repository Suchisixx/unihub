// context/ExpenseContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../services/api';
import { AuthContext } from './authContext';

export const ExpenseContext = createContext();

export const ExpenseProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [summary, setSummary] = useState({ balance: 0, income: 0, expense: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);

    // Chuẩn hoá category về định dạng thống nhất
    const normalizeCategories = (rawCategories = []) => {
        return rawCategories.map(cat => ({
            cate_id: cat.cate_id ?? cat.id ?? cat.value ?? null,
            name: cat.name ?? cat.category_name ?? cat.label ?? 'Không tên',
            type: cat.type ?? cat.category_type ?? cat.kind ?? 'chi', // mặc định 'chi'
            color: cat.color ?? '#93C5FD',
            icon: cat.icon ?? 'Circle', // fallback icon
        }));
    };

    // Fetch tất cả dữ liệu tài chính
    const fetchFinanceData = useCallback(async () => {
        if (!user) {
            setTransactions([]);
            setSummary({ balance: 0, income: 0, expense: 0 });
            setCategories([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await apiGet('/api/expenses/data');

            const normalizedCats = normalizeCategories(response?.categories || []);

            setSummary(response?.summary || { balance: 0, income: 0, expense: 0 });

            // QUAN TRỌNG: Chuẩn hóa description ở đây!
            setTransactions((response?.transactions || []).map(t => ({
                ...t,
                description: t.description || t.note || t.memo || t.details || t.content || '',
            })));

            setCategories(normalizedCats);
        } catch (err) {
            console.error('Lỗi fetchFinanceData:', err);
            setError(err.message || 'Không thể tải dữ liệu tài chính');
            setTransactions([]);
            setSummary({ balance: 0, income: 0, expense: 0 });
            setCategories([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // CRUD
    const addTransaction = async (transactionData) => {
        try {
            const res = await apiPost('/api/expenses', transactionData);
            await fetchFinanceData();
            return res;
        } catch (err) {
            setError(err.message || 'Lỗi khi thêm giao dịch');
            throw err;
        }
    };

    const updateTransaction = async (transId, transactionData) => {
        try {
            const res = await apiPut(`/api/expenses/${transId}`, transactionData);
            await fetchFinanceData();
            return res;
        } catch (err) {
            setError(err.message || 'Lỗi khi cập nhật giao dịch');
            throw err;
        }
    };

    const deleteTransaction = async (transId) => {
        try {
            const res = await apiDelete(`/api/expenses/${transId}`);
            await fetchFinanceData();
            return res;
        } catch (err) {
            setError(err.message || 'Lỗi khi xóa giao dịch');
            throw err;
        }
    };

    // Khởi tạo dữ liệu khi user đăng nhập
    useEffect(() => {
        fetchFinanceData();
    }, [fetchFinanceData]);

    return (
        <ExpenseContext.Provider
            value={{
                transactions,
                categories,
                summary,
                loading,
                error,
                fetchFinanceData,
                addTransaction,
                updateTransaction,
                deleteTransaction,
                clearError: () => setError(null),
            }}
        >
            {children}
        </ExpenseContext.Provider>
    );
};

export const useExpenses = () => {
    const context = useContext(ExpenseContext);
    if (!context) throw new Error('useExpenses phải nằm trong ExpenseProvider');
    return context;
};
