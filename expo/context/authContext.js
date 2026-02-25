import React, { createContext, useState, useEffect } from "react";
import { login as loginService, register as registerService } from "../services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAutoLogin();
    }, []);

    // check auto-login khi mở app
    const checkAutoLogin = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userData = await AsyncStorage.getItem('user'); // 

            if (token && userData) {
                // Có token và user đã lưu → auto set user
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error('Kiểm tra Auth:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await loginService(email, password);
            setUser(response.user);
            await AsyncStorage.setItem('token', response.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.user)); // lưu user luôn
        } catch (error) {
            Alert.alert('Lỗi đăng nhập', error.message || 'Lỗi khi đăng nhập');
        }
    };

    const register = async (username, email, password) => {
        try {
            await registerService(username, email, password);
            Alert.alert('Đăng ký thành công', 'Bạn có thể đăng nhập ngay bây giờ');
        } catch (error) {
            Alert.alert('Lỗi đăng ký', error.message || 'Lỗi khi đăng ký');
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.multiRemove(['token', 'user']);
            setUser(null);
        } catch (error) {
            console.error('Lỗi logout:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};
