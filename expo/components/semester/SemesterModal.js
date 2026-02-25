// components/semester/SemesterModal.js (SỬA LẠI)
import { useState, useEffect } from 'react';
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

const FIXED_SEMESTER_NAMES = [
    { label: "học kỳ 1", value: "học kỳ 1" },
    { label: "học kỳ 2", value: "học kỳ 2" },
    { label: "học kỳ 3", value: "học kỳ 3" },
    { label: "học kỳ hè", value: "học kỳ hè" },
];

export default function SemesterModal({ visible, onClose, onSubmit, initialData, parentYear }) {
    const { years, loading: contextLoading, fetchYearsAndSemesters, addSemester, updateSemester } = useSemester();
    const [selectedYearId, setSelectedYearId] = useState('');
    const [semesterName, setSemesterName] = useState('');
    const [loading, setLoading] = useState(false);

    // Xác định chế độ: thêm mới hay sửa
    const isEditMode = !!initialData;

    // Reset form khi modal mở/đóng - QUAN TRỌNG: SỬA LẠI HOÀN TOÀN
    useEffect(() => {
        if (visible) {
            console.log('Modal mở - Chế độ:', isEditMode ? 'SỬA' : 'THÊM');
            console.log('initialData:', initialData);
            console.log('parentYear:', parentYear);

            if (isEditMode && initialData && parentYear) {
                // Chế độ SỬA: thiết lập giá trị hiện tại
                setSelectedYearId(parentYear.year_id);
                setSemesterName(initialData.name);
                console.log('Đã set giá trị sửa:', parentYear.year_id, initialData.name);
            } else {
                // Chế độ THÊM: reset về giá trị mặc định
                const defaultYearId = years && years.length > 0 ? years[0].year_id : '';
                setSelectedYearId(defaultYearId);
                setSemesterName('');
                console.log('Đã reset giá trị thêm:', defaultYearId);
            }
        } else {
            // Khi đóng modal, reset state
            setSelectedYearId('');
            setSemesterName('');
            setLoading(false);
        }
    }, [visible, isEditMode, initialData, parentYear, years]);

    // Tải lại danh sách năm nếu chưa có
    useEffect(() => {
        if (visible && !contextLoading && (!years || years.length === 0)) {
            fetchYearsAndSemesters();
        }
    }, [visible, contextLoading, years, fetchYearsAndSemesters]);

    const handleSubmit = async () => {
        if (!selectedYearId || !semesterName) {
            Alert.alert('Lỗi', 'Vui lòng chọn Năm Học và Tên Học Kỳ.');
            return;
        }

        setLoading(true);
        try {
            let response;

            console.log('Submitting - Chế độ:', isEditMode ? 'SỬA' : 'THÊM');
            console.log('Dữ liệu gửi:', { selectedYearId, semesterName });

            if (isEditMode) {
                // CHẾ ĐỘ SỬA: gọi API cập nhật
                response = await updateSemester(initialData.sem_id, semesterName);
                console.log('Kết quả sửa:', response);
            } else {
                // CHẾ ĐỘ THÊM: gọi API thêm mới
                response = await addSemester(selectedYearId, semesterName);
                console.log('Kết quả thêm:', response);
            }

            if (response.success) {
                Alert.alert('Thành công', `${isEditMode ? 'Cập nhật' : 'Thêm'} học kỳ thành công!`);
                setSemesterName(''); // Reset
                setSelectedYearId('');
                onClose();
                onSubmit();
            } else {
                Alert.alert('Thất bại', response.message || `${isEditMode ? 'Cập nhật' : 'Thêm'} học kỳ không thành công.`);
            }
        } catch (error) {
            console.error(`Lỗi khi ${isEditMode ? 'sửa' : 'thêm'} học kì:`, error);
            Alert.alert('Lỗi', error.message || `Đã xảy ra lỗi khi ${isEditMode ? 'sửa' : 'thêm'} học kỳ.`);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedYearId('');
        setSemesterName('');
        setLoading(false);
        onClose();
    };

    const isYearsReady = years && years.length > 0;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <Pressable style={styles.overlayBackground} onPress={handleClose} />
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {isEditMode ? 'Sửa học kỳ' : 'Thêm học kỳ'}
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <X size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.modalContent}>
                        {/* 1. PICKER CHỌN NĂM HỌC */}
                        <View style={styles.pickerWrapper}>
                            {isYearsReady ? (
                                <Picker
                                    selectedValue={selectedYearId}
                                    onValueChange={(itemValue) => setSelectedYearId(itemValue)}
                                    style={styles.picker}
                                    enabled={!isEditMode && !contextLoading} // Trong chế độ sửa, không cho phép đổi năm
                                >
                                    <Picker.Item label="Chọn năm học" value="" />
                                    {years.map((year) => (
                                        <Picker.Item
                                            key={year.year_id}
                                            label={year.name || `Năm ${year.year_id}`}
                                            value={year.year_id}
                                        />
                                    ))}
                                </Picker>
                            ) : (
                                <Text style={styles.loadingText}>
                                    {contextLoading ? 'Đang tải danh sách năm...' : 'Chưa có năm học nào.'}
                                </Text>
                            )}
                        </View>

                        {/* 2. PICKER CHỌN TÊN HỌC KỲ (FIXED VALUE) */}
                        <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={semesterName}
                                onValueChange={setSemesterName}
                                style={styles.picker}
                                enabled={isYearsReady}
                            >
                                <Picker.Item label="Chọn học kỳ" value="" />
                                {FIXED_SEMESTER_NAMES.map((item) => (
                                    <Picker.Item
                                        key={item.value}
                                        label={item.label}
                                        value={item.value}
                                    />
                                ))}
                            </Picker>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            (!selectedYearId || !semesterName) && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={loading || !selectedYearId || !semesterName}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>
                                {isEditMode ? 'Cập nhật' : 'Thêm'}
                            </Text>
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
        height: 60,
        color: '#111827'
    },
    loadingText: {
        textAlign: 'center',
        color: '#6B7280',
        padding: 12
    },
    submitButton: {
        backgroundColor: '#8B5CF6',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16
    },
    submitButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
});