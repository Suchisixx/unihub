import { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Platform } from 'react-native';
import { Plus, Trash2, Edit, Calendar, BarChart3 } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { useExpenses } from '../context/expenseContext';
import TransactionModal from '../components/expense/TransactionModal';
import { Alert } from 'react-native';
export default function ExpenseScreen({ setCurrentScreen }) {
    const { transactions = [], summary = {}, categories = [], deleteTransaction } = useExpenses();

    // Hàm format tiền tệ - bỏ .00 và thêm dấu chấm
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0';
        const integerAmount = Math.round(amount);
        return integerAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const [filterType, setFilterType] = useState('all');
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Xử lý DatePicker
    const handleDateChange = useCallback((event, newDate) => {
        setShowDatePicker(false);
        if (newDate) {
            setSelectedDate(dayjs(newDate));
            setFilterType('day');
        }
    }, []);

    // Lọc giao dịch
    const filteredTransactions = useMemo(() => {
        if (filterType === 'all') return transactions;

        return transactions.filter(t => {
            if (!t.trans_date) return false;
            const date = dayjs(t.trans_date);
            return date.isSame(selectedDate, 'day');
        });
    }, [transactions, filterType, selectedDate]);

    // TÍNH TOÁN SỐ DƯ, THU NHẬP, CHI TIÊU THEO FILTER
    const filteredSummary = useMemo(() => {
        if (filterType === 'all') {
            // Nếu là "Tất cả" thì dùng summary từ context
            return {
                income: summary.income || 0,
                expense: summary.expense || 0,
                balance: summary.balance || 0
            };
        } else {
            // Nếu lọc theo ngày thì tính toán từ filteredTransactions
            const dayIncome = filteredTransactions
                .filter(t => t.type === 'thu')
                .reduce((sum, t) => sum + (t.amount || 0), 0);

            const dayExpense = filteredTransactions
                .filter(t => t.type === 'chi')
                .reduce((sum, t) => sum + (t.amount || 0), 0);

            const dayBalance = dayIncome - dayExpense;

            return {
                income: dayIncome,
                expense: dayExpense,
                balance: dayBalance
            };
        }
    }, [filterType, filteredTransactions, summary]);

    // Gom tổng chi tiêu theo danh mục (chỉ tính chi tiêu)
    const categoryBreakdown = useMemo(() => {
        const expenseItems = filteredTransactions.filter(t => t.type === 'chi');
        const totalExpense = expenseItems.reduce((sum, t) => sum + (t.amount || 0), 0);
        return categories.map(cat => {
            const total = expenseItems
                .filter(t => t.cate_id === cat.cate_id)
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            return {
                ...cat,
                total,
                percent: totalExpense ? ((total / totalExpense) * 100).toFixed(0) : 0
            };
        }).filter(c => c.total > 0);
    }, [filteredTransactions, categories]);

    const openModal = (item = null) => {
        setEditingItem(item);
        setModalVisible(true);
    };

    const handleDelete = (item) => {
        Alert.alert(
            'Xác nhận xóa',
            'Bạn có chắc chắn muốn xóa giao dịch này?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTransaction(item.trans_id);
                            // Nếu muốn hiện toast nhỏ thì thêm dòng dưới (tùy chọn)
                            // Alert.alert('Thành công', 'Đã xóa giao dịch');
                        } catch (err) {
                            Alert.alert('Lỗi', 'Không thể xóa giao dịch. Vui lòng thử lại.');
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const navigateToReport = () => {
        setCurrentScreen('reports');
    }

    const renderTransaction = ({ item }) => {
        const category = categories.find(c => c.cate_id === item.cate_id) || {
            name: 'Không rõ danh mục',
            color: '#9CA3AF',
        };
        const isIncome = item.type === 'thu';

        return (
            <View style={[styles.transactionItem, { borderLeftColor: isIncome ? '#16A34A' : '#DC2626' }]}>
                <View style={{ flex: 1 }}>
                    {/* Danh mục + số tiền */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <View style={[styles.colorDot, { backgroundColor: category.color }]} />
                        <Text style={styles.categoryText}>{category.name}</Text>
                    </View>

                    <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
                        {isIncome ? '+' : '-'}{formatCurrency(item.amount || 0)} đ
                    </Text>

                    <Text style={styles.subText}>
                        {isIncome ? 'Thu nhập' : 'Chi tiêu'} · {
                            item.trans_date
                                ? dayjs(item.trans_date, 'YYYY-MM-DD').format('DD/MM/YYYY')
                                : 'Không có ngày'
                        }
                    </Text>

                    <Text style={styles.descriptionText}>
                        {item.description || 'Không có ghi chú'}
                    </Text>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => openModal(item)} style={styles.iconButton}>
                        <Edit size={18} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconButton}>
                        <Trash2 size={18} color="#DC2626" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentPadding} showsVerticalScrollIndicator={false}>
            {/* SỐ DƯ */}
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>
                    {filterType === 'day' ? `Số dư ngày ${selectedDate.format('DD/MM')}` : 'Số dư'}
                </Text>
                <Text style={[
                    styles.balanceAmount,
                    { color: filteredSummary.balance >= 0 ? '#1D4ED8' : '#DC2626' }
                ]}>
                    {formatCurrency(filteredSummary.balance)} đ
                </Text>
                {filterType === 'day' && (
                    <Text style={styles.dateNote}>
                        Chỉ tính trong ngày {selectedDate.format('DD/MM/YYYY')}
                    </Text>
                )}
            </View>

            {/* THU NHẬP & CHI TIÊU */}
            <View style={styles.row}>
                <View style={[styles.smallCard, { borderColor: '#22C55E' }]}>
                    <Text style={[styles.smallLabel, { color: '#22C55E' }]}>
                        {filterType === 'day' ? 'Thu trong ngày' : 'Thu nhập'}
                    </Text>
                    <Text style={[styles.smallAmount, { color: '#22C55E' }]}>
                        {formatCurrency(filteredSummary.income)} đ
                    </Text>
                </View>
                <View style={[styles.smallCard, { borderColor: '#EF4444' }]}>
                    <Text style={[styles.smallLabel, { color: '#EF4444' }]}>
                        {filterType === 'day' ? 'Chi trong ngày' : 'Chi tiêu'}
                    </Text>
                    <Text style={[styles.smallAmount, { color: '#EF4444' }]}>
                        {formatCurrency(filteredSummary.expense)} đ
                    </Text>
                </View>
            </View>

            {/* NÚT BÁO CÁO CHI TIÊU */}
            <TouchableOpacity style={styles.reportButton} onPress={navigateToReport}>
                <BarChart3 size={20} color="#7C3AED" />
                <Text style={styles.reportButtonText}>Báo cáo chi tiêu</Text>
            </TouchableOpacity>

            {/* CHI TIÊU THEO DANH MỤC */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    {filterType === 'day' ? 'Chi tiêu theo danh mục trong ngày' : 'Chi tiêu theo danh mục'}
                </Text>
                {categoryBreakdown.length > 0 ? (
                    categoryBreakdown.map(cat => (
                        <View key={cat.cate_id} style={styles.categoryRow}>
                            <View style={[styles.colorDot, { backgroundColor: cat.color || '#3B82F6' }]} />
                            <Text style={styles.categoryName}>{cat.name}</Text>
                            <Text style={styles.categoryAmount}>{formatCurrency(cat.total)} đ</Text>
                            <Text style={styles.categoryPercent}>{cat.percent}%</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noDataText}>
                        {filterType === 'day' ? 'Không có chi tiêu nào trong ngày này' : 'Chưa có dữ liệu chi tiêu.'}
                    </Text>
                )}
            </View>

            {/* LỌC GIAO DỊCH */}
            <View style={styles.section}>
                <View style={styles.filterHeader}>
                    <Text style={styles.sectionTitle}>Giao dịch</Text>
                    <View style={styles.filterContainer}>
                        <TouchableOpacity
                            onPress={() => setFilterType('all')}
                            style={[
                                styles.filterBtn,
                                filterType === 'all' && styles.activeFilter,
                                styles.firstFilterBtn
                            ]}
                        >
                            <Text style={filterType === 'all' ? styles.activeText : styles.filterText}>
                                Tất cả
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={[
                                styles.filterBtn,
                                filterType === 'day' && styles.activeFilter,
                                styles.lastFilterBtn
                            ]}
                        >
                            <Calendar size={16} color={filterType === 'day' ? '#2563EB' : '#6B7280'} />
                            <Text style={filterType === 'day' ? styles.activeText : styles.filterText}>
                                {filterType === 'day' ? selectedDate.format('DD/MM') : 'Theo ngày'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {filterType === 'day' && (
                    <View style={styles.dateIndicator}>
                        <Text style={styles.dateIndicatorText}>
                            Đang xem: {selectedDate.format('DD/MM/YYYY')}
                        </Text>
                        <TouchableOpacity
                            onPress={() => setFilterType('all')}
                            style={styles.clearFilterBtn}
                        >
                            <Text style={styles.clearFilterText}>×</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {showDatePicker && (
                    <DateTimePicker
                        value={selectedDate.toDate()}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}
            </View>

            {/* GIAO DỊCH GẦN ĐÂY */}
            <View style={styles.section}>
                <View style={styles.transactionHeader}>
                    <Text style={styles.sectionTitle}>
                        {filterType === 'day' ? 'Giao dịch trong ngày' : 'Giao dịch gần đây'}
                    </Text>
                    <TouchableOpacity onPress={() => openModal()} style={styles.addButton}>
                        <Plus size={16} color="#fff" />
                        <Text style={styles.addButtonText}>Thêm giao dịch</Text>
                    </TouchableOpacity>
                </View>

                {filteredTransactions.length > 0 ? (
                    <FlatList
                        data={filteredTransactions.slice(0, 10)}
                        keyExtractor={(item) => item.trans_id?.toString() || Math.random().toString()}
                        renderItem={renderTransaction}
                        scrollEnabled={false}
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>
                            {filterType === 'day'
                                ? 'Không có giao dịch nào trong ngày này'
                                : 'Chưa có giao dịch nào'
                            }
                        </Text>
                    </View>
                )}
            </View>

            <TransactionModal
                visible={modalVisible}
                onClose={() => {
                    setModalVisible(false);
                    setEditingItem(null);
                }}
                editingItem={editingItem}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
    contentPadding: {
        paddingBottom: 120,
    },
    balanceCard: {
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '600',
        textAlign: 'center'
    },
    balanceAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        marginVertical: 4
    },
    dateNote: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 4
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    smallCard: {
        flex: 1,
        borderWidth: 1.5,
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
        marginHorizontal: 4,
        backgroundColor: '#fff',
    },
    smallLabel: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center'
    },
    smallAmount: {
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 6
    },
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 5,
        marginTop: 2,
        marginBottom: 5,
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#7C3AED',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 3,
        gap: 12,
    },
    reportButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#7C3AED',
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827'
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottomWidth: 0.5,
        borderColor: '#E5E7EB',
    },
    colorDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8
    },
    categoryName: {
        flex: 1,
        fontSize: 14,
        color: '#374151'
    },
    categoryAmount: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '600'
    },
    categoryPercent: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 8
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563EB',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
    },
    addButtonText: {
        color: '#fff',
        marginLeft: 6,
        fontWeight: '600',
        fontSize: 12
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 10,
        marginTop: 8,
        borderLeftWidth: 4,
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    income: {
        color: '#16A34A'
    },
    expense: {
        color: '#DC2626'
    },
    categoryText: {
        color: '#111827',
        fontSize: 14,
        fontWeight: '600'
    },
    subText: {
        color: '#6B7280',
        fontSize: 12,
        marginTop: 2
    },
    actionRow: {
        flexDirection: 'row',
        marginLeft: 10
    },
    iconButton: {
        padding: 6
    },
    noDataText: {
        color: '#6B7280',
        marginTop: 6,
        textAlign: 'center'
    },

    // New Filter Styles
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 2,
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        gap: 4,
    },
    firstFilterBtn: {
        marginRight: 2,
    },
    lastFilterBtn: {
        marginLeft: 2,
    },
    activeFilter: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    filterText: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '500'
    },
    activeText: {
        color: '#2563EB',
        fontWeight: '600',
        fontSize: 12
    },
    dateIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#EFF6FF',
        padding: 8,
        borderRadius: 6,
        marginTop: 8,
    },
    dateIndicatorText: {
        color: '#2563EB',
        fontSize: 12,
        fontWeight: '500',
    },
    clearFilterBtn: {
        padding: 4,
    },
    clearFilterText: {
        color: '#2563EB',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyState: {
        alignItems: 'center',
        padding: 20,
    },
    emptyStateText: {
        color: '#6B7280',
        fontSize: 14,
        textAlign: 'center',
    },
});