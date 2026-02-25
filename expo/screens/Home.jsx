import { useContext, useMemo, useState } from 'react';
import {
    View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity
} from 'react-native';
import { Plus, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useSchedules } from '../context/scheduleContext';
import { useExpenses } from '../context/expenseContext'; // Thêm hook chi tiêu
import { AuthContext } from '../context/authContext';
import ScheduleCard from '../components/schedule/ScheduleCard';
import { dayName } from '../components/utils/dateUtils';
import NoteModal from '../components/notes/NoteModal';
import TransactionModal from '../components/expense/TransactionModal';

export default function HomeScreen({ setCurrentScreen }) {
    // --- Lấy dữ liệu từ Contexts ---
    const { schedules, loading: scheduleLoading } = useSchedules();
    const { user } = useContext(AuthContext);
    const { transactions = [], summary = {} } = useExpenses(); // Lấy dữ liệu chi tiêu
    const [noteModalVisible, setNoteModalVisible] = useState(false);
    const [transactionModalVisible, setTransactionModalVisible] = useState(false);

    // --- Xử lý dữ liệu ---
    const jsDayOfWeek = new Date().getDay();
    const appDay = jsDayOfWeek === 0 ? 8 : (jsDayOfWeek + 1);
    const day = dayName(appDay);

    // Lọc lịch học hôm nay
    const todaySchedules = useMemo(() => {
        return (schedules || []).filter(s => Number(s.day_of_week) === appDay);
    }, [schedules, appDay]);

    // Lấy chuỗi ngày tháng năm
    const todayString = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
    });

    // Format tiền tệ
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0';
        const integerAmount = Math.round(amount);
        return integerAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    // Thống kê chi tiêu 
    const expenseStats = useMemo(() => {
        const allIncome = transactions
            .filter(t => t.type === 'thu')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const allExpense = transactions
            .filter(t => t.type === 'chi')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        return {
            income: allIncome,
            expense: allExpense,
            balance: allIncome - allExpense
        };
    }, [transactions]);

    // Hàm xử lý thao tác nhanh

    // Hàm mở

    const handleOpenNoteModal = () => {
        setCurrentScreen('notes');
        setNoteModalVisible(true);
    }

    const handleOpenTransactionModal = () => {
        setCurrentScreen('expense');
        setTransactionModalVisible(true);
    }

    // Hàm đóng 

    const handleCloseNoteModal = () => {
        setNoteModalVisible(false);
    }

    const handleCloseTransactionModal = () => {
        setTransactionModalVisible(false);
    }


    // --- Render Giao diện ---
    return (<>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Phần Chào hỏi */}
            <View style={styles.header}>
                <Text style={styles.greeting}>Chào {user?.username || 'bạn'}!</Text>
                <Text style={styles.dateText}>Hôm nay là {todayString}</Text>
            </View>

            {/* Phần Lịch học hôm nay */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Lịch học hôm nay</Text>
                    <Text style={styles.sectionBadge}>{todaySchedules.length} lớp</Text>
                </View>

                {scheduleLoading ? (
                    <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
                ) : (
                    todaySchedules.length > 0 ? (
                        todaySchedules.map(item => (
                            <ScheduleCard
                                key={item.schedule_id}
                                item={item}
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Hôm nay bạn không có lớp nào.</Text>
                    )
                )}
            </View>

            {/* Phần Thống kê học tập */}
            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{todaySchedules.length}</Text>
                    <Text style={styles.statLabel}>Lớp hôm nay</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{(schedules || []).length}</Text>
                    <Text style={styles.statLabel}>Buổi học kỳ này</Text>
                </View>
            </View>

            {/* Phần Thống kê chi tiêu tháng này */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tổng quan chi tiêu</Text>
                </View>

                <View style={styles.expenseStats}>
                    <View style={styles.expenseItem}>
                        <View style={styles.expenseRow}>
                            <TrendingUp size={16} color="#10B981" />
                            <Text style={styles.expenseLabel}>Thu nhập</Text>
                        </View>
                        <Text style={[styles.expenseAmount, styles.incomeAmount]}>
                            +{formatCurrency(expenseStats.income)} đ
                        </Text>
                    </View>

                    <View style={styles.expenseItem}>
                        <View style={styles.expenseRow}>
                            <TrendingDown size={16} color="#EF4444" />
                            <Text style={styles.expenseLabel}>Chi tiêu</Text>
                        </View>
                        <Text style={[styles.expenseAmount, styles.expenseAmountText]}>
                            -{formatCurrency(expenseStats.expense)} đ
                        </Text>
                    </View>

                    <View style={[styles.expenseItem, styles.balanceItem]}>
                        <Text style={styles.expenseLabel}>Số dư</Text>
                        <Text style={[
                            styles.expenseAmount,
                            expenseStats.balance >= 0 ? styles.incomeAmount : styles.expenseAmountText
                        ]}>
                            {formatCurrency(expenseStats.balance)} đ
                        </Text>
                    </View>
                </View>
            </View>

            {/* Phần Thao tác nhanh */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
                </View>

                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.quickButton, styles.noteButton]}
                        onPress={handleOpenNoteModal}
                    >
                        <Plus size={20} color="#8B5CF6" />
                        <Text style={styles.quickButtonText}>Thêm ghi chú mới</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickButton, styles.expenseButton]}
                        onPress={handleOpenTransactionModal}
                    >
                        <Plus size={20} color="#059669" />
                        <Text style={styles.quickButtonText}>Thêm giao dịch mới</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
        <NoteModal
            visible={noteModalVisible}
            onClose={handleCloseNoteModal}
            editingItem={null}
        />

        <TransactionModal
            visible={transactionModalVisible}
            onClose={handleCloseTransactionModal}
            editingItem={null}
        />
    </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        marginBottom: 120,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        alignItems: 'center'
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937'
    },
    dateText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 4
    },
    section: {
        marginHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 5,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 3
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        marginTop: 15,
        paddingHorizontal: 15
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827'
    },
    sectionBadge: {
        fontSize: 13,
        color: '#3B82F6',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        overflow: 'hidden',
        fontWeight: '500'
    },
    loader: {
        marginVertical: 40
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        paddingVertical: 30,
        fontSize: 15,
        paddingHorizontal: 15
    },
    statsContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 20,
        gap: 16
    },
    statBox: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2
    },
    statNumber: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#3B82F6'
    },
    statLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 5,
        textAlign: 'center'
    },
    // Styles cho phần chi tiêu
    expenseStats: {
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    expenseItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    balanceItem: {
        borderBottomWidth: 0,
        marginTop: 4,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    expenseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    expenseLabel: {
        fontSize: 15,
        color: '#374151',
        fontWeight: '500',
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: '600',
    },
    incomeAmount: {
        color: '#10B981',
    },
    expenseAmountText: {
        color: '#EF4444',
    },
    // Styles cho thao tác nhanh
    quickActions: {
        paddingHorizontal: 15,
        paddingBottom: 15,
        gap: 12,
    },
    quickButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 12,
        borderWidth: 1.5,
    },
    noteButton: {
        backgroundColor: '#F5F3FF',
        borderColor: '#8B5CF6',
    },
    expenseButton: {
        backgroundColor: '#ECFDF5',
        borderColor: '#10B981',
    },
    quickButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
});