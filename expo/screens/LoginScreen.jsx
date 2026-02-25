import { useState, useContext } from 'react';
import { AuthContext } from '../context/authContext';
import { KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function LoginScreen({ onSignUp }) {
    const { login } = useContext(AuthContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            await login(email, password);
        } catch (err) {
            Alert.alert('Lỗi', err.message);
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
                    <Text style={styles.subtitle}>Trợ lý cá nhân sinh viên</Text>

                    <Text style={styles.heading}>Đăng nhập</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="nhập email của bạn"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mật khẩu</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nhập mật khẩu của bạn"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                        />
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleLogin}>
                        <Text style={styles.buttonText}>Đăng nhập</Text>
                    </TouchableOpacity>

                    <Text style={styles.orText}>────────── HOẶC ──────────</Text>

                    <View style={styles.loginRow}>
                        <Text style={styles.loginText}>Chưa có tài khoản? </Text>
                        <TouchableOpacity onPress={onSignUp}>
                            <Text style={styles.loginLink}>Đăng ký ngay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#F5F5F5",
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 24,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },

    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#2563EB",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginBottom: 10,
    },

    avatarText: {
        color: "#fff",
        fontSize: 32,
        fontWeight: "bold",
    },

    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#111",
        textAlign: "center",
        marginBottom: 4,
    },

    subtitle: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 20,
    },

    heading: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 16,
        color: "#222",
        textAlign: "center",
    },

    inputGroup: {
        marginBottom: 14,
    },

    label: {
        fontSize: 14,
        color: "#374151",
        marginBottom: 4,
    },

    input: {
        height: 48,
        backgroundColor: "#F3F4F6",
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 15,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },

    button: {
        backgroundColor: "#2563EB",
        paddingVertical: 14,
        borderRadius: 10,
        marginTop: 8,
        marginBottom: 20,
    },

    buttonText: {
        color: "#fff",
        textAlign: "center",
        fontSize: 16,
        fontWeight: "600",
    },

    orText: {
        textAlign: "center",
        color: "#aaa",
        marginBottom: 16,
        fontSize: 12,
    },

    loginRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 10,
    },

    loginText: {
        fontSize: 14,
        color: "#444",
    },

    loginLink: {
        color: "#2563EB",
        fontWeight: "600",
        fontSize: 14,
    },
});
