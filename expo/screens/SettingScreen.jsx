// screens/SettingScreen.js
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/authContext';
import { useSemester } from '../context/semesterContext';
import { useSchedules } from '../context/scheduleContext';
import {
    registerForNotificationsAsync,
    checkAndNotifyTodaySchedules,
    testNotification
} from '../services/notificationService';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Alert, Switch
} from 'react-native';
import {
    LogOut, User, Mail, Calendar, Bell, Brain, Sparkles
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import * as Notifications from 'expo-notifications';

const IS_ENABLED_KEY = 'schedule_reminder_enabled';

export default function SettingScreen({ setCurrentScreen }) {
    const { user, logout } = useContext(AuthContext);
    const { schedules } = useSchedules();
    const { selectedSemester } = useSemester();

    const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
    const { username, email, created_at } = user || {};
    const formattedDate = created_at ? dayjs(created_at).format('DD/MM/YYYY') : 'N/A';

    // load setting ban đầu
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedEnabled = await AsyncStorage.getItem(IS_ENABLED_KEY);
                if (savedEnabled !== null) {
                    setIsNotificationEnabled(savedEnabled === 'true');
                }
            } catch (err) {
                console.error('Lỗi loadSettings:', err);
            }
        };
        loadSettings();
    }, []);

    // đồng bộ thông báo khi bật/tắt hoặc khi lịch thay đổi
    useEffect(() => {
        const syncNotifications = async () => {
            if (!schedules || schedules.length === 0) return;
            if (isNotificationEnabled) {
                const granted = await registerForNotificationsAsync();
                if (!granted) return;
                await checkAndNotifyTodaySchedules(schedules);
            } else {
                await Notifications.cancelAllScheduledNotificationsAsync();
                console.log('🔕 Tắt thông báo — đã huỷ hết thông báo cũ.');
            }
        };
        syncNotifications();
    }, [isNotificationEnabled, schedules]);

    const toggleNotificationEnabled = async (value) => {
        setIsNotificationEnabled(value);
        await AsyncStorage.setItem(IS_ENABLED_KEY, String(value));
        console.log('⚙️ Thay đổi bật/tắt thông báo:', value);
    };

    const handleLogout = () => {
        Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
            { text: "Huỷ", style: "cancel" },
            { text: "Đăng xuất", onPress: logout, style: "destructive" }
        ]);
    };

    const handleNavigateToAIScreen = () => {
        if (typeof setCurrentScreen === 'function') {
            setCurrentScreen('ai');
        } else {
            console.error("setCurrentScreen không khả dụng.");
        }
    };

    const semesterInfo = selectedSemester
        ? `${selectedSemester.name} (${selectedSemester.year_name})`
        : "Chưa chọn học kỳ";

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

            {/* Thông tin tài khoản */}
            <View style={styles.card}>
                <View style={styles.row}>
                    <User size={20} color="#2196F3" />
                    <Text style={styles.cardTitle}>Thông tin tài khoản</Text>
                </View>

                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{username?.[0]?.toUpperCase() || 'U'}</Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{username}</Text>
                        <View style={styles.row}>
                            <Mail size={14} color="#666" style={{ marginRight: 4 }} />
                            <Text style={styles.profileEmail}>{email}</Text>
                        </View>
                        <Text style={styles.profileJoinDate}>Đã tham gia: {formattedDate}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* NÚT ÔN TẬP AI - ĐÃ ĐƯỢC THIẾT KẾ LẠI */}
                <TouchableOpacity
                    style={styles.aiButton}
                    onPress={handleNavigateToAIScreen}
                    activeOpacity={0.8}
                >
                    <View style={styles.aiButtonContent}>
                        <View style={styles.aiIconContainer}>
                            <Brain size={24} color="#7C3AED" />
                            <Sparkles
                                size={16}
                                color="#7C3AED"
                                style={styles.sparkleIcon}
                            />
                        </View>
                        <View style={styles.aiTextContainer}>
                            <Text style={styles.aiButtonTitle}>Ôn tập môn học theo AI</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut size={18} color="#FF3B30" />
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>
            </View>

            {/* Cài đặt thông báo */}
            <View style={styles.card}>

                <View style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                        <Bell
                            size={20}
                            color={isNotificationEnabled ? "#10B981" : "#9CA3AF"}
                            style={{ marginRight: 12 }}
                        />
                        <Text style={styles.settingText}>Bật thông báo lịch học</Text>
                    </View>
                    <Switch
                        trackColor={{ false: "#E5E7EB", true: "#D1FAE5" }}
                        thumbColor={isNotificationEnabled ? "#10B981" : "#F4F4F5"}
                        onValueChange={toggleNotificationEnabled}
                        value={isNotificationEnabled}
                    />
                </View>

                <View style={styles.statusRow}>
                    <Calendar size={18} color="#6B7280" style={{ marginRight: 8 }} />
                    <Text style={styles.semesterStatusText}>{semesterInfo}</Text>
                </View>

                <Text style={isNotificationEnabled ? styles.activeReminderText : styles.inactiveReminderText}>
                    {isNotificationEnabled ? "Thông báo đang bật." : "Thông báo lịch học đang tắt."}
                </Text>

                <TouchableOpacity onPress={testNotification} style={{ marginVertical: 8 }}>
                    <Text>🔔 Test thông báo</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>UniHub v1.0.0</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16, marginBottom: 100 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
    },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginLeft: 8 },
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: '#2196F3',
        alignItems: 'center', justifyContent: 'center', marginRight: 12
    },
    avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 16, fontWeight: 'bold', color: '#222', marginBottom: 2 },
    profileEmail: { fontSize: 14, color: '#666', marginBottom: 2 },
    profileJoinDate: { fontSize: 12, color: '#888' },

    // NÚT AI MỚI - ĐẸP VÀ NỔI BẬT
    aiButton: {
        backgroundColor: '#F8FAFF',
        borderRadius: 12,
        padding: 8,
        borderWidth: 2,
        borderColor: '#017afcff',
        marginVertical: 0,
    },
    aiButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    aiIconContainer: {
        position: 'relative',
        backgroundColor: '#EDE9FE',
        borderRadius: 10,
        marginRight: 12,
    },
    sparkleIcon: {
        position: 'absolute',
        top: -4,
        right: -4,
    },
    aiTextContainer: {
        flex: 1,
    },
    aiButtonTitle: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    aiButtonSubtitle: {
        fontSize: 14,
        color: '#8B5CF6',
        fontWeight: '500',
    },

    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FF3B30'
    },
    logoutText: { color: '#FF3B30', fontWeight: 'bold', marginLeft: 8 },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12
    },
    settingLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    settingText: { fontSize: 16, color: '#222' },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 10,
    },
    semesterStatusText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
    activeReminderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10B981',
        textAlign: 'center',
        backgroundColor: '#D1FAE5',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    inactiveReminderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
        textAlign: 'center',
        backgroundColor: '#FEE2E2',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },
    footer: { alignItems: 'center', paddingVertical: 20 },
    footerText: { fontSize: 14, color: '#666', fontWeight: '500', marginBottom: 4 },
    footerSubText: { fontSize: 12, color: '#888' },
});