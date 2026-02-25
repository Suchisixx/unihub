import { AuthProvider } from './context/authContext';
import { SemesterProvider } from './context/semesterContext'
import { ScheduleProvider } from './context/scheduleContext';
import { CampusProvider } from './context/campusContext';
import { NoteProvider } from './context/noteContext';
import { ExpenseProvider } from './context/expenseContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigators from './components/navigation/AppNavigators';
import { StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { registerForNotificationsAsync } from './services/notificationService';
import { AILearningProvider } from './context/AILearningContext';
import { NetworkProvider } from './context/networkContext';

export default function App() {

  useEffect(() => {
    // Yêu cầu quyền thông báo khi ứng dụng khởi động
    registerForNotificationsAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <AuthProvider>
          <SemesterProvider>
            <ScheduleProvider>
              <CampusProvider>
                <NoteProvider>
                  <ExpenseProvider>
                    <AILearningProvider>
                      <AppNavigators />
                    </AILearningProvider>
                  </ExpenseProvider>
                </NoteProvider>
              </CampusProvider>
            </ScheduleProvider>
          </SemesterProvider>
        </AuthProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
