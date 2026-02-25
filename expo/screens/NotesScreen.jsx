// screens/NoteScreen.js
import * as WebBrowser from 'expo-web-browser';
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput
} from 'react-native';
// import { Linking } from 'react-native'; // Đã xóa Linking
import { Plus, Search } from 'lucide-react-native';
import { useNotes } from '../context/noteContext';
import { useSemester } from '../context/semesterContext';
import NoteModal from '../components/notes/NoteModal';
import NoteCard from '../components/notes/NoteCard';

const NoteScreen = () => {
    const {
        notes = [],
        subjects = [],
        loading,
        addNote,
        updateNote,
        deleteNote
    } = useNotes();

    const { selectedSemester } = useSemester();

    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const currentSemId = selectedSemester?.sem_id;

    // 🔹 Gom nhóm ghi chú theo môn học
    const groupedNotes = useMemo(() => {
        if (!Array.isArray(notes)) return [];
        const groups = {};

        for (const note of notes) {
            if (!note) continue;
            const subject = note.subject_name || 'Không xác định';
            if (!groups[subject]) {
                groups[subject] = {
                    subject_name: subject,
                    sub_id: note.sub_id,
                    notes: []
                };
            }
            groups[subject].notes.push(note);
        }

        return Object.values(groups).sort((a, b) =>
            a.subject_name.localeCompare(b.subject_name)
        );
    }, [notes]);

    // 🔹 Lọc ghi chú theo từ khóa
    const filteredGroups = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (!term) return groupedNotes;
        return groupedNotes.filter(
            (group) =>
                group.subject_name.toLowerCase().includes(term) ||
                group.notes.some((note) =>
                    note.title.toLowerCase().includes(term)
                )
        );
    }, [groupedNotes, searchTerm]);

    // Handlers
    const handleAdd = () => {
        if (!currentSemId) {
            Alert.alert('Thông báo', 'Vui lòng chọn học kỳ trước khi thêm ghi chú.');
            return;
        }
        setEditingItem(null);
        setModalVisible(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setModalVisible(true);
    };

    const handleDelete = (note_id) => {
        if (!currentSemId) return;
        Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa ghi chú này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteNote(note_id, currentSemId);
                        Alert.alert('Thành công', 'Đã xóa ghi chú.');
                    } catch (err) {
                        Alert.alert('Lỗi', err.message || 'Không thể xóa ghi chú.');
                    }
                }
            }
        ]);
    };

    // Hàm này đã được loại bỏ logic file trong NoteModal/NoteContext, nên không cần thay đổi
    const handleSubmitFromModal = async (formData) => {
        if (!currentSemId) {
            Alert.alert('Lỗi', 'Không tìm thấy học kỳ.');
            return;
        }

        const payload = { ...formData, sem_id: currentSemId };

        try {
            if (editingItem?.note_id) {
                await updateNote(editingItem.note_id, payload);
                Alert.alert('Thành công', 'Cập nhật ghi chú thành công!');
            } else {
                await addNote(payload);
                Alert.alert('Thành công', 'Thêm ghi chú thành công!');
            }
            setModalVisible(false);
            setEditingItem(null);
        } catch (err) {
            console.error('Submit error:', err);
            Alert.alert('Lỗi', err.message || 'Không thể lưu ghi chú.');
        }
    };

    // Đã xóa hàm openFile liên quan đến tệp đính kèm

    // Render
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Ghi chú môn học</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                    <Plus size={18} color="#fff" />
                    <Text style={styles.addButtonText}>Thêm</Text>
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
                <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm ghi chú hoặc môn học..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
            </View>

            {/* Content */}
            {loading ? (
                <ActivityIndicator size="large" color="#3B82F6" style={styles.loader} />
            ) : filteredGroups.length > 0 ? (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {filteredGroups.map((group) => (
                        <View key={group.subject_name} style={styles.subjectGroup}>
                            <View style={styles.subjectHeader}>
                                <Text style={styles.subjectName}>{group.subject_name}</Text>
                                <Text style={styles.noteCount}>{group.notes.length}</Text>
                            </View>
                            {group.notes.map((item) => (
                                <NoteCard
                                    key={item.note_id}
                                    item={item}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                        {searchTerm
                            ? `Không tìm thấy ghi chú cho "${searchTerm}".`
                            : 'Chưa có ghi chú nào trong học kỳ này.'}
                    </Text>
                    {!searchTerm && (
                        <TouchableOpacity style={styles.emptyButton} onPress={handleAdd}>
                            <Text style={styles.emptyButtonText}>Thêm ghi chú đầu tiên</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Modal */}
            <NoteModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                // onSubmit={handleSubmitFromModal} // NoteModal không còn dùng prop onSubmit này nữa (nó gọi addNote/updateNote trực tiếp từ context)
                editingItem={editingItem}
                subjects={subjects}
            />
        </View>
    );
};

export default NoteScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB', marginBottom: 120 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2563EB',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    // Thanh tìm kiếm
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        marginHorizontal: 16,
        marginVertical: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    searchIcon: { marginRight: 8 },
    searchInput: {
        flex: 1,
        paddingVertical: 8,
        fontSize: 16,
        color: '#111827',
    },
    tabBarPlaceholder: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginBottom: 10,
    },
    activeTab: {
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    content: { flex: 1, paddingHorizontal: 16, },
    loader: { marginTop: 40 },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 16, },
    emptyButton: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, },
    emptyButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
    // Styles cho nhóm môn học
    subjectGroup: {
        marginBottom: 15,
    },
    subjectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 15,
        marginBottom: 8,
        margin: 15,
        borderWidth: 1,
        borderColor: '#000000',
    },
    subjectName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    noteCount: {
        backgroundColor: '#F3F4F6',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '600',
    },
    noteList: {
        paddingLeft: 10,
    }
});