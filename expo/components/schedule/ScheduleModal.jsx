// components/schedule/ScheduleModal.jsx
import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import {
    View, Text, TextInput, Modal, TouchableOpacity,
    StyleSheet, Alert, ScrollView, Platform,
    KeyboardAvoidingView, ActivityIndicator
} from 'react-native';
import { X, Trash2 } from 'lucide-react-native'; // Thêm icon Trash2
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { dayName } from '../utils/dateUtils';
import { useSchedules } from '../../context/scheduleContext';
import { SemesterContext } from '../../context/semesterContext';
import { useCampuses } from '../../context/campusContext';
import { parseTime, formatTimeForAPI, formatTimeForDisplay } from '../utils/dateUtils';

export default function ScheduleModal({ visible, onClose, onSubmit, editingItem = null }) {
    const { addSchedule, updateSchedule, deleteSchedule, loading: isSubmitting } = useSchedules();
    const { selectedSemester } = useContext(SemesterContext);
    const { campuses, fetchCampuses, deleteCampus } = useCampuses();

    // Form state
    const [subjectName, setSubjectName] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState(2);
    const [startTime, setStartTime] = useState(parseTime('00:00'));
    const [endTime, setEndTime] = useState(parseTime('00:00'));
    const [room, setRoom] = useState('');
    const [type, setType] = useState('lt');
    const [campusName, setCampusName] = useState('');
    const [campusAddress, setCampusAddress] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingCampuses, setLoadingCampuses] = useState(false);
    const [isCampusFromSuggestion, setIsCampusFromSuggestion] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // Load campuses khi modal mở
    useEffect(() => {
        if (!visible) return;
        let cancelled = false;
        (async () => {
            try {
                setLoadingCampuses(true);
                if (fetchCampuses) await fetchCampuses();
            } catch (e) {
                console.warn('fetchCampuses failed', e?.message || e);
            } finally {
                if (!cancelled) setLoadingCampuses(false);
            }
        })();
        return () => { cancelled = true; };
    }, [visible]);

    // Reset form khi đóng modal hoặc editingItem thay đổi
    useEffect(() => {
        if (visible && editingItem) {
            setEditingId(editingItem.schedule_id ?? editingItem.id ?? null);
            setSubjectName(editingItem.subject_name ?? editingItem.name ?? '');
            const rawDay = Number(editingItem.day_of_week ?? editingItem.day ?? 1) || 1;
            setDayOfWeek(rawDay === 2 ? 8 : rawDay);
            setStartTime(parseTime(editingItem.start_time ?? editingItem.startTime ?? '00:00'));
            setEndTime(parseTime(editingItem.end_time ?? editingItem.endTime ?? '00:00'));
            setRoom(editingItem.room ?? '');
            setType(editingItem.type ?? 'lt');
            setCampusName(editingItem.campus_name ?? editingItem.campusName ?? '');
            setCampusAddress(editingItem.campus_address ?? editingItem.campusAddress ?? '');
            setShowSuggestions(false);
            setIsCampusFromSuggestion(!!(editingItem.campus_name || editingItem.campusName));
        }
        if (!visible) {
            setEditingId(null);
            setSubjectName('');
            setDayOfWeek(2);
            setStartTime(parseTime('08:00'));
            setEndTime(parseTime('09:30'));
            setRoom('');
            setType('lt');
            setCampusName('');
            setCampusAddress('');
            setShowSuggestions(false);
            setIsCampusFromSuggestion(false);
        }
    }, [visible, editingItem]);

    // Campus suggestions
    const campusSuggestions = useMemo(() => {
        if (!campusName || !Array.isArray(campuses) || campuses.length === 0) return [];
        const q = campusName.trim().toLowerCase();
        if (!q) return [];
        return campuses.filter(c => (c.name || '').toLowerCase().includes(q)).slice(0, 8);
    }, [campusName, campuses]);

    // Event handlers
    const pickCampusSuggestion = useCallback((c) => {
        setCampusName(c.name ?? '');
        setCampusAddress(c.address ?? '');
        setIsCampusFromSuggestion(true);
        setShowSuggestions(false);
    }, []);

    const handleCampusNameChange = useCallback((text) => {
        setCampusName(text);
        setShowSuggestions(!!text);
        if (isCampusFromSuggestion) {
            setIsCampusFromSuggestion(false);
            setCampusAddress('');
        }
    }, [isCampusFromSuggestion]);

    const handleCampusAddressChange = useCallback((text) => {
        if (!isCampusFromSuggestion) {
            setCampusAddress(text);
        }
    }, [isCampusFromSuggestion]);

    const onStartTimeChange = useCallback((_, selectedDate) => {
        setShowStartPicker(Platform.OS === 'ios');
        if (selectedDate) setStartTime(selectedDate);
    }, []);

    const onEndTimeChange = useCallback((_, selectedDate) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selectedDate) setEndTime(selectedDate);
    }, []);

    const handleDeleteCampus = async (campus, event) => {
        // Ngăn sự kiện nổi lên để không chọn cơ sở khi click xóa
        event?.stopPropagation();

        Alert.alert(
            'Xác nhận xóa',
            `Bạn có chắc muốn xóa "${campus.name}" không?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCampus(campus.cam_id ?? campus.id);
                            Alert.alert('Thành công', 'Đã xóa cơ sở!');
                            await fetchCampuses(); // làm mới danh sách
                        } catch (e) {
                            Alert.alert('Lỗi', e.message || 'Không thể xóa cơ sở');
                        }
                    },
                },
            ]
        );
    };

    const validateForm = useCallback(() => {
        // 1. Tên môn học
        if (!subjectName.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên môn học');
            return false;
        }

        // 2. Phòng học - BẮT BUỘC
        if (!room.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập phòng học');
            return false;
        }

        // 3. Học kỳ
        if (!selectedSemester?.sem_id) {
            Alert.alert('Lỗi', 'Vui lòng chọn học kỳ trước');
            return false;
        }

        // 4. Thứ
        if (!dayOfWeek || dayOfWeek < 2 || dayOfWeek > 8) {
            Alert.alert('Lỗi', 'Vui lòng chọn thứ hợp lệ');
            return false;
        }

        // 5. Cơ sở + địa chỉ (chỉ khi nhập cơ sở mới)
        const campusNameTrimmed = campusName.trim();
        const campusAddressTrimmed = campusAddress.trim();

        if (campusNameTrimmed && !isCampusFromSuggestion && !campusAddressTrimmed) {
            Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ cho cơ sở mới');
            return false;
        }

        return true;
    }, [
        subjectName,
        room,
        selectedSemester,
        dayOfWeek,
        startTime,
        endTime,
        campusName,
        campusAddress,
        isCampusFromSuggestion
    ]);

    const handleSave = useCallback(async () => {
        if (!validateForm()) return;

        const payload = {
            subject_name: subjectName.trim(),
            sem_id: selectedSemester.sem_id,
            day_of_week: dayOfWeek,
            start_time: formatTimeForAPI(startTime),
            end_time: formatTimeForAPI(endTime),
            room: room.trim() || null,
            type,
            campus_name: campusName.trim() || null,
            campus_address: campusAddress.trim() || null,
        };

        try {
            if (editingId) {
                await updateSchedule(editingId, payload);
            } else {
                await addSchedule(payload);
            }
            onClose();
        } catch (err) {
            Alert.alert('Lỗi lưu', err.message || 'Không thể lưu lịch');
        }
    }, [validateForm, subjectName, selectedSemester, dayOfWeek, startTime, endTime, room, type, campusName, campusAddress, editingId, updateSchedule, addSchedule, onClose]);

    const handleDelete = useCallback(() => {
        if (!editingId) return;
        Alert.alert('Xác nhận', 'Bạn có muốn xóa lịch này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteSchedule(editingId);
                        onClose();
                    } catch (err) {
                        Alert.alert('Lỗi', err.message || 'Không xóa được');
                    }
                }
            }
        ]);
    }, [editingId, deleteSchedule, onClose]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    style={styles.keyboardContainer}
                >
                    <View style={styles.modalContainer}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingId ? 'Sửa lịch học' : 'Thêm lịch học mới'}
                            </Text>
                            <TouchableOpacity onPress={onClose}>
                                <X color="#6B7280" size={22} />
                            </TouchableOpacity>
                        </View>

                        {/* Scrollable form */}
                        <ScrollView
                            style={styles.scroll}
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.label}>Tên môn học *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập tên môn"
                                value={subjectName}
                                onChangeText={setSubjectName}
                                returnKeyType="done"
                            />

                            <Text style={styles.label}>Loại học phần & Phòng học *</Text>
                            <View style={styles.rowBetween}>
                                <View style={styles.typeBox}>
                                    <TouchableOpacity
                                        onPress={() => setType(prev => prev === 'lt' ? 'th' : 'lt')}
                                        style={styles.typeTouchable}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.typeText}>
                                            {type === 'lt' ? 'Lý thuyết' : 'Thực hành'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <TextInput
                                    style={styles.roomInput}
                                    placeholder="Ví dụ: A101"
                                    value={room}
                                    onChangeText={setRoom}
                                    returnKeyType="done"
                                />
                            </View>


                            <Text style={styles.label}>Thứ *</Text>
                            <View style={styles.pickerWrapper}>
                                <View style={styles.inputBox}>
                                    <Picker
                                        selectedValue={dayOfWeek}
                                        onValueChange={setDayOfWeek}
                                        style={styles.inputDate}
                                    >
                                        {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                                            <Picker.Item key={n} label={dayName(n)} value={n} />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.timeRow}>
                                <View style={styles.timeColumn}>
                                    <Text style={styles.label}>Giờ bắt đầu *</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowStartPicker(true)}
                                        style={styles.timeInputTouchable}
                                    >
                                        <Text style={styles.timeTextValue}>{formatTimeForDisplay(startTime)}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.timeColumn}>
                                    <Text style={styles.label}>Giờ kết thúc *</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowEndPicker(true)}
                                        style={styles.timeInputTouchable}
                                    >
                                        <Text style={styles.timeTextValue}>{formatTimeForDisplay(endTime)}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {showStartPicker && (
                                <DateTimePicker
                                    value={startTime}
                                    mode="time"
                                    is24Hour
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onStartTimeChange}
                                />
                            )}
                            {showEndPicker && (
                                <DateTimePicker
                                    value={endTime}
                                    mode="time"
                                    is24Hour
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={onEndTimeChange}
                                />
                            )}

                            <View style={{ marginTop: 12, position: 'relative' }}>
                                <Text style={styles.label}>Cơ sở học (tùy chọn)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nhập tên cơ sở"
                                    value={campusName}
                                    onChangeText={handleCampusNameChange}
                                    onFocus={() => setShowSuggestions(!!campusName)}
                                    returnKeyType="done"
                                />

                                {showSuggestions && campusSuggestions.length > 0 && (
                                    <View style={{ marginBottom: 100 }}>
                                        <ScrollView
                                            style={styles.suggestionBox}
                                            keyboardShouldPersistTaps="handled"
                                            nestedScrollEnabled={true}
                                            showsVerticalScrollIndicator={true}
                                        >
                                            {loadingCampuses ? (
                                                <ActivityIndicator style={{ padding: 12 }} />
                                            ) : (
                                                campusSuggestions.map(item => (
                                                    <TouchableOpacity
                                                        key={String(item.cam_id ?? item.id ?? item.name)}
                                                        style={styles.suggestionItem}
                                                        onPress={() => pickCampusSuggestion(item)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <View style={styles.suggestionContent}>
                                                            <View style={styles.suggestionTextContainer}>
                                                                <Text style={styles.suggestionName}>{item.name}</Text>
                                                                {item.address && (
                                                                    <Text style={styles.suggestionAddress}>{item.address}</Text>
                                                                )}
                                                            </View>

                                                            {/* Nút xóa với icon thùng rác - nằm bên phải cùng */}
                                                            <TouchableOpacity
                                                                onPress={(e) => handleDeleteCampus(item, e)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </TouchableOpacity>
                                                        </View>
                                                    </TouchableOpacity>
                                                ))
                                            )}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            <Text style={styles.label}>Địa chỉ</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    isCampusFromSuggestion && styles.disabledInput
                                ]}
                                placeholder="Địa chỉ (nếu cơ sở mới)"
                                value={campusAddress}
                                onChangeText={handleCampusAddressChange}
                                editable={!isCampusFromSuggestion}
                            />

                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={onClose}
                                    disabled={isSubmitting}
                                >
                                    <Text style={[styles.buttonText, styles.buttonTextCancel]}>Hủy</Text>
                                </TouchableOpacity>

                                {editingId && (
                                    <TouchableOpacity
                                        style={[styles.button, styles.deleteButton]}
                                        onPress={handleDelete}
                                        disabled={isSubmitting}
                                    >
                                        <Text style={[styles.buttonText, { color: '#fff' }]}>Xóa</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[styles.button, styles.submitButton]}
                                    onPress={handleSave}
                                    disabled={isSubmitting}
                                >
                                    <Text style={[styles.buttonText, styles.buttonTextSubmit]}>
                                        {editingId ? 'Cập nhật' : 'Thêm mới'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardContainer: {
        width: '90%',
        maxHeight: '85%',
        justifyContent: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        paddingBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
    },
    pickerWrapper: {
        marginBottom: 5,
    },
    scroll: {
        flexGrow: 0,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    label: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 6,
        marginTop: 6,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        backgroundColor: '#fff',
        color: '#111827',
    },
    inputDate: {
        height: 50,
        width: '100%',
    },
    inputBox: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
    },
    typeBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        backgroundColor: '#fff',
    },
    typeTouchable: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeText: {
        fontSize: 15,
        color: '#111827',
    },
    roomInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        backgroundColor: '#fff',
        color: '#111827',
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        gap: 10,
    },
    timeColumn: {
        flex: 1,
    },
    timeInputTouchable: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
    },
    timeTextValue: {
        fontSize: 16,
        color: '#111827',
    },
    suggestionBox: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        maxHeight: 200,
        zIndex: 1000,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    // Sửa lại styles cho suggestion item
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    suggestionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    suggestionTextContainer: {
        flex: 1,
        marginRight: 8,
    },
    suggestionName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#111827',
    },
    suggestionAddress: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 10,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    disabledInput: {
        backgroundColor: '#f3f4f6',
        color: '#6b7280',
    },
    cancelButton: { backgroundColor: '#F3F4F6' },
    submitButton: { backgroundColor: '#2563EB' },
    deleteButton: { backgroundColor: '#EF4444' },
    buttonText: { fontWeight: '600', fontSize: 15 },
    buttonTextCancel: { color: '#374151' },
    buttonTextSubmit: { color: '#fff' },
});