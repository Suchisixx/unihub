import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    Pressable,
} from 'react-native';
import { Plus, Settings, Calendar } from 'lucide-react-native';
import { useSchedules } from '../context/scheduleContext';
import { useSemester } from '../context/semesterContext';
import { dayName } from '../components/utils/dateUtils';
import ScheduleCard from '../components/schedule/ScheduleCard';
import ScheduleTabs from '../components/schedule/ScheduleTabs';
import ScheduleModal from '../components/schedule/ScheduleModal';
import ImportScheduleModal from '../components/schedule/ImportScheduleModal';
import YearModal from '../components/years/YearModal';
import SemesterModal from '../components/semester/SemesterModal';

const DAY_ORDER = [2, 3, 4, 5, 6, 7, 8];

const sortAndGroupSchedules = (schedules) => {
    if (!schedules || schedules.length === 0) return [];

    const grouped = schedules.reduce((acc, schedule) => {
        const day = schedule.day_of_week;
        if (day && day >= 2 && day <= 8) {
            if (!acc[day]) {
                acc[day] = [];
            }
            acc[day].push(schedule);
        }
        return acc;
    }, {});

    DAY_ORDER.forEach(dayKey => {
        if (grouped[dayKey]) {
            grouped[dayKey].sort((a, b) => {
                if (a.start_time < b.start_time) return -1;
                if (a.start_time > b.start_time) return 1;
                return 0;
            });
        }
    });

    return DAY_ORDER
        .filter(dayKey => grouped[dayKey] && grouped[dayKey].length > 0)
        .map(dayKey => ({
            dayNumber: dayKey,
            dayName: dayName(dayKey),
            schedules: grouped[dayKey]
        }));
};

export default function ScheduleScreen({ setCurrentScreen }) {
    const {
        ltSchedules,
        thSchedules,
        loading,
        addSchedule,
        updateSchedule,
        deleteSchedule,
    } = useSchedules();

    const { selectedSemester, fetchYearsAndSemesters } = useSemester();

    const [activeTab, setActiveTab] = useState('lt');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [yearModalVisible, setYearModalVisible] = useState(false);
    const [semesterModalVisible, setSemesterModalVisible] = useState(false);
    const [isAddSelectionVisible, setAddSelectionVisible] = useState(false);
    const [isImportModalVisible, setImportModalVisible] = useState(false);
    const [isManagementMenuVisible, setManagementMenuVisible] = useState(false);

    // Sử dụng useMemo để tối ưu hiệu suất
    const currentSchedules = useMemo(() =>
        activeTab === 'lt' ? ltSchedules : thSchedules,
        [activeTab, ltSchedules, thSchedules]
    );

    const sortedGroupedSchedules = useMemo(() =>
        sortAndGroupSchedules(currentSchedules),
        [currentSchedules]
    );

    // Sử dụng useCallback để tránh re-render không cần thiết
    const handleAdd = useCallback(() => {
        setAddSelectionVisible(true);
    }, []);

    const handleAddManual = useCallback(() => {
        setEditingItem(null);
        setModalVisible(true);
        setAddSelectionVisible(false);
    }, []);

    const handleAddImport = useCallback(() => {
        if (!selectedSemester?.sem_id) {
            Alert.alert('Cảnh báo', 'Vui lòng chọn đúng học kỳ ở topbar trên cùng trước khi Import.');
            setAddSelectionVisible(false);
            return;
        }
        setImportModalVisible(true);
        setAddSelectionVisible(false);
    }, [selectedSemester]);

    const handleImportSuccess = useCallback(() => {
        setImportModalVisible(false);
    }, []);

    const handleEdit = useCallback((item) => {
        setEditingItem(item);
        setModalVisible(true);
    }, []);

    const handleDelete = useCallback((scheduleId) => {
        Alert.alert('Xác nhận xóa', 'Bạn có chắc muốn xóa lịch học này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteSchedule(scheduleId);
                    } catch (error) {
                        console.error('Delete error:', error);
                        Alert.alert('Lỗi', 'Không xóa được lịch học');
                    }
                },
            },
        ]);
    }, [deleteSchedule]);

    const handleCloseModal = useCallback(() => {
        setModalVisible(false);
        setEditingItem(null);
    }, []);

    const handleSubmitFromModal = useCallback(async (formData) => {
        try {
            if (!selectedSemester?.sem_id) {
                Alert.alert('Lỗi', 'Bạn chưa chọn học kỳ ở thanh trên cùng!');
                return;
            }

            const payload = {
                ...formData,
                sem_id: selectedSemester.sem_id,
            };

            if (editingItem && editingItem.schedule_id) {
                await updateSchedule(editingItem.schedule_id, { ...payload });
            } else {
                await addSchedule(payload);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Submit error:', error);
            const message = error?.message || error?.sqlMessage || 'Không thể lưu lịch học';
            Alert.alert('Lỗi', message);
        }
    }, [selectedSemester, editingItem, updateSchedule, addSchedule, handleCloseModal]);

    const handleNavigateToYearSemester = useCallback(() => {
        if (typeof setCurrentScreen === 'function') {
            setCurrentScreen('yearSemester');
        } else {
            console.error("setCurrentScreen không phải là hàm:", setCurrentScreen);
            Alert.alert('Lỗi Điều hướng', 'Không thể chuyển trang. Thiếu hàm điều hướng.');
        }
    }, [setCurrentScreen]);

    // Render empty state
    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
                {activeTab === 'lt' ? '📚 Chưa có lịch lý thuyết' : '🔬 Chưa có lịch thực hành'}
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
                <Text style={styles.emptyButtonText}>Thêm lịch học đầu tiên</Text>
            </TouchableOpacity>
        </View>
    );

    // Render schedule list
    const renderScheduleList = () => (
        sortedGroupedSchedules.map((dayGroup) => (
            <View key={dayGroup.dayNumber} style={dayGroupStyles.dayGroupContainer}>
                <Text style={dayGroupStyles.dayHeader}>{dayGroup.dayName}</Text>
                {dayGroup.schedules.map((item) => (
                    <ScheduleCard
                        key={item.schedule_id}
                        item={item}
                        onEdit={() => handleEdit(item)}
                        onDelete={() => handleDelete(item.schedule_id)}
                    />
                ))}
            </View>
        ))
    );

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Calendar size={24} color="#2563EB" />
                    <Text style={styles.title}>Thời khóa biểu</Text>
                </View>

                <View style={styles.headerRight}>
                    {/* Nút quản lý với menu dropdown */}
                    <TouchableOpacity
                        style={styles.managementButton}
                        onPress={() => setManagementMenuVisible(true)}
                    >
                        <Settings size={20} color="#6B7280" />
                    </TouchableOpacity>

                    {/* Nút thêm mới */}
                    <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                        <Plus size={20} color="#fff" />
                        <Text style={styles.addButtonText}>Thêm mới</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* TABS - ĐÃ ĐƯỢC CẢI THIỆN */}
            <ScheduleTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* CONTENT */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {loading ? (
                    <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
                ) : sortedGroupedSchedules.length > 0 ? (
                    renderScheduleList()
                ) : (
                    renderEmptyState()
                )}
            </ScrollView>

            {/* MODALS */}
            {modalVisible && (
                <ScheduleModal
                    visible={modalVisible}
                    onClose={handleCloseModal}
                    onSubmit={handleSubmitFromModal}
                    editingItem={editingItem}
                />
            )}

            {yearModalVisible && (
                <YearModal
                    visible={yearModalVisible}
                    onClose={() => setYearModalVisible(false)}
                    onSubmit={handleYearAdded}
                />
            )}

            {semesterModalVisible && (
                <SemesterModal
                    visible={semesterModalVisible}
                    onClose={() => setSemesterModalVisible(false)}
                    onSubmit={handleSemesterAdded}
                />
            )}

            {isImportModalVisible && (
                <ImportScheduleModal
                    visible={isImportModalVisible}
                    onClose={() => setImportModalVisible(false)}
                    onSubmit={handleImportSuccess}
                />
            )}

            {/* MODAL LỰA CHỌN THÊM MỚI */}
            <Modal
                visible={isAddSelectionVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setAddSelectionVisible(false)}
            >
                <Pressable
                    style={styles.selectionOverlay}
                    onPress={() => setAddSelectionVisible(false)}
                >
                    <View style={styles.selectionContainer} onStartShouldSetResponder={() => true}>
                        <Text style={styles.selectionTitle}>Thêm lịch học</Text>
                        <TouchableOpacity
                            style={styles.selectionOption}
                            onPress={handleAddManual}
                        >
                            <Text style={styles.selectionText}>📝 Nhập thủ công</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.selectionOption}
                            onPress={handleAddImport}
                        >
                            <Text style={styles.selectionText}>📁 Nhập từ File (.csv)</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

            {/* MODAL MENU QUẢN LÝ */}
            <Modal
                visible={isManagementMenuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setManagementMenuVisible(false)}
            >
                <Pressable
                    style={styles.selectionOverlay}
                    onPress={() => setManagementMenuVisible(false)}
                >
                    <View style={styles.managementMenuContainer} onStartShouldSetResponder={() => true}>
                        <Text style={styles.menuTitle}>Quản lý thời gian học</Text>

                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => {
                                setManagementMenuVisible(false);
                                handleNavigateToYearSemester();
                            }}
                        >
                            <Text style={styles.menuOptionText}>📅 Quản lý năm & học kỳ</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => {
                                setManagementMenuVisible(false);
                                setYearModalVisible(true);
                            }}
                        >
                            <Text style={styles.menuOptionText}>➕ Thêm năm học</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuOption}
                            onPress={() => {
                                setManagementMenuVisible(false);
                                setSemesterModalVisible(true);
                            }}
                        >
                            <Text style={styles.menuOptionText}>🎯 Thêm học kỳ</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        marginBottom: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827'
    },
    managementButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563EB',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 80,
    },
    loader: {
        marginTop: 40
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 16,
    },
    emptyButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    emptyButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14
    },
    selectionOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '80%',
        paddingVertical: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    selectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
        textAlign: 'center',
    },
    selectionOption: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    selectionText: {
        fontSize: 14,
        color: '#374151',
        textAlign: 'center',
    },
    managementMenuContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '80%',
        paddingVertical: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'center',
    },
    menuOption: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    menuOptionText: {
        fontSize: 14,
        color: '#374151',
        textAlign: 'center',
    },
});

const dayGroupStyles = StyleSheet.create({
    dayGroupContainer: {
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    dayHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 10,
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 4,
    },
});