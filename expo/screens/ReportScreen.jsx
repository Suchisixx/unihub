import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import dayjs from 'dayjs';
import { useExpenses } from '../context/expenseContext';

export default function ReportScreen({ setCurrentScreen }) {
    const { transactions = [] } = useExpenses();

    // Hàm format tiền tệ
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0';
        const integerAmount = Math.round(amount);
        return integerAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    // PHÂN TÍCH THEO THÁNG - CORE LOGIC
    const monthlyAnalysis = useMemo(() => {
        const monthlyData = {};

        // BƯỚC 1: NHÓM GIAO DỊCH THEO THÁNG
        // Mục đích: Gom tất cả giao dịch vào từng tháng để tính tổng
        transactions.forEach(transaction => {
            if (!transaction.trans_date) return;

            const date = dayjs(transaction.trans_date);
            const monthKey = date.format('YYYY-MM'); // Key để nhóm (ví dụ: "2024-11")
            const monthName = date.format('MM/YYYY'); // Tên hiển thị (ví dụ: "11/2024")

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    month: monthName,
                    income: 0,
                    expense: 0,
                    timestamp: date.valueOf() // Để sắp xếp sau này
                };
            }

            // PHÂN LOẠI VÀ CỘNG DỒN
            if (transaction.type === 'thu') {
                monthlyData[monthKey].income += transaction.amount || 0;
            } else if (transaction.type === 'chi') {
                monthlyData[monthKey].expense += transaction.amount || 0;
            }
        });

        // BƯỚC 2: SẮP XẾP THÁNG (MỚI NHẤT ĐẦU TIÊN)
        const sortedMonths = Object.values(monthlyData).sort((a, b) => b.timestamp - a.timestamp);

        // BƯỚC 3: TÍNH TOÁN CHỈ SỐ CHO TỪNG THÁNG
        return sortedMonths.map((month, index) => {
            const prevMonth = sortedMonths[index + 1]; // Tháng trước đó trong mảng đã sắp xếp

            let incomeChange = null;     // % thay đổi thu nhập
            let expenseChange = null;    // % thay đổi chi tiêu
            let incomeChangeType = 'same'; // 'increase', 'decrease', 'same'
            let expenseChangeType = 'same';

            // CHỈ SỐ 1: % THAY ĐỔI THU NHẬP SO VỚI THÁNG TRƯỚC
            // Công thức: [(Thu tháng này - Thu tháng trước) / Thu tháng trước] × 100
            // Ý nghĩa: Cho biết thu nhập tăng/giảm bao nhiêu % so với tháng trước
            if (prevMonth) {
                if (prevMonth.income > 0) {
                    incomeChange = ((month.income - prevMonth.income) / prevMonth.income * 100).toFixed(1);
                    incomeChangeType = month.income > prevMonth.income ? 'increase' :
                        month.income < prevMonth.income ? 'decrease' : 'same';
                } else if (month.income > 0) {
                    // TRƯỜNG HỢP ĐẶC BIỆT: Tháng trước = 0, tháng này > 0
                    // => Tăng vô cùng (∞) vì không thể tính % từ 0
                    incomeChange = '∞';
                    incomeChangeType = 'increase';
                }
            }

            // CHỈ SỐ 2: % THAY ĐỔI CHI TIÊU SO VỚI THÁNG TRƯỚC
            // Công thức: [(Chi tháng này - Chi tháng trước) / Chi tháng trước] × 100
            // Ý nghĩa: Cho biết chi tiêu tăng/giảm bao nhiêu % so với tháng trước
            if (prevMonth) {
                if (prevMonth.expense > 0) {
                    expenseChange = ((month.expense - prevMonth.expense) / prevMonth.expense * 100).toFixed(1);
                    expenseChangeType = month.expense > prevMonth.expense ? 'increase' :
                        month.expense < prevMonth.expense ? 'decrease' : 'same';
                } else if (month.expense > 0) {
                    // TRƯỜNG HỢP ĐẶC BIỆT: Tháng trước = 0, tháng này > 0
                    expenseChange = '∞';
                    expenseChangeType = 'increase';
                }
            }

            // CHỈ SỐ 3: SỐ DƯ (BALANCE)
            // Công thức: Thu nhập - Chi tiêu
            // Ý nghĩa: Số tiền còn lại sau khi chi tiêu
            const balance = month.income - month.expense;

            // CHỈ SỐ 4: TỶ LỆ TIẾT KIỆM (SAVINGS RATE)
            // Công thức: (Số dư / Thu nhập) × 100
            // Ý nghĩa: Phần trăm thu nhập bạn thực sự tiết kiệm được
            // Ví dụ: Thu 10tr, chi 7tr => Tiết kiệm 3tr (30%)
            const savingsRate = month.income > 0 ? (balance / month.income) * 100 : 0;

            // CHỈ SỐ 5: TỶ LỆ CHI TIÊU (EXPENSE RATE)
            // Công thức: (Chi tiêu / Thu nhập) × 100
            // Ý nghĩa: Phần trăm thu nhập bạn đã chi tiêu
            // Ví dụ: Thu 10tr, chi 7tr => Chi tiêu 70%
            const expenseRate = month.income > 0 ? (month.expense / month.income) * 100 :
                (month.expense > 0 ? 100 : 0); // Nếu không có thu nhập mà vẫn chi => 100%

            return {
                ...month,
                incomeChange,           // % thay đổi thu nhập
                expenseChange,          // % thay đổi chi tiêu
                incomeChangeType,       // Loại thay đổi thu (tăng/giảm/giữ nguyên)
                expenseChangeType,      // Loại thay đổi chi (tăng/giảm/giữ nguyên)
                balance,               // Số dư
                savingsRate,           // Tỷ lệ tiết kiệm (%)
                expenseRate            // Tỷ lệ chi tiêu (%)
            };
        });
    }, [transactions]);

    const goBack = () => {
        setCurrentScreen('expense');
    };

    // HÀM XÁC ĐỊNH MÀU SẮC CHO THAY ĐỔI
    const getChangeColor = (type, isExpense = false) => {
        /**
         * QUY TẮC MÀU SẮC:
         * - Thu nhập: Tăng = TỐT (xanh), Giảm = XẤU (đỏ)
         * - Chi tiêu: Giảm = TỐT (xanh), Tăng = XẤU (đỏ)
         */
        if (isExpense) {
            // Đối với CHI TIÊU: giảm là tốt (xanh), tăng là xấu (đỏ)
            return type === 'increase' ? '#EF4444' :  // Chi tăng => XẤU (đỏ)
                type === 'decrease' ? '#10B981' :  // Chi giảm => TỐT (xanh)
                    '#6B7280';                         // Không đổi (xám)
        } else {
            // Đối với THU NHẬP: tăng là tốt (xanh), giảm là xấu (đỏ)
            return type === 'increase' ? '#10B981' :  // Thu tăng => TỐT (xanh)
                type === 'decrease' ? '#EF4444' :  // Thu giảm => XẤU (đỏ)
                    '#6B7280';                         // Không đổi (xám)
        }
    };

    // HÀM XÁC ĐỊNH ICON CHO THAY ĐỔI
    const getChangeIcon = (type, isExpense = false) => {
        /**
         * QUY TẮC ICON:
         * - Mũi tên LÊN: thể hiện sự tăng lên
         * - Mũi tên XUỐNG: thể hiện sự giảm xuống
         */
        if (isExpense) {
            // Chi tiêu: mũi tên LÊN khi tăng (xấu), XUỐNG khi giảm (tốt)
            return type === 'increase' ? <ArrowUpRight size={14} color="#EF4444" /> :  // Chi tăng
                type === 'decrease' ? <ArrowDownRight size={14} color="#10B981" /> : // Chi giảm
                    null;
        } else {
            // Thu nhập: mũi tên LÊN khi tăng (tốt), XUỐNG khi giảm (xấu)
            return type === 'increase' ? <ArrowUpRight size={14} color="#10B981" /> :  // Thu tăng
                type === 'decrease' ? <ArrowDownRight size={14} color="#EF4444" /> : // Thu giảm
                    null;
        }
    };

    // HÀM ĐỊNH DẠNG TEXT PHẦN TRĂM
    const getChangeText = (change, type) => {
        if (change === '∞') return '∞%';  // Vô cùng
        if (!change) return '';           // Không có dữ liệu

        // Thêm dấu + cho số dương (tăng)
        const symbol = type === 'increase' ? '+' : '';
        return `${symbol}${change}%`;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={goBack} style={styles.backButton}>
                    <ArrowLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Báo cáo chi tiêu</Text>
                <View style={styles.headerIcon}>
                    <BarChart3 size={24} color="#7C3AED" />
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* CARD HƯỚNG DẪN ĐỌC BÁO CÁO */}
                <View style={styles.guideCard}>
                    <Text style={styles.guideTitle}>CÁCH ĐỌC BÁO CÁO</Text>

                    {/* GIẢI THÍCH MÀU SẮC */}
                    <View style={styles.guideItem}>
                        <View style={[styles.colorDot, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.guideText}>
                            <Text style={{ fontWeight: 'bold' }}>Màu xanh:</Text> Tín hiệu TỐT
                            (Thu nhập tăng hoặc Chi tiêu giảm)
                        </Text>
                    </View>
                    <View style={styles.guideItem}>
                        <View style={[styles.colorDot, { backgroundColor: '#EF4444' }]} />
                        <Text style={styles.guideText}>
                            <Text style={{ fontWeight: 'bold' }}>Màu đỏ:</Text> Cần LƯU Ý
                            (Thu nhập giảm hoặc Chi tiêu tăng)
                        </Text>
                    </View>

                    {/* GIẢI THÍCH CHỈ SỐ QUAN TRỌNG */}
                    <View style={styles.guideSection}>
                        <Text style={styles.guideSubtitle}>CÁC CHỈ SỐ QUAN TRỌNG:</Text>
                        <Text style={styles.guideDetail}>• <Text style={{ fontWeight: 'bold' }}>% Thay đổi:</Text> So sánh với tháng trước</Text>
                        <Text style={styles.guideDetail}>• <Text style={{ fontWeight: 'bold' }}>Tỷ lệ tiết kiệm:</Text> % thu nhập bạn tiết kiệm được</Text>
                        <Text style={styles.guideDetail}>• <Text style={{ fontWeight: 'bold' }}>Tỷ lệ chi tiêu:</Text> % thu nhập bạn đã chi tiêu</Text>
                    </View>
                </View>

                {/* DANH SÁCH THÁNG */}
                <View style={styles.monthList}>
                    {monthlyAnalysis.length > 0 ? (
                        monthlyAnalysis.map((month, index) => (
                            <View key={index} style={styles.monthCard}>
                                {/* HEADER THÁNG - HIỂN THỊ THÁNG VÀ SỐ DƯ */}
                                <View style={styles.monthHeader}>
                                    <Text style={styles.monthName}>Tháng {month.month}</Text>
                                    <View style={styles.balanceContainer}>
                                        <Text style={[
                                            styles.monthBalance,
                                            { color: month.balance >= 0 ? '#10B981' : '#EF4444' }
                                        ]}>
                                            {formatCurrency(month.balance)} đ
                                        </Text>
                                        <Text style={styles.balanceLabel}>
                                            {month.balance >= 0 ? '💰 Tiết kiệm' : '⚠️ Thâm hụt'}
                                        </Text>
                                    </View>
                                </View>

                                {/* DÒNG THU NHẬP - HIỂN THỊ SỐ TIỀN VÀ % THAY ĐỔI */}
                                <View style={styles.statRow}>
                                    <View style={styles.statInfo}>
                                        <View style={styles.statHeader}>
                                            <View style={[styles.colorDot, { backgroundColor: '#10B981' }]} />
                                            <Text style={styles.statLabel}>Thu nhập</Text>
                                        </View>
                                        <Text style={styles.incomeAmount}>
                                            {formatCurrency(month.income)} đ
                                        </Text>
                                    </View>
                                    {month.incomeChange && (
                                        <View style={[
                                            styles.changeBadge,
                                            { backgroundColor: getChangeColor(month.incomeChangeType) + '15' }
                                        ]}>
                                            {getChangeIcon(month.incomeChangeType, false)}
                                            <Text style={[
                                                styles.changeText,
                                                { color: getChangeColor(month.incomeChangeType) }
                                            ]}>
                                                {getChangeText(month.incomeChange, month.incomeChangeType)}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* DÒNG CHI TIÊU - HIỂN THỊ SỐ TIỀN VÀ % THAY ĐỔI */}
                                <View style={styles.statRow}>
                                    <View style={styles.statInfo}>
                                        <View style={styles.statHeader}>
                                            <View style={[styles.colorDot, { backgroundColor: '#EF4444' }]} />
                                            <Text style={styles.statLabel}>Chi tiêu</Text>
                                        </View>
                                        <Text style={styles.expenseAmount}>
                                            {formatCurrency(month.expense)} đ
                                        </Text>
                                    </View>
                                    {month.expenseChange && (
                                        <View style={[
                                            styles.changeBadge,
                                            { backgroundColor: getChangeColor(month.expenseChangeType, true) + '15' }
                                        ]}>
                                            {getChangeIcon(month.expenseChangeType, true)}
                                            <Text style={[
                                                styles.changeText,
                                                { color: getChangeColor(month.expenseChangeType, true) }
                                            ]}>
                                                {getChangeText(month.expenseChange, month.expenseChangeType)}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* CHỈ SỐ HIỆU SUẤT - ĐÁNH GIÁ TÌNH HÌNH TÀI CHÍNH */}
                                <View style={styles.performanceRow}>
                                    {/* TỶ LỆ TIẾT KIỆM */}
                                    <View style={styles.performanceItem}>
                                        <Text style={styles.performanceLabel}>💰 Tỷ lệ tiết kiệm</Text>
                                        <Text style={[
                                            styles.performanceValue,
                                            {
                                                // ĐÁNH GIÁ MÀU THEO NGƯỠNG:
                                                // ≥20%: Tuyệt vời (xanh) - Tiết kiệm tốt
                                                // 0-20%: Ổn định (vàng) - Cần cải thiện
                                                // <0%: Cảnh báo (đỏ) - Chi nhiều hơn thu
                                                color: month.savingsRate >= 20 ? '#10B981' :
                                                    month.savingsRate >= 0 ? '#F59E0B' : '#EF4444'
                                            }
                                        ]}>
                                            {month.savingsRate.toFixed(1)}%
                                        </Text>
                                        <Text style={styles.performanceHint}>
                                            {month.savingsRate >= 20 ? 'Tuyệt vời!' :
                                                month.savingsRate >= 0 ? 'Ổn định' : 'Cần cải thiện'}
                                        </Text>
                                    </View>

                                    <View style={styles.performanceDivider} />

                                    {/* TỶ LỆ CHI TIÊU */}
                                    <View style={styles.performanceItem}>
                                        <Text style={styles.performanceLabel}>📈 Tỷ lệ chi tiêu</Text>
                                        <Text style={[
                                            styles.performanceValue,
                                            {
                                                // ĐÁNH GIÁ MÀU THEO NGƯỠNG:
                                                // ≤80%: Hợp lý (xanh) - Chi tiêu trong tầm kiểm soát
                                                // 80-100%: Cảnh báo (vàng) - Cần kiểm soát chi tiêu
                                                // >100%: Nguy hiểm (đỏ) - Chi vượt thu nhập
                                                color: month.expenseRate <= 80 ? '#10B981' :
                                                    month.expenseRate <= 100 ? '#F59E0B' : '#EF4444'
                                            }
                                        ]}>
                                            {month.expenseRate.toFixed(1)}%
                                        </Text>
                                        <Text style={styles.performanceHint}>
                                            {month.expenseRate <= 80 ? 'Hợp lý' :
                                                month.expenseRate <= 100 ? 'Cần kiểm soát' : 'Vượt thu nhập'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <BarChart3 size={48} color="#9CA3AF" />
                            <Text style={styles.emptyStateTitle}>Chưa có dữ liệu</Text>
                            <Text style={styles.emptyStateText}>
                                Thêm giao dịch để xem báo cáo chi tiết theo tháng
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        marginBottom: 110
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    headerIcon: {
        padding: 4,
    },
    content: {
        flex: 1,
        paddingBottom: 120,
    },
    // Card hướng dẫn chi tiết
    guideCard: {
        backgroundColor: '#EFF6FF',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
    },
    guideTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E40AF',
        marginBottom: 12,
    },
    guideItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    guideSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#BFDBFE',
    },
    guideSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E40AF',
        marginBottom: 8,
    },
    guideDetail: {
        fontSize: 13,
        color: '#374151',
        marginBottom: 4,
        marginLeft: 8,
    },
    guideText: {
        fontSize: 14,
        color: '#374151',
        marginLeft: 8,
        flex: 1,
    },
    guideSubtext: {
        fontSize: 12,
        color: '#6B7280',
        fontStyle: 'italic',
        marginTop: 12,
        fontWeight: '500',
    },
    colorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    monthList: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    monthCard: {
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    monthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    monthName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    balanceContainer: {
        alignItems: 'flex-end',
    },
    monthBalance: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    balanceLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statInfo: {
        flex: 1,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
        marginLeft: 8,
    },
    incomeAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#10B981',
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
    },
    changeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    changeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    performanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    performanceItem: {
        flex: 1,
        alignItems: 'center',
    },
    performanceDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E5E7EB',
    },
    performanceLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
        textAlign: 'center',
    },
    performanceValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    performanceHint: {
        fontSize: 10,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
        paddingHorizontal: 32,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
});