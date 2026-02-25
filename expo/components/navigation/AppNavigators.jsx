import { useState, useContext } from "react";
import { View, StyleSheet } from "react-native";
import { AuthContext } from "../../context/authContext";
import TopBar from "../TopBar";
import BottomNavigation from "../BottomNavigation";
import { NetworkContext } from "../../context/networkContext";

// 5. Đường dẫn screens 
import LoginScreen from "../../screens/LoginScreen";
import SignupScreen from "../../screens/SignupScreen";
import HomeScreen from "../../screens/Home";
import ScheduleScreen from "../../screens/ScheduleScreen";
import NotesScreen from "../../screens/NotesScreen";
import ExpenseScreen from "../../screens/ExpenseScreen";
import SettingScreen from "../../screens/SettingScreen";
import YearSemesterScreen from "../../screens/YearSemesterScreen";
import AIScreen from "../../screens/AIScreen";
import ReportScreen from "../../screens/ReportScreen";

const screens = {
  dashboard: HomeScreen,
  tkb: ScheduleScreen,
  notes: NotesScreen,
  expense: ExpenseScreen,
  reports: ReportScreen,
  setting: SettingScreen,
  yearSemester: YearSemesterScreen,
  ai: AIScreen
};

export default function AppNavigators() {
  const { user } = useContext(AuthContext);
  const [showSignup, setShowSignup] = useState(false);
  const [currentScreen, setCurrentScreen] = useState("dashboard");
  // Lắng nghe thay đổi trạng thái mạng
  const [isOnline, setIsOnline] = useState(NetworkContext);
  const ScreenComponent = screens[currentScreen];

  // --- Phần Login/Signup ---
  if (!user) {
    if (showSignup) {
      return <SignupScreen onLogin={() => setShowSignup(false)} />;
    }
    return <LoginScreen onSignUp={() => setShowSignup(true)} />;
  }

  // --- Phần App chính ---
  // 6. Sửa lại cấu trúc layout dùng SafeAreaView
  return (
    // 1. Dùng View thường lấp đầy màn hình
    <View style={styles.fullScreenContainer}>
      {/* Banner lỗi mạng */}
      {!isOnline && (
        <View style={styles.networkErrorBanner}>
          <Text style={styles.networkErrorText}>Không có kết nối mạng, bạn vui lòng thử lại để sử dụng ứng dụng</Text>
        </View>
      )}
      {/* 2. TopBar có thể dùng SafeAreaView nội bộ để đẩy content xuống */}
      <TopBar />

      {/* 3. Vùng nội dung màn hình chính (cuộn được) */}
      {/* Cần paddingBottom để tránh bị BottomNavigation che mất */}
      <View style={styles.contentContainer}>
        <ScreenComponent setCurrentScreen={setCurrentScreen} />
      </View>

      {/* 4. BottomNavigation được cố định bằng position: 'absolute' trong chính nó */}
      <BottomNavigation
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
      />
    </View>
  );
}

// 7. Sửa lại styles cho phù hợp
const styles = StyleSheet.create({
  fullScreenContainer: { // Style mới cho View thay thế SafeAreaView
    flex: 1,
    backgroundColor: "#F9FAFB", // Màu nền chung 
  },
  contentContainer: {
    flex: 1,
  },
  networkErrorBanner: {
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  networkErrorText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});