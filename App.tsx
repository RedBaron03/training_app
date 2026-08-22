import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Screen = 'home' | 'strength' | 'cardio' | 'recent' | 'settings';
type WorkoutType = 'strength' | 'cardio';
type Entry = { id: string; title: string; detail: string; accent: string; type: WorkoutType };

const initialEntries: Entry[] = [];

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [entries, setEntries] = useState(initialEntries);
  const [exercise, setExercise] = useState('');
  const [repetitions, setRepetitions] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState('Jogging');
  const [duration, setDuration] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [strengthGoal, setStrengthGoal] = useState('3');
  const [cardioGoal, setCardioGoal] = useState('3');
  const recordingStartedAt = useRef<number | null>(null);

  const addStrength = () => {
    if (!exercise.trim()) return;
    setEntries([{ id: createEntryId(), title: exercise, detail: `${repetitions || 0} reps · ${weight || 0} kg`, accent: '#D96C4F', type: 'strength' }, ...entries]);
    setExercise('');
    setRepetitions('');
    setWeight('');
    setScreen('home');
  };

  const addCardio = () => {
    if (!duration.trim()) return;
    setEntries([{ id: createEntryId(), title: activity, detail: `${duration} min · sensor data pending`, accent: '#4D8C78', type: 'cardio' }, ...entries]);
    setDuration('');
    setScreen('home');
  };

  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => {
      if (recordingStartedAt.current) {
        setRecordingSeconds(Math.floor((Date.now() - recordingStartedAt.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  const startRecording = () => {
    recordingStartedAt.current = Date.now();
    setRecordingSeconds(0);
    setIsRecording(true);
  };

  const stopRecording = () => {
    const seconds = recordingStartedAt.current ? Math.floor((Date.now() - recordingStartedAt.current) / 1000) : recordingSeconds;
    setRecordingSeconds(seconds);
    setDuration(String(Math.max(1, Math.ceil(seconds / 60))));
    recordingStartedAt.current = null;
    setIsRecording(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {screen === 'home' && <Home entries={entries} strengthGoal={strengthGoal} cardioGoal={cardioGoal} onAdd={() => setScreen('strength')} onCardio={() => setScreen('cardio')} onRecent={() => setScreen('recent')} onSettings={() => setScreen('settings')} />}
        {screen === 'recent' && <RecentActivities entries={entries} onBack={() => setScreen('home')} />}
        {screen === 'settings' && <Settings strengthGoal={strengthGoal} cardioGoal={cardioGoal} onStrengthGoalChange={setStrengthGoal} onCardioGoalChange={setCardioGoal} onBack={() => setScreen('home')} />}
        {screen === 'strength' && (
          <EntryForm title="Log strength" subtitle="Record the work you completed." onBack={() => setScreen('home')} onSave={addStrength}>
            <Text style={styles.fieldLabel}>Exercise</Text>
            <ExerciseDropdown value={exercise} onChange={setExercise} />
            <View style={styles.fieldRow}>
              <Field label="Repetitions" value={repetitions} onChangeText={setRepetitions} placeholder="12" keyboardType="numeric" />
              <Field label="Weight (kg)" value={weight} onChangeText={setWeight} placeholder="40" keyboardType="decimal-pad" />
            </View>
          </EntryForm>
        )}
        {screen === 'cardio' && (
          <EntryForm title="Log cardio" subtitle="Add a walk, jog, or run." onBack={() => setScreen('home')} onSave={addCardio}>
            <Text style={styles.fieldLabel}>Activity</Text>
            <ActivityDropdown value={activity} onChange={setActivity} />
            <View style={styles.recordingCard}>
              <Text style={styles.recordingTime}>{formatRecordingTime(recordingSeconds)}</Text>
              <Text style={styles.recordingStatus}>{isRecording ? 'Recording workout' : 'Ready to record'}</Text>
              <View style={styles.recordingActions}>
                <Pressable style={[styles.recordButton, isRecording && styles.recordButtonDisabled]} onPress={startRecording} disabled={isRecording}>
                  <Text style={styles.recordButtonText}>Start</Text>
                </Pressable>
                <Pressable style={[styles.stopButton, !isRecording && styles.stopButtonDisabled]} onPress={stopRecording} disabled={!isRecording}>
                  <Text style={styles.stopButtonText}>Stop</Text>
                </Pressable>
              </View>
            </View>
            <Field label="Duration (minutes)" value={duration} onChangeText={setDuration} placeholder="30" keyboardType="numeric" />
            <View style={styles.sensorCard}>
              <Text style={styles.sensorTitle}>Phone & watch data</Text>
              <Text style={styles.sensorDetail}>Speed, steps, heart rate, and route will appear here when device permissions and wearable sync are connected.</Text>
              <View style={styles.sensorGrid}>
                <Metric label="Speed" value="-- km/h" />
                <Metric label="Steps" value="--" />
                <Metric label="Heart rate" value="-- bpm" />
              </View>
            </View>
          </EntryForm>
        )}
      </ScrollView>
      <View style={styles.navBar}>
        <NavButton label="Overview" active={screen === 'home'} onPress={() => setScreen('home')} />
        <NavButton label="Strength" active={screen === 'strength'} onPress={() => setScreen('strength')} />
        <NavButton label="Cardio" active={screen === 'cardio'} onPress={() => setScreen('cardio')} />
        <NavButton label="Recent" active={screen === 'recent'} onPress={() => setScreen('recent')} />
      </View>
    </SafeAreaView>
  );
}

function Home({ entries, strengthGoal, cardioGoal, onAdd, onCardio, onRecent, onSettings }: { entries: Entry[]; strengthGoal: string; cardioGoal: string; onAdd: () => void; onCardio: () => void; onRecent: () => void; onSettings: () => void }) {
  const strengthPercentage = getGoalPercentage(entries.filter((entry) => entry.type === 'strength').length, strengthGoal);
  const cardioPercentage = getGoalPercentage(entries.filter((entry) => entry.type === 'cardio').length, cardioGoal);

  return (
    <>
      <View style={styles.header}>
        <View><Text style={styles.eyebrow}>WEDNESDAY, AUGUST 20</Text><Text style={styles.title}>Train with{`\n`}intention.</Text></View>
        <Pressable style={styles.avatar} onPress={onSettings} accessibilityLabel="Open settings"><Text style={styles.avatarText}>J</Text></Pressable>
      </View>
      <View style={styles.progressCard}>
        <View style={styles.progressCopy}><Text style={styles.cardLabel}>THIS WEEK</Text><Text style={styles.progressTitle}>{entries.length} sessions logged</Text><Text style={styles.progressDetail}>Keep building your routine</Text></View>
        <View style={styles.progressRings}><ProgressCircle label="Cardio" percentage={cardioPercentage} accent="#4D8C78" /><ProgressCircle label="Strength" percentage={strengthPercentage} accent="#D96C4F" /></View>
      </View>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Log a workout</Text></View>
      <View style={styles.actionRow}>
        <Pressable style={[styles.actionCard, styles.strengthAction]} onPress={onAdd}><Text style={styles.actionIcon}>+</Text><Text style={styles.actionTitle}>Strength</Text><Text style={styles.actionDetail}>Reps and kg</Text></Pressable>
        <Pressable style={[styles.actionCard, styles.cardioAction]} onPress={onCardio}><Text style={styles.actionIcon}>→</Text><Text style={styles.actionTitle}>Cardio</Text><Text style={styles.actionDetail}>Time and sensors</Text></Pressable>
      </View>
      <Pressable style={styles.sectionHeader} onPress={onRecent}><Text style={styles.sectionTitle}>Recent activity</Text><Text style={styles.sectionLink}>View all ›</Text></Pressable>
      {entries.slice(0, 4).map((entry) => <View key={entry.id} style={styles.sessionRow}><View style={[styles.sessionMark, { backgroundColor: entry.accent }]} /><View style={styles.sessionCopy}><Text style={styles.sessionTitle}>{entry.title}</Text><Text style={styles.sessionDetail}>{entry.detail}</Text></View><Text style={styles.chevron}>›</Text></View>)}
    </>
  );
}

function ProgressCircle({ label, percentage, accent }: { label: string; percentage: number; accent: string }) {
  return <View style={styles.progressCircleGroup}><View style={[styles.progressRing, { borderColor: accent }]}><Text style={styles.progressNumber}>{percentage}%</Text></View><Text style={styles.progressCircleLabel}>{label}</Text></View>;
}

function Settings({ strengthGoal, cardioGoal, onStrengthGoalChange, onCardioGoalChange, onBack }: { strengthGoal: string; cardioGoal: string; onStrengthGoalChange: (value: string) => void; onCardioGoalChange: (value: string) => void; onBack: () => void }) {
  return <><Pressable style={styles.backButton} onPress={onBack} hitSlop={8}><Text style={styles.back}>‹ Back</Text></Pressable><Text style={styles.formTitle}>Settings</Text><Text style={styles.formSubtitle}>Set your weekly training goals.</Text><View style={styles.settingsForm}><Field label="Strength trainings per week" value={strengthGoal} onChangeText={onStrengthGoalChange} placeholder="3" keyboardType="numeric" /><Field label="Cardio trainings per week" value={cardioGoal} onChangeText={onCardioGoalChange} placeholder="3" keyboardType="numeric" /></View></>;
}

function RecentActivities({ entries, onBack }: { entries: Entry[]; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<WorkoutType>('strength');
  const filteredEntries = entries.filter((entry) => entry.type === activeTab);

  return (
    <>
      <Pressable style={styles.backButton} onPress={onBack} hitSlop={8}><Text style={styles.back}>‹ Back</Text></Pressable>
      <Text style={styles.formTitle}>Recent activities</Text>
      <Text style={styles.formSubtitle}>Your complete workout history.</Text>
      <View style={styles.historyTabs}>
        <Pressable style={[styles.historyTab, activeTab === 'strength' && styles.historyTabActive]} onPress={() => setActiveTab('strength')}>
          <Text style={[styles.historyTabText, activeTab === 'strength' && styles.historyTabTextActive]}>Strength</Text>
        </Pressable>
        <Pressable style={[styles.historyTab, activeTab === 'cardio' && styles.historyTabActive]} onPress={() => setActiveTab('cardio')}>
          <Text style={[styles.historyTabText, activeTab === 'cardio' && styles.historyTabTextActive]}>Cardio</Text>
        </Pressable>
      </View>
      {filteredEntries.length > 0 ? filteredEntries.map((entry) => (
        <View key={entry.id} style={styles.sessionRow}>
          <View style={[styles.sessionMark, { backgroundColor: entry.accent }]} />
          <View style={styles.sessionCopy}><Text style={styles.sessionTitle}>{entry.title}</Text><Text style={styles.sessionDetail}>{entry.detail}</Text></View>
          <Text style={styles.chevron}>›</Text>
        </View>
      )) : <Text style={styles.emptyHistory}>No {activeTab} workouts logged yet.</Text>}
    </>
  );
}

function EntryForm({ title, subtitle, onBack, onSave, children }: { title: string; subtitle: string; onBack: () => void; onSave: () => void; children: React.ReactNode }) {
  return <><Pressable style={styles.backButton} onPress={onBack} hitSlop={8}><Text style={styles.back}>‹ Back</Text></Pressable><Text style={styles.formTitle}>{title}</Text><Text style={styles.formSubtitle}>{subtitle}</Text><View style={styles.form}>{children}</View><Pressable style={styles.primaryButton} onPress={onSave}><Text style={styles.primaryButtonText}>Save activity</Text></Pressable></>;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'numeric' | 'decimal-pad' }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#A3AAA3" keyboardType={keyboardType} /></View>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function ActivityDropdown({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const options = ['Walking', 'Jogging', 'Running'];

  return (
    <View style={styles.dropdownContainer}>
      <Pressable style={styles.dropdownButton} onPress={() => setOpen(!open)}>
        <Text style={styles.dropdownText}>{value}</Text>
        <Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && (
        <View style={styles.dropdownMenu}>
          {options.map((option) => (
            <Pressable key={option} style={styles.dropdownOption} onPress={() => { onChange(option); setOpen(false); }}>
              <Text style={[styles.dropdownOptionText, option === value && styles.dropdownOptionActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function ExerciseDropdown({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const options = ['Brustpresse', 'Latzug', 'Schulterpresse', 'Rudern', 'Plank'];

  return (
    <View style={styles.dropdownContainer}>
      <Pressable style={styles.dropdownButton} onPress={() => setOpen(!open)}>
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>{value || 'Select exercise'}</Text>
        <Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && (
        <View style={styles.dropdownMenu}>
          {options.map((option) => (
            <Pressable key={option} style={styles.dropdownOption} onPress={() => { onChange(option); setOpen(false); }}>
              <Text style={[styles.dropdownOptionText, option === value && styles.dropdownOptionActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function formatRecordingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function getGoalPercentage(completed: number, goal: string) {
  const target = Number.parseInt(goal, 10);
  if (!Number.isFinite(target) || target <= 0) return 0;
  return Math.min(100, Math.round((completed / target) * 100));
}

function createEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function NavButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable style={styles.navButton} onPress={onPress}><View style={[styles.navDot, active && styles.navDotActive]} /><Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F5F0' }, container: { padding: 24, paddingBottom: 32 },
  settingsForm: { gap: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }, eyebrow: { color: '#7B817A', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 }, title: { color: '#1D2824', fontSize: 38, fontWeight: '800', lineHeight: 42 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D5E2D8', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#315B4C', fontSize: 18, fontWeight: '800' },
  progressCard: { backgroundColor: '#1D2824', borderRadius: 20, padding: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }, progressCopy: { flex: 1 }, cardLabel: { color: '#AFC9B9', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 12 }, progressTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 6 }, progressDetail: { color: '#C4CEC8', fontSize: 14 }, progressRings: { flexDirection: 'row', gap: 10, marginLeft: 12 }, progressCircleGroup: { alignItems: 'center' }, progressRing: { width: 62, height: 62, borderRadius: 31, borderWidth: 6, alignItems: 'center', justifyContent: 'center' }, progressNumber: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' }, progressCircleLabel: { color: '#C4CEC8', fontSize: 10, fontWeight: '700', marginTop: 5 },
  sectionHeader: { marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: '#1D2824', fontSize: 20, fontWeight: '800' }, sectionLink: { color: '#D96C4F', fontSize: 13, fontWeight: '800' }, actionRow: { flexDirection: 'row', gap: 12, marginBottom: 30 }, actionCard: { flex: 1, borderRadius: 16, padding: 18, minHeight: 126 }, strengthAction: { backgroundColor: '#F2D9D0' }, cardioAction: { backgroundColor: '#D5E2D8' }, actionIcon: { color: '#1D2824', fontSize: 25, fontWeight: '400', marginBottom: 14 }, actionTitle: { color: '#1D2824', fontSize: 17, fontWeight: '800', marginBottom: 5 }, actionDetail: { color: '#59645E', fontSize: 13 },
  sessionRow: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }, sessionMark: { width: 10, height: 42, borderRadius: 5, marginRight: 14 }, sessionCopy: { flex: 1 }, sessionTitle: { color: '#1D2824', fontSize: 16, fontWeight: '700', marginBottom: 5 }, sessionDetail: { color: '#7B817A', fontSize: 13 }, chevron: { color: '#9DA39D', fontSize: 28, fontWeight: '300' },
  navBar: { borderTopWidth: 1, borderTopColor: '#E1E4DD', backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, paddingBottom: 12 }, navButton: { alignItems: 'center', minWidth: 80 }, navDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#B5BBB4', marginBottom: 6 }, navDotActive: { backgroundColor: '#D96C4F', width: 18 }, navText: { color: '#8A928B', fontSize: 12, fontWeight: '700' }, navTextActive: { color: '#D96C4F' },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginBottom: 16 }, back: { color: '#D96C4F', fontSize: 16, fontWeight: '700' }, formTitle: { color: '#1D2824', fontSize: 32, fontWeight: '800', marginBottom: 8 }, formSubtitle: { color: '#7B817A', fontSize: 15, marginBottom: 28 }, form: { gap: 18 }, fieldRow: { flexDirection: 'row', gap: 12 }, field: { flex: 1 }, fieldLabel: { color: '#59645E', fontSize: 13, fontWeight: '700', marginBottom: 8 }, input: { backgroundColor: '#FFFFFF', borderRadius: 12, minHeight: 52, paddingHorizontal: 15, color: '#1D2824', fontSize: 16, borderWidth: 1, borderColor: '#E1E4DD' }, historyTabs: { flexDirection: 'row', backgroundColor: '#E7EEE9', borderRadius: 12, padding: 4, marginBottom: 20 }, historyTab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9 }, historyTabActive: { backgroundColor: '#FFFFFF' }, historyTabText: { color: '#59645E', fontSize: 14, fontWeight: '700' }, historyTabTextActive: { color: '#1D2824', fontWeight: '800' }, emptyHistory: { color: '#7B817A', fontSize: 15, textAlign: 'center', marginTop: 24 }, dropdownContainer: { zIndex: 10, elevation: 10 }, dropdownButton: { backgroundColor: '#FFFFFF', borderRadius: 12, minHeight: 52, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E1E4DD' }, dropdownText: { color: '#1D2824', fontSize: 16 }, dropdownPlaceholder: { color: '#A3AAA3' }, dropdownArrow: { color: '#59645E', fontSize: 12 }, dropdownMenu: { position: 'absolute', top: 58, left: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E1E4DD', overflow: 'hidden', elevation: 10, shadowColor: '#1D2824', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, dropdownOption: { paddingHorizontal: 15, paddingVertical: 14 }, dropdownOptionText: { color: '#59645E', fontSize: 15 }, dropdownOptionActive: { color: '#D96C4F', fontWeight: '800' }, recordingCard: { backgroundColor: '#1D2824', borderRadius: 16, padding: 18, alignItems: 'center' }, recordingTime: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', letterSpacing: 1 }, recordingStatus: { color: '#C4CEC8', fontSize: 13, marginTop: 4, marginBottom: 16 }, recordingActions: { flexDirection: 'row', gap: 10 }, recordButton: { backgroundColor: '#D96C4F', borderRadius: 10, minWidth: 110, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, recordButtonDisabled: { opacity: 0.45 }, recordButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' }, stopButton: { backgroundColor: '#FFFFFF', borderRadius: 10, minWidth: 110, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, stopButtonDisabled: { opacity: 0.45 }, stopButtonText: { color: '#1D2824', fontSize: 15, fontWeight: '800' }, sensorCard: { backgroundColor: '#E7EEE9', borderRadius: 16, padding: 18, marginTop: 8 }, sensorTitle: { color: '#315B4C', fontSize: 16, fontWeight: '800', marginBottom: 8 }, sensorDetail: { color: '#59645E', fontSize: 13, lineHeight: 19, marginBottom: 18 }, sensorGrid: { flexDirection: 'row', gap: 8 }, metric: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10 }, metricLabel: { color: '#7B817A', fontSize: 11, marginBottom: 5 }, metricValue: { color: '#1D2824', fontSize: 14, fontWeight: '800' }, primaryButton: { zIndex: 0, elevation: 0, backgroundColor: '#D96C4F', borderRadius: 14, minHeight: 56, alignItems: 'center', justifyContent: 'center', marginTop: 28, marginBottom: 20 }, primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});