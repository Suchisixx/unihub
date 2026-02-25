import { useState, useContext } from 'react';
import { AuthContext } from '../context/authContext';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function SignUpScreen({ onLogin }) {
    const { register } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSignUp = async () => {
        // Kiểm tra email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Email không đúng định dạng');
            return;
        }

        // Kiểm tra password
        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        // Kiểm tra username không rỗng
        if (!username.trim()) {
            setError('Vui lòng nhập username');
            return;
        }

        if (!username.trim() || !email.trim() || !password.trim()) {
            setError('Vui lòng điền thông tin');
            return;
        }
        try {
            setError('');
            await register(username, email, password);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>U</Text></View>
                    <Text style={styles.title}>UniHub</Text>
                    {/* <Text style={styles.subtitle}>Trợ lý cá nhân sinh viên</Text> */}
                    <Text style={styles.heading}>Đăng ký</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="nhập tên người dùng của bạn"
                            value={username}
                            onChangeText={setUsername}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="nhập email của bạn"
                            type="email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mật khẩu</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập mật khẩu của bạn"
                            type="password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                        <Text style={styles.buttonText}>Đăng ký</Text>
                    </TouchableOpacity>
                    <View style={styles.loginRow}>
                        <Text style={styles.loginText}>Đã có tài khoản? </Text>
                        <TouchableOpacity onPress={onLogin}>
                            <Text style={styles.loginLink}>Đăng nhập</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView >
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e0ecff',
        minHeight: '100%',
        paddingVertical: 32,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 32,
        minWidth: 320,
        maxWidth: 360,
        width: '90%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 2,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    avatarText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        color: '#6b7280',
        fontSize: 14,
        marginBottom: 24,
    },
    heading: {
        fontWeight: '600',
        fontSize: 18,
        marginBottom: 16,
    },
    inputGroup: {
        width: '100%',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        marginBottom: 4,
    },
    input: {
        width: '100%',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        fontSize: 15,
        backgroundColor: '#f9fafb',
    },
    errorText: {
        marginBottom: 6,
        color: '#ef4444',
    },
    button: {
        width: '100%',
        backgroundColor: '#2563eb',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginBottom: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    loginRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    loginText: {
        fontSize: 14,
    },
    loginLink: {
        color: '#2563eb',
        fontSize: 14,
        fontWeight: 'bold',
    },
});