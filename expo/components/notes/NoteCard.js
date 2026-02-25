// components/notes/NoteCard.js
// import OpenAnything from 'react-native-openanything'; // Đã xóa
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Edit, Trash2, BookOpen } from 'lucide-react-native';
// import { Image, Linking } from 'react-native'; // Đã xóa Image và Linking
// import { Paperclip } from 'lucide-react-native'; // Đã xóa Paperclip

const formatDate = (dateString) => {
    if (!dateString) return 'Vừa tạo';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).replace(/\/\d{4},/, '');
};

const NoteCard = ({ item, onEdit, onDelete }) => {
    // const fileUrl = item.file_url || item.file_path; // Đã xóa
    // const hasFile = !!fileUrl; // Đã xóa

    // const handleOpenFile = async () => { ... }; // Đã xóa

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                {/* Hiển thị tên môn học */}
                <Text style={styles.subjectName}>{item.subject_name || 'Không có môn'}</Text>
            </View>

            <View style={styles.header}>
                <BookOpen size={18} color="#3B82F6" style={{ marginRight: 8 }} />
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
            </View>

            <Text style={styles.content} numberOfLines={2}>
                {item.content || 'Không có nội dung chi tiết...'}
            </Text>

            {/* Đã xóa khối hiển thị tệp đính kèm {hasFile && (...)} */}

            <View style={styles.footer}>
                <Text style={styles.dateText}>Cập nhật: {formatDate(item.updated_at)}</Text>

                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionButton}>
                        <Edit size={20} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(item.note_id, item.sem_id)} style={styles.actionButton}>
                        <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default NoteCard;

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        margin: 20,
        marginVertical: 6,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    subjectName: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#10B981',
        marginBottom: 8,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: '#D1FAE5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6
    },
    title: {
        fontSize: 16,
        fontWeight: '700', // Đã tăng độ đậm
        color: '#111827',
        flex: 1
    },
    content: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 8
    },
    // Đã xóa styles liên quan đến file
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10
    },
    dateText: {
        fontSize: 12,
        color: '#9CA3AF'
    },
    actions: {
        flexDirection: 'row'
    },
    actionButton: {
        marginRight: 10,
        marginLeft: 10
    }
});