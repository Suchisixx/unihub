// components/notes/NoteModal.js
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import { useNotes } from '../../context/noteContext';
import { useSemester } from '../../context/semesterContext';
// import * as DocumentPicker from 'expo-document-picker'; // Đã xóa

export default function NoteModal({ visible, onClose, editingItem }) {
    const { subjects, addNote, updateNote, loading: contextLoading } = useNotes();
    const { selectedSemester } = useSemester();

    const [sub_id, setSubId] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    // const [file, setFile] = useState(null); // Đã xóa
    // const [fileName, setFileName] = useState(''); // Đã xóa
    // const [removeFile, setRemoveFile] = useState(false); // Đã xóa
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load dữ liệu khi mở modal
    useEffect(() => {
        if (editingItem) {
            setSubId(String(editingItem.sub_id || ''));
            setTitle(editingItem.title || '');
            setContent(editingItem.content || '');
            // setFile(null); // Đã xóa
            // setFileName(editingItem.original_file_name || ''); // Đã xóa
            // setRemoveFile(false); // Đã xóa
        } else {
            // reset khi thêm mới
            const defaultSub = subjects?.[0]?.sub_id ? subjects[0].sub_id.toString() : '';
            setSubId(defaultSub);
            setTitle('');
            setContent('');
            // setFile(null); // Đã xóa
            // setFileName(''); // Đã xóa
            // setRemoveFile(false); // Đã xóa
        }
    }, [editingItem, visible, subjects]);

    const handleSubmit = async () => {
        if (!sub_id || !title.trim()) {
            Alert.alert('Lỗi', 'Vui lòng chọn Môn học và nhập Tiêu đề.');
            return;
        }
        if (!selectedSemester?.sem_id) {
            Alert.alert('Lỗi', 'Học kỳ chưa được chọn.');
            return;
        }

        setIsSubmitting(true);

        // Thay đổi: Sử dụng object JSON thay vì FormData
        const noteData = {
            sem_id: selectedSemester.sem_id,
            sub_id: parseInt(sub_id, 10), // Chuyển sub_id về số nguyên
            title: title.trim(),
            content: content.trim() || null, // Gửi null nếu rỗng
        };

        // Bỏ logic thêm file/remove_file vào payload

        try {
            if (editingItem?.note_id) {
                // Đối với PUT, truyền note_id và JSON object
                await updateNote(editingItem.note_id, noteData);
            } else {
                // Đối với POST, truyền JSON object
                await addNote(noteData);
            }
            onClose();
        } catch (err) {
            Alert.alert('Lỗi', err.message || 'Không thể lưu ghi chú.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <X size={24} color="#6B7280" />
                    </TouchableOpacity>

                    <Text style={styles.modalTitle}>
                        {editingItem ? 'Chỉnh sửa ghi chú' : 'Thêm ghi chú'}
                    </Text>

                    <Text style={styles.label}>Chọn môn học</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={sub_id}
                            onValueChange={setSubId}
                            enabled={!contextLoading}
                            style={styles.pickerStyle}
                        >
                            {subjects?.length ? (
                                subjects.map((s) => (
                                    <Picker.Item
                                        key={s.sub_id?.toString() || Math.random().toString()}
                                        label={s.subject_name || s.name || 'Không rõ tên môn'}
                                        value={s.sub_id?.toString() || ''}
                                    />
                                ))
                            ) : (
                                <Picker.Item
                                    label="Không có môn học nào"
                                    value=""
                                    color="#EF4444"
                                />
                            )}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Tiêu đề</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nhập tiêu đề..."
                        placeholderTextColor="#9CA3AF"
                        onChangeText={setTitle}
                        value={title}
                    />

                    <Text style={styles.label}>Nội dung</Text>
                    <TextInput
                        style={[styles.input, styles.multilineInput]}
                        placeholder="Nội dung chi tiết..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        onChangeText={setContent}
                        value={content}
                    />

                    {/* Đã xóa hoàn toàn phần Tệp đính kèm */}
                    {/* <Text style={styles.label}>Tệp đính kèm</Text>
                    <View style={styles.fileContainer}>
                        ... (File UI/Logic)
                    </View> */}

                    <TouchableOpacity
                        style={[styles.submitButton, (isSubmitting || !sub_id || !title.trim()) && styles.submitButtonDisabled]}
                        disabled={isSubmitting || contextLoading || !sub_id || !title.trim()} // Thêm disabled check cho sub_id và title
                        onPress={handleSubmit}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>
                                {editingItem ? 'Cập nhật' : 'Thêm ghi chú'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },

    modalView: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 16,
        paddingVertical: 22,
        paddingHorizontal: 20,
        elevation: 6,
    },

    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 8,
        zIndex: 10,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
    },

    modalSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
    },

    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginTop: 15,
    },

    // --- Picker ---
    pickerContainer: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        height: 50,
    },

    pickerStyle: {
        height: 50,
        color: '#1F2937',
    },

    // --- Input ---
    input: {
        height: 45,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 15,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    multilineInput: {
        height: 100,
        paddingTop: 10,
        textAlignVertical: 'top',
    },

    // --- File Upload ---
    fileContainer: {
        marginTop: 8,
        marginBottom: 12,
    },

    fileButton: {
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },

    fileButtonText: {
        color: '#1D4ED8',
        fontWeight: '600',
        fontSize: 14,
    },

    fileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },

    fileName: {
        color: '#111827',
        fontSize: 14,
        flexShrink: 1,
    },

    // --- Submit ---
    submitButton: {
        backgroundColor: '#2563EB',
        borderRadius: 8,
        paddingVertical: 14,
        marginTop: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
    },

    submitButtonDisabled: {
        backgroundColor: '#93C5FD',
    },

    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
