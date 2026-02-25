// components/schedules/ScheduleCard.jsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Edit2, Trash2 } from 'lucide-react-native';
import { formatTimeForDisplay } from '../utils/dateUtils';

// Mảng màu cố định cho dấu chấm (có thể đặt ở ngoài component)
const dotColors = ['#00796b', '#c62828', '#6a1b9a', '#2773ddff', '#FFA000', '#ff905cff'];

const ScheduleCard = ({ item, onEdit, onDelete }) => {
    const startTime = item.start_time ? formatTimeForDisplay(item.start_time) : '--:--';
    const endTime = item.end_time ? formatTimeForDisplay(item.end_time) : '--:--';
    const typeLabel = item.type === 'th' ? '(Thực Hành)' : '(Lý Thuyết)'; // Hiển thị LT/TH

    // Tính index màu dựa trên ID (hoặc một logic khác nếu muốn)
    const colorIndex = (item.schedule_id || 0) % dotColors.length;
    const dotColor = dotColors[colorIndex]; // Lấy màu từ mảng

    return (
        <View style={styles.card}>
            {/* Cột trạng thái (dấu chấm) - Giờ chỉ dùng màu tính toán */}
            <View style={[styles.dot, { backgroundColor: dotColor }]} />

            {/* Cột thông tin chính */}
            <View style={styles.content}>
                <Text style={styles.subjectName}>{item.subject_name}</Text>
                <Text>{typeLabel}</Text>
                <Text style={styles.infoText}>
                    {item.room ? `Phòng ${item.room}` : 'N/A'} • {startTime} - {endTime}
                </Text>
                {/* Giữ lại hiển thị cơ sở nếu có */}
                {item.campus_name && (
                    <Text style={styles.infoText}>
                        {item.campus_name}{item.campus_address ? ` - ${item.campus_address}` : ''}
                    </Text>
                )}
            </View>

            {/* Cột nút bấm Sửa/Xóa (Giữ nguyên) */}
            <View style={styles.actions}>
                {onEdit && (
                    <TouchableOpacity onPress={() => onEdit()} style={styles.actionButton}>
                        <Edit2 size={18} color="#4B5563" />
                    </TouchableOpacity>
                )}
                {onDelete && (
                    <TouchableOpacity onPress={() => onDelete()} style={styles.actionButton}>
                        <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// --- STYLES --- (Bỏ các style liên quan đến status text)
const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
        marginTop: 4,
    },
    // Bỏ các style dotOngoing, dotFinished, dotNotStarted
    content: {
        flex: 1
    },
    subjectName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 3
    },
    infoText: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 2
    },
    // Bỏ style statusText và các style textOngoing, textFinished, textNotStarted
    actions: {
        flexDirection: 'column',
        justifyContent: 'center',
        marginLeft: 10
    },
    actionButton: {
        padding: 6,
        marginBottom: 8
    },
});

export default ScheduleCard;