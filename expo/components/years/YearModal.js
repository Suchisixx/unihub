import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Pressable,
    ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { X } from 'lucide-react-native';
import { useSemester } from '../../context/semesterContext';

const YEAR_NAMES = [
    { label: "Năm 1", value: "Năm 1" },
    { label: "Năm 2", value: "Năm 2" },
    { label: "Năm 3", value: "Năm 3" },
    { label: "Năm 4", value: "Năm 4" },
    { label: "Năm 5", value: "Năm 5" },
    { label: "Năm 6", value: "Năm 6" },
    { label: "Năm 7", value: "Năm 7" },
];

export default function YearModal({ visible, onClose, onSubmit }) {
    const { addYear } = useSemester();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await addYear(name);

            if (response.success) {
                // Đã gọi Alert thành công ở ScheduleScreen
                setName(''); // Reset
                onClose();
                onSubmit();
            } else {
                Alert.alert('Thất bại', response.message || 'Thêm năm học không thành công.');
            }
        } catch (error) {
            console.error('Error adding year:', error);
            Alert.alert('Lỗi :', error.message || 'Đã xảy ra lỗi khi thêm năm học.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Pressable style={styles.overlayBackground} onPress={onClose} />
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Thêm năm học</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.modalContent}>
                        {/* Picker cho Tên Năm Học */}
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={name}
                                onValueChange={(itemValue) => setName(itemValue)}
                                style={styles.picker}
                            >
                                {YEAR_NAMES.map((item) => (
                                    <Picker.Item
                                        key={item.value || 'default'}
                                        label={item.label}
                                        value={item.value}
                                    />
                                ))}
                            </Picker>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={loading || !name}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>Thêm</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    overlayBackground: {
        ...StyleSheet.absoluteFillObject
    },
    modalContainer: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827'
    },
    modalContent: {
        gap: 12
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        overflow: 'hidden'
    },
    picker: {
        height: 50,
        color: '#111827'
    },
    submitButton: {
        backgroundColor: '#10B981',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});