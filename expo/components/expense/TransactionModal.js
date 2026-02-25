import { useState, useEffect, useMemo } from 'react';
import {
    View, Text, Modal, TextInput, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, Platform, ScrollView
} from 'react-native';
import { X, Calendar } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useExpenses } from '../../context/expenseContext';
import dayjs from 'dayjs';

// Enum loại giao dịch
const TRANSACTION_TYPES = [
    { label: 'Thu nhập', value: 'thu' },
    { label: 'Chi tiêu', value: 'chi' },
];

// Helper: lấy id/label từ object category một cách an toàn
// Helper: chuyển đổi danh mục an toàn
const getCategoryId = (c) => String(c?.cate_id ?? c?.id ?? '');
const getCategoryLabel = (c) => c?.name ?? c?.category_name ?? 'Không tên';
const getCategoryType = (c) => (c?.type === 'thu' || c?.type === 'chi' ? c.type : 'chi');

export default function TransactionModal({ visible, onClose, editingItem }) {
    const {
        addTransaction,
        updateTransaction,
        categories = [], // Categories được lấy từ Context
    } = useExpenses() || {};

    const [type, setType] = useState('chi');
    const [amount, setAmount] = useState('');
    const [cate_id, setCateId] = useState(''); // stored as string
    const [trans_date, setTransDate] = useState(new Date());
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const normalizeType = (rawType) => {
        if (rawType === undefined || rawType === null) return '';
        const t = String(rawType).toLowerCase();
        if (['chi', 'expense', '0'].includes(t)) return 'chi';
        if (['thu', 'income', '1'].includes(t)) return 'thu';
        return t;
    };

    // Filter categories theo type một cách an toàn (sẽ chạy lại khi categories hoặc type thay đổi)
    const currentCategoryList = useMemo(() => {
        if (!Array.isArray(categories) || categories.length === 0) return [];
        return categories.filter(cat => getCategoryType(cat) === type);
    }, [categories, type]);

    // 💡 FIX A: Logic Khởi tạo và Chế độ Chỉnh sửa
    useEffect(() => {
        if (!visible) return;

        if (editingItem) {
            // Chế độ EDIT
            setType(editingItem.type ?? 'chi');
            setAmount(String(editingItem.amount ?? ''));
            setCateId(String(editingItem.cate_id ?? getCategoryId(editingItem) ?? ''));
            setTransDate(editingItem.trans_date ? new Date(editingItem.trans_date) : new Date());
            setDescription(editingItem.description ?? '');

        } else {
            // Chế độ THÊM MỚI
            setType('chi');
            setAmount('');

            // FIX: Sử dụng dayjs để lấy ngày hiện tại
            setTransDate(dayjs().startOf('day').toDate());
            setDescription('');
        }
    }, [visible, editingItem]);

    // Logic Đồng bộ Type -> Category (Chỉ chạy khi Thêm mới và Type thay đổi)
    useEffect(() => {
        if (!visible) return;
        if (editingItem) return; // tránh reset khi đang edit

        const defaultCate = currentCategoryList[0];
        setCateId(defaultCate ? getCategoryId(defaultCate) : '');
    }, [type, currentCategoryList, visible]);


    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            // Tạo lại date theo local timezone để không bị lệch khi lưu
            const localDate = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                selectedDate.getDate()
            );
            setTransDate(localDate);
        }
    };

    const handleSubmit = async () => {
        const amountValue = parseFloat(amount);

        if (isNaN(amountValue) || amountValue <= 0) {
            Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ.');
            return;
        }

        if (!cate_id) {
            Alert.alert('Lỗi', 'Vui lòng chọn danh mục.');
            return;
        }

        // Chuẩn hoá ngày theo múi giờ Việt Nam (GMT+7)
        const localDate = new Date(
            trans_date.getFullYear(),
            trans_date.getMonth(),
            trans_date.getDate()
        );
        const localISO = dayjs(trans_date).format('YYYY-MM-DD');

        const payload = {
            amount: amountValue,
            type,
            cate_id: parseInt(cate_id, 10),
            trans_date: localISO,
            description: description.trim() || null,
        };

        try {
            setIsSubmitting(true);
            if (editingItem?.trans_id) {
                await updateTransaction(editingItem.trans_id || editingItem.id, payload);
                Alert.alert('Thành công', 'Cập nhật giao dịch thành công!');
            } else {
                await addTransaction(payload);
                Alert.alert('Thành công', 'Thêm giao dịch thành công!');
            }
            onClose();
        } catch (err) {
            console.error('Lỗi lưu giao dịch:', err);
            Alert.alert('Lỗi', err?.message || 'Không thể lưu giao dịch.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) onClose();
    };

    // Nếu danh mục của loại hiện tại rỗng thì disable picker và show text
    const noCategoriesForType = currentCategoryList.length === 0;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <TouchableOpacity style={styles.closeButton} onPress={handleClose} disabled={isSubmitting}>
                        <X size={24} color="#6B7280" />
                    </TouchableOpacity>

                    <Text style={styles.modalTitle}>{editingItem ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}</Text>

                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <Text style={styles.label}>Loại giao dịch</Text>
                        <View style={styles.toggleRow}>
                            {TRANSACTION_TYPES.map(t => (
                                <TouchableOpacity
                                    key={t.value}
                                    style={[styles.toggleButton, type === t.value && styles.toggleActive]}
                                    onPress={() => setType(t.value)}
                                    disabled={isSubmitting}
                                >
                                    <Text style={[styles.toggleText, type === t.value && styles.toggleTextActive]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Số tiền (VNĐ)</Text>
                        <TextInput
                            style={styles.input}
                            onChangeText={text => setAmount(text.replace(/[^0-9]/g, ''))}
                            value={amount}
                            placeholder="Ví dụ: 150000"
                            keyboardType="numeric"
                            editable={!isSubmitting}
                            placeholderTextColor="#9CA3AF"
                        />

                        <Text style={styles.label}>Danh mục</Text>
                        <View style={styles.pickerContainer}>
                            {noCategoriesForType ? (
                                <Text style={{ padding: 12, color: '#6B7280' }}>Chưa có danh mục cho loại này</Text>
                            ) : (
                                <Picker
                                    selectedValue={cate_id}
                                    onValueChange={(value) => setCateId(value)}
                                    style={styles.picker}
                                    enabled={!isSubmitting}
                                >
                                    {/* Picker.Item yêu cầu value là string */}
                                    {currentCategoryList.map((c) => {
                                        const val = getCategoryId(c);
                                        const lab = getCategoryLabel(c);
                                        return (
                                            <Picker.Item
                                                key={getCategoryId(c)}
                                                label={getCategoryLabel(c)}
                                                value={getCategoryId(c)}
                                            />
                                        );
                                    })}
                                </Picker>
                            )}
                        </View>

                        <Text style={styles.label}>Ngày giao dịch</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateInput} disabled={isSubmitting}>
                            <Calendar size={18} color="#4B5563" style={{ marginRight: 10 }} />
                            <Text style={styles.dateText}>{trans_date.toLocaleDateString('vi-VN')}</Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={trans_date}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onDateChange}
                                maximumDate={new Date()}
                            />
                        )}

                        <Text style={styles.label}>Mô tả</Text>
                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            onChangeText={setDescription}
                            value={description}
                            placeholder="Mô tả giao dịch"
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={3}
                            editable={!isSubmitting}
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, (isSubmitting || !amount || !cate_id) && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isSubmitting || !amount || !cate_id}
                        >
                            {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>{editingItem ? 'Cập nhật' : 'Thêm giao dịch'}</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

// giữ nguyên styles
const styles = StyleSheet.create({
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { width: '90%', backgroundColor: 'white', borderRadius: 15, padding: 20, elevation: 5, maxHeight: '85%' },
    closeButton: { position: 'absolute', top: 10, right: 10, padding: 10, zIndex: 10 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 10 },
    scrollContent: { paddingBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 15 },
    input: { height: 45, backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 15, fontSize: 16, color: '#1F2937', borderWidth: 1, borderColor: '#D1D5DB' },
    multilineInput: { height: 80, paddingTop: 10, textAlignVertical: 'top' },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    toggleButton: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 5, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' },
    toggleActive: { backgroundColor: '#E0F2FE', borderColor: '#2563EB' },
    toggleText: { fontSize: 15, fontWeight: '600', color: '#4B5563' },
    toggleTextActive: { color: '#2563EB' },
    pickerContainer: { backgroundColor: '#F3F4F6', borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', justifyContent: 'center', height: 45, overflow: 'hidden' },
    picker: { height: 60, color: '#1F2937' },
    dateInput: { flexDirection: 'row', alignItems: 'center', height: 45, backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 15, borderWidth: 1, borderColor: '#D1D5DB' },
    dateText: { fontSize: 16, color: '#1F2937' },
    submitButton: { backgroundColor: '#2563EB', borderRadius: 8, paddingVertical: 14, marginTop: 25, alignItems: 'center' },
    submitButtonDisabled: { backgroundColor: '#93C5FD' },
    submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});