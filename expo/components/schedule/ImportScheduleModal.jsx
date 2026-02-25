// components/schedule/ImportScheduleModal.js
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Alert, Pressable, ActivityIndicator } from 'react-native';
import { X, UploadCloud } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSemester } from '../../context/semesterContext';
import { useSchedules } from '../../context/scheduleContext';

export default function ImportScheduleModal({ visible, onClose, onSubmit }) {
    const { selectedSemester } = useSemester();
    const { importSchedules, loading: contextLoading } = useSchedules();

    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleClose = () => {
        setSelectedFile(null);
        setLoading(false);
        onClose();
    };

    const handleFilePick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['text/*', 'application/*', '*/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled) {
                setSelectedFile(result.assets[0]);
            }
        } catch (err) {
            Alert.alert('Lỗi', 'Không thể chọn file.');
        }
    };

    const handleSubmit = async () => {
        if (!selectedSemester?.sem_id) {
            Alert.alert('Lỗi', 'Chưa có học kỳ được chọn.');
            return;
        }
        if (!selectedFile) {
            Alert.alert('Lỗi', 'Vui lòng chọn file CSV.');
            return;
        }

        setLoading(true);

        try {
            const fileObject = {
                uri: selectedFile.uri,
                name: selectedFile.name,
                type: selectedFile.mimeType || 'text/csv',
            };

            const result = await importSchedules(fileObject);

            // TH1 : THÀNH CÔNG
            if (result.success) {
                const count = result.imported || 0;
                const errorCount = result.errors?.length || 0;

                if (errorCount === 0) {
                    Alert.alert('Thành công', `Đã import thành công ${count} môn học!`);
                } else {
                    // CÓ LỖI NHƯNG VẪN IMPORT ĐƯỢC MỘT PHẦN
                    Alert.alert(
                        'Import một phần thành công',
                        `Đã thêm ${count} môn học.\n\nCó ${errorCount} lỗi:\n${result.errors
                            .slice(0, 8) // Chỉ hiện tối đa 8 lỗi 
                            .map(e => `• Dòng ${e.row}: ${e.error}`)
                            .join('\n')}${result.errors.length > 8 ? '\n...và thêm ' + (result.errors.length - 8) + ' lỗi khác' : ''}`,
                        [{ text: 'OK' }]
                    );
                } c
                handleClose();
                onSubmit();
            }
            // TH2 : THẤT BẠI HOÀN TOÀN
            else {
                let msg = result.message || 'Lỗi không xác định từ server';

                // Nếu có lỗi chi tiết từ từng dòng (thiếu cột, trùng lịch, v.v.)
                if (result.errors && result.errors.length > 0) {
                    msg = `Import thất bại!\n\nChi tiết lỗi:\n${result.errors
                        .slice(0, 10)
                        .map(e => `• Dòng ${e.row}: ${e.error}`)
                        .join('\n')}${result.errors.length > 10 ? '\n...và thêm ' + (result.errors.length - 10) + ' lỗi khác' : ''}`;
                }

                Alert.alert('Import thất bại', msg, [{ text: 'OK' }]);
            }
        } catch (error) {
            Alert.alert('Lỗi', error.message || 'Lỗi kết nối hoặc xử lý file.');
        } finally {
            setLoading(false);
        }
    };

    const isReady = !!selectedSemester?.sem_id;
    const fileLabel = selectedFile ? selectedFile.name : 'Chọn File CSV';
    const isLoading = loading || contextLoading;

    const semesterNameWithYear = selectedSemester
        ? `${selectedSemester.year_name} - ${selectedSemester.name}`
        : 'Chưa chọn học kỳ';

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <Pressable style={styles.overlay} onPress={handleClose}>
                <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Nhập Thời khóa biểu từ File</Text>
                        <TouchableOpacity onPress={handleClose}>
                            <X size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalContent}>
                        <Text style={styles.infoText}>
                            Học kỳ đang chọn: <Text style={{ fontWeight: '600', color: isReady ? '#2563EB' : '#EF4444' }}>
                                {semesterNameWithYear}
                            </Text>
                        </Text>

                        <TouchableOpacity
                            style={styles.fileButton}
                            onPress={handleFilePick}
                            disabled={isLoading}
                        >
                            <UploadCloud size={20} color="#374151" style={{ marginRight: 8 }} />
                            <Text style={styles.fileButtonText}>{fileLabel}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!selectedFile || !isReady || isLoading) && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmit}
                            disabled={!selectedFile || !isReady || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Import & Lưu</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center"
    },
    modalContainer: {
        width: "85%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 0
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#eee"
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827"
    },
    modalContent: {
        padding: 16
    },
    infoText: {
        marginBottom: 16,
        fontSize: 14,
        color: '#4B5563'
    },
    fileButton: {
        backgroundColor: '#F3F4F6',
        padding: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    fileButtonText: {
        color: '#111827',
        fontSize: 16
    },
    submitButton: {
        backgroundColor: '#2563EB',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },
});