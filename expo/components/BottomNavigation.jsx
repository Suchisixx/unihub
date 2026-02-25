import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { HomeIcon, CalendarIcon, BookOpenIcon, WalletIcon, SettingsIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const navItems = [
    { id: 'dashboard', icon: HomeIcon, label: 'Trang chủ' },
    { id: 'tkb', icon: CalendarIcon, label: 'TKB' },
    { id: 'notes', icon: BookOpenIcon, label: 'Ghi chú' },
    { id: 'expense', icon: WalletIcon, label: 'Chi tiêu' },
    { id: 'setting', icon: SettingsIcon, label: 'Cài đặt' },
];

export default function BottomNavigation({ currentScreen, setCurrentScreen }) {
    const insets = useSafeAreaInsets();
    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={styles.row}>
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = currentScreen === item.id;
                    return (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => setCurrentScreen(item.id)}
                            style={[styles.button, isActive && styles.activeButton]}
                            activeOpacity={0.7}
                        >
                            <Icon size={20} color={isActive ? '#2563eb' : '#6b7280'} style={{ marginBottom: 4 }} />
                            <Text style={[styles.label, isActive && styles.activeLabel]}>{item.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fff',
        zIndex: 100,
        // paddingBottom: 0,
        // paddingTop: -100,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 8,
    },
    button: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        minWidth: 44,
        minHeight: 44,
        borderRadius: 8,
    },
    activeButton: {
        backgroundColor: 'rgba(59,130,246,0.1)',
    },
    label: {
        color: '#6b7280',
        fontWeight: '500',
        fontSize: 12,
    },
    activeLabel: {
        color: '#2563eb',
    },
});