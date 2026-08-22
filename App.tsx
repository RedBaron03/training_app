import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Screen = 'home' | 'strength' | 'cardio' | 'recent' | 'settings' | 'details';
type WorkoutType = 'strength' | 'cardio';
type StrengthExercise = { id: string; title: string; repetitions: string; weight: string };
type Entry = { id: string; title: string; detail: string; accent: string; type: WorkoutType; items: string[] };

const initialEntries: Entry[] = [];

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [entries, setEntries] = useState(initialEntries);
  const [exercise, setExercise] = useState('');
  const [repetitions, setRepetitions] = useState('');
  const [weight, setWeight] = useState('');
  const [strengthExercises, setStrengthExercises] = useState<StrengthExercise[]>([]);
  const [activity, setActivity] = useState('Jogging');
  const [duration, setDuration] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [strengthGoal, setStrengthGoal] = useState('3');
  const [cardioGoal, setCardioGoal] = useState('3');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [isDark, setIsDark] = useState(true);
  const recordingStartedAt = useRef<number | null>(null);

  styles = isDark ? darkStyles : lightStyles;

  const addStrengthExercise = () => {
    if (!exercise.trim()) return;
    setStrengthExercises([...strengthExercises, { id: createEntryId(), title: exercise, repetitions: repetitions || '0', weight: weight || '0' }]);
    setExercise('');
    setRepetitions('');
    setWeight('');
  };

  const saveStrengthSession = () => {
    if (strengthExercises.length === 0) return;
    const exerciseNames = strengthExercises.map((item) => item.title).join(', ');
    setEntries([{ id: createEntryId(), title: 'Strength session', detail: `${strengthExercises.length} exercises · ${exerciseNames}`, accent: '#FF6B4A', type: 'strength', items: strengthExercises.map((item) => `${item.title} · ${item.repetitions} reps · ${item.weight} kg`) }, ...entries]);
    setStrengthExercises([]);
    setScreen('home');
  };

  const addCardio = () => {
    if (!duration.trim()) return;
    setEntries([{ id: createEntryId(), title: activity, detail: `${duration} min · sensor data pending`, accent: '#9BE15D', type: 'cardio', items: [`Activity: ${activity}`, `Duration: ${duration} minutes`, 'Sensor data pending'] }, ...entries]);
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

  useEffect(() => {
    const handleBackGesture = () => {
      if (screen === 'home') return false;
      setScreen(screen === 'details' ? 'recent' : 'home');
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackGesture);
    return () => subscription.remove();
  }, [screen]);

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

  const openSession = (entry: Entry) => {
    setSelectedEntry(entry);
    setScreen('details');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {screen === 'home' && <Home entries={entries} strengthGoal={strengthGoal} cardioGoal={cardioGoal} onAdd={() => setScreen('strength')} onCardio={() => setScreen('cardio')} onRecent={() => setScreen('recent')} onNavigate={(destination) => setScreen(destination)} onOpenSession={openSession} />}
        {screen === 'recent' && <RecentActivities entries={entries} onBack={() => setScreen('home')} onOpenSession={openSession} />}
        {screen === 'settings' && <Settings strengthGoal={strengthGoal} cardioGoal={cardioGoal} isDark={isDark} onThemeChange={setIsDark} onStrengthGoalChange={setStrengthGoal} onCardioGoalChange={setCardioGoal} onBack={() => setScreen('home')} />}
        {screen === 'details' && selectedEntry && <SessionDetails entry={selectedEntry} onBack={() => setScreen('recent')} />}
        {screen === 'strength' && (
          <EntryForm title="Log strength" subtitle="Build a session with one or more exercises." onBack={() => setScreen('home')} onSave={saveStrengthSession} saveLabel="Save session">
            <Text style={styles.fieldLabel}>Exercise</Text>
            <ExerciseDropdown value={exercise} onChange={setExercise} />
            <View style={styles.fieldRow}>
              <Field label="Repetitions" value={repetitions} onChangeText={setRepetitions} placeholder="12" keyboardType="numeric" />
              <Field label="Weight (kg)" value={weight} onChangeText={setWeight} placeholder="40" keyboardType="decimal-pad" />
            </View>
            <Pressable style={styles.secondaryButton} onPress={addStrengthExercise}>
              <Text style={styles.secondaryButtonText}>Add exercise</Text>
            </Pressable>
            {strengthExercises.length > 0 && <View style={styles.pendingExercises}><Text style={styles.pendingTitle}>Exercises in this session</Text>{strengthExercises.map((item, index) => <View key={item.id} style={styles.pendingRow}><Text style={styles.pendingIndex}>{index + 1}</Text><View style={styles.sessionCopy}><Text style={styles.sessionTitle}>{item.title}</Text><Text style={styles.sessionDetail}>{item.repetitions} reps · {item.weight} kg</Text></View></View>)}</View>}
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
        <NavButton icon="⌂" label="Overview" active={screen === 'home'} onPress={() => setScreen('home')} />
        <NavButton icon="✦" label="Strength" active={screen === 'strength'} onPress={() => setScreen('strength')} />
        <NavButton icon="◒" label="Cardio" active={screen === 'cardio'} onPress={() => setScreen('cardio')} />
        <NavButton icon="◷" label="Recent" active={screen === 'recent'} onPress={() => setScreen('recent')} />
      </View>
    </SafeAreaView>
  );
}

function Home({ entries, strengthGoal, cardioGoal, onAdd, onCardio, onRecent, onNavigate, onOpenSession }: { entries: Entry[]; strengthGoal: string; cardioGoal: string; onAdd: () => void; onCardio: () => void; onRecent: () => void; onNavigate: (destination: 'settings' | 'strength' | 'cardio' | 'recent') => void; onOpenSession: (entry: Entry) => void }) {
  const strengthPercentage = getGoalPercentage(entries.filter((entry) => entry.type === 'strength').length, strengthGoal);
  const cardioPercentage = getGoalPercentage(entries.filter((entry) => entry.type === 'cardio').length, cardioGoal);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigateFromMenu = (destination: 'settings' | 'strength' | 'cardio' | 'recent') => {
    setMenuOpen(false);
    onNavigate(destination);
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerDate}><Text style={styles.eyebrow}>WEDNESDAY, AUGUST 20</Text><Text style={styles.title}>Train with{`\n`}intention.</Text></View>
        <Pressable style={styles.avatar} onPress={() => setMenuOpen(!menuOpen)} accessibilityLabel="Open navigation menu" accessibilityState={{ expanded: menuOpen }}><View style={styles.hamburger}><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /></View></Pressable>
      </View>
      {menuOpen && <View style={styles.menuDropdown}>{[['settings', 'Settings'], ['strength', 'Strength'], ['cardio', 'Cardio'], ['recent', 'Recent']].map(([destination, label]) => <Pressable key={destination} style={styles.menuItem} onPress={() => navigateFromMenu(destination as 'settings' | 'strength' | 'cardio' | 'recent')}><Text style={styles.menuItemText}>{label}</Text></Pressable>)}</View>}
      <View style={styles.progressCard}>
        <View style={styles.progressCopy}><Text style={styles.cardLabel}>THIS WEEK</Text><Text style={styles.progressTitle}>{entries.length} sessions logged</Text><Text style={styles.progressDetail}>Keep building your routine</Text></View>
        <View style={styles.progressRings}><ProgressCircle label="Cardio" percentage={cardioPercentage} accent="#9BE15D" /><ProgressCircle label="Strength" percentage={strengthPercentage} accent="#FF6B4A" /></View>
      </View>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Log a workout</Text></View>
      <View style={styles.actionRow}>
        <Pressable style={[styles.actionCard, styles.strengthAction]} onPress={onAdd}><Text style={styles.actionIcon}>+</Text><Text style={styles.actionTitle}>Strength</Text><Text style={styles.actionDetail}>Reps and kg</Text></Pressable>
        <Pressable style={[styles.actionCard, styles.cardioAction]} onPress={onCardio}><Text style={styles.actionIcon}>→</Text><Text style={styles.actionTitle}>Cardio</Text><Text style={styles.actionDetail}>Time and sensors</Text></Pressable>
      </View>
      <Pressable style={styles.sectionHeader} onPress={onRecent}><Text style={styles.sectionTitle}>Recent activity</Text><Text style={styles.sectionLink}>View all ›</Text></Pressable>
      {entries.slice(0, 4).map((entry) => <Pressable key={entry.id} style={styles.sessionRow} onPress={() => onOpenSession(entry)}><View style={[styles.sessionMark, { backgroundColor: entry.accent }]} /><View style={styles.sessionCopy}><Text style={styles.sessionTitle}>{entry.title}</Text><Text style={styles.sessionDetail}>{entry.detail}</Text></View><Text style={styles.chevron}>›</Text></Pressable>)}
    </>
  );
}

function ProgressCircle({ label, percentage, accent }: { label: string; percentage: number; accent: string }) {
  return <View style={styles.progressCircleGroup}><View style={[styles.progressRing, { borderColor: accent }]}><Text style={styles.progressNumber}>{percentage}%</Text></View><Text style={styles.progressCircleLabel}>{label}</Text></View>;
}

function Settings({ strengthGoal, cardioGoal, isDark, onThemeChange, onStrengthGoalChange, onCardioGoalChange, onBack }: { strengthGoal: string; cardioGoal: string; isDark: boolean; onThemeChange: (value: boolean) => void; onStrengthGoalChange: (value: string) => void; onCardioGoalChange: (value: string) => void; onBack: () => void }) {
  return <><Pressable style={styles.backButton} onPress={onBack} hitSlop={8}><Text style={styles.back}>‹ Back</Text></Pressable><Text style={styles.formTitle}>Settings</Text><Text style={styles.formSubtitle}>Set your weekly training goals.</Text><View style={styles.settingsForm}><ThemeToggle isDark={isDark} onChange={onThemeChange} /><Field label="Strength trainings per week" value={strengthGoal} onChangeText={onStrengthGoalChange} placeholder="3" keyboardType="numeric" /><Field label="Cardio trainings per week" value={cardioGoal} onChangeText={onCardioGoalChange} placeholder="3" keyboardType="numeric" /></View></>;
}

function ThemeToggle({ isDark, onChange }: { isDark: boolean; onChange: (value: boolean) => void }) {
  return <View><Text style={styles.fieldLabel}>Theme</Text><View style={styles.themeToggle}><Pressable style={[styles.themeOption, isDark && styles.themeOptionActive]} onPress={() => onChange(true)}><Text style={[styles.themeOptionText, isDark && styles.themeOptionTextActive]}>Dark</Text></Pressable><Pressable style={[styles.themeOption, !isDark && styles.themeOptionActive]} onPress={() => onChange(false)}><Text style={[styles.themeOptionText, !isDark && styles.themeOptionTextActive]}>Light</Text></Pressable></View></View>;
}

function RecentActivities({ entries, onBack, onOpenSession }: { entries: Entry[]; onBack: () => void; onOpenSession: (entry: Entry) => void }) {
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
        <Pressable key={entry.id} style={styles.sessionRow} onPress={() => onOpenSession(entry)}>
          <View style={[styles.sessionMark, { backgroundColor: entry.accent }]} />
          <View style={styles.sessionCopy}><Text style={styles.sessionTitle}>{entry.title}</Text><Text style={styles.sessionDetail}>{entry.detail}</Text></View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )) : <Text style={styles.emptyHistory}>No {activeTab} workouts logged yet.</Text>}
    </>
  );
}

function SessionDetails({ entry, onBack }: { entry: Entry; onBack: () => void }) {
  return (
    <>
      <Pressable style={styles.backButton} onPress={onBack} hitSlop={8}><Text style={styles.back}>‹ Back</Text></Pressable>
      <View style={[styles.detailsAccent, { backgroundColor: entry.accent }]} />
      <Text style={styles.formTitle}>{entry.title}</Text>
      <Text style={styles.formSubtitle}>{entry.detail}</Text>
      <View style={styles.detailsList}>
        <Text style={styles.detailsHeading}>Session details</Text>
        {entry.items.map((item, index) => <View key={`${entry.id}-${index}`} style={styles.detailsRow}><Text style={styles.detailsBullet}>•</Text><Text style={styles.detailsText}>{item}</Text></View>)}
      </View>
    </>
  );
}

function EntryForm({ title, subtitle, onBack, onSave, saveLabel = 'Save activity', children }: { title: string; subtitle: string; onBack: () => void; onSave: () => void; saveLabel?: string; children: React.ReactNode }) {
  return <><Pressable style={styles.backButton} onPress={onBack} hitSlop={8}><Text style={styles.back}>‹ Back</Text></Pressable><Text style={styles.formTitle}>{title}</Text><Text style={styles.formSubtitle}>{subtitle}</Text><View style={styles.form}>{children}</View><Pressable style={styles.primaryButton} onPress={onSave}><Text style={styles.primaryButtonText}>{saveLabel}</Text></Pressable></>;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'numeric' | 'decimal-pad' }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#82909A" keyboardType={keyboardType} /></View>;
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

function NavButton({ icon, label, active, onPress }: { icon: string; label: string; active: boolean; onPress: () => void }) {
  return <Pressable style={styles.navButton} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}><Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text><Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text></Pressable>;
}

const darkStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B1014' }, container: { padding: 24, paddingBottom: 32 },
  settingsForm: { gap: 18 }, themeToggle: { flexDirection: 'row', gap: 4, backgroundColor: '#1B272E', borderRadius: 12, padding: 4 }, themeOption: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9 }, themeOptionActive: { backgroundColor: '#2A3740' }, themeOptionText: { color: '#AAB7B0', fontSize: 14, fontWeight: '700' }, themeOptionTextActive: { color: '#F2F5F1', fontWeight: '800' },
  secondaryButton: { backgroundColor: '#2A211E', borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, secondaryButtonText: { color: '#FF8A70', fontSize: 15, fontWeight: '800' }, pendingExercises: { backgroundColor: '#151D24', borderRadius: 16, padding: 16, marginTop: 2 }, pendingTitle: { color: '#F2F5F1', fontSize: 15, fontWeight: '800', marginBottom: 12 }, pendingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#2A3740' }, pendingIndex: { color: '#FF6B4A', fontSize: 15, fontWeight: '800', width: 28 },
  detailsAccent: { width: 48, height: 8, borderRadius: 4, marginBottom: 22 }, detailsList: { backgroundColor: '#151D24', borderRadius: 16, padding: 18, marginTop: 4 }, detailsHeading: { color: '#F2F5F1', fontSize: 16, fontWeight: '800', marginBottom: 12 }, detailsRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#2A3740' }, detailsBullet: { color: '#FF6B4A', fontSize: 18, lineHeight: 20, marginRight: 10 }, detailsText: { flex: 1, color: '#AAB7B0', fontSize: 15, lineHeight: 21 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, zIndex: 20 }, headerDate: { marginTop: 3 }, eyebrow: { color: '#82909A', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 }, title: { color: '#F2F5F1', fontSize: 38, fontWeight: '800', lineHeight: 42 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#24332B', alignItems: 'center', justifyContent: 'center', marginTop: 3 }, hamburger: { width: 20, gap: 4 }, hamburgerLine: { height: 2, width: 20, borderRadius: 1, backgroundColor: '#9BE15D' }, avatarText: { color: '#9BE15D', fontSize: 18, fontWeight: '800' }, menuDropdown: { position: 'absolute', top: 60, right: 0, width: 170, backgroundColor: '#151D24', borderRadius: 14, borderWidth: 1, borderColor: '#2A3740', overflow: 'hidden', zIndex: 30, elevation: 12, shadowColor: '#000000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, menuItem: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#2A3740' }, menuItemText: { color: '#F2F5F1', fontSize: 15, fontWeight: '700' },
  progressCard: { backgroundColor: '#151D24', borderRadius: 20, padding: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }, progressCopy: { flex: 1 }, cardLabel: { color: '#9BE15D', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 12 }, progressTitle: { color: '#F2F5F1', fontSize: 22, fontWeight: '800', marginBottom: 6 }, progressDetail: { color: '#AAB7B0', fontSize: 14 }, progressRings: { flexDirection: 'row', gap: 10, marginLeft: 12 }, progressCircleGroup: { alignItems: 'center' }, progressRing: { width: 62, height: 62, borderRadius: 31, borderWidth: 6, alignItems: 'center', justifyContent: 'center' }, progressNumber: { color: '#F2F5F1', fontSize: 14, fontWeight: '800' }, progressCircleLabel: { color: '#AAB7B0', fontSize: 10, fontWeight: '700', marginTop: 5 },
  sectionHeader: { marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: '#F2F5F1', fontSize: 20, fontWeight: '800' }, sectionLink: { color: '#FF6B4A', fontSize: 13, fontWeight: '800' }, actionRow: { flexDirection: 'row', gap: 12, marginBottom: 30 }, actionCard: { flex: 1, borderRadius: 16, padding: 18, minHeight: 126 }, strengthAction: { backgroundColor: '#38231F' }, cardioAction: { backgroundColor: '#20352B' }, actionIcon: { color: '#F2F5F1', fontSize: 25, fontWeight: '400', marginBottom: 14 }, actionTitle: { color: '#F2F5F1', fontSize: 17, fontWeight: '800', marginBottom: 5 }, actionDetail: { color: '#AAB7B0', fontSize: 13 },
  sessionRow: { backgroundColor: '#151D24', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }, sessionMark: { width: 10, height: 42, borderRadius: 5, marginRight: 14 }, sessionCopy: { flex: 1 }, sessionTitle: { color: '#F2F5F1', fontSize: 16, fontWeight: '700', marginBottom: 5 }, sessionDetail: { color: '#82909A', fontSize: 13 }, chevron: { color: '#71808A', fontSize: 28, fontWeight: '300' },
  navBar: { borderTopWidth: 1, borderTopColor: '#2A3740', backgroundColor: '#10171D', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, paddingBottom: 12 }, navButton: { alignItems: 'center', flex: 1 }, navIcon: { color: '#4B5962', fontSize: 19, lineHeight: 22, marginBottom: 3 }, navIconActive: { color: '#9BE15D' }, navDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4B5962', marginBottom: 6 }, navDotActive: { backgroundColor: '#9BE15D', width: 18 }, navText: { color: '#82909A', fontSize: 11, fontWeight: '700' }, navTextActive: { color: '#9BE15D' },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginBottom: 16 }, back: { color: '#FF6B4A', fontSize: 16, fontWeight: '700' }, formTitle: { color: '#F2F5F1', fontSize: 32, fontWeight: '800', marginBottom: 8 }, formSubtitle: { color: '#82909A', fontSize: 15, marginBottom: 28 }, form: { gap: 18 }, fieldRow: { flexDirection: 'row', gap: 12 }, field: { flex: 1 }, fieldLabel: { color: '#AAB7B0', fontSize: 13, fontWeight: '700', marginBottom: 8 }, input: { backgroundColor: '#151D24', borderRadius: 12, minHeight: 52, paddingHorizontal: 15, color: '#F2F5F1', fontSize: 16, borderWidth: 1, borderColor: '#2A3740' }, historyTabs: { flexDirection: 'row', backgroundColor: '#1B272E', borderRadius: 12, padding: 4, marginBottom: 20 }, historyTab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9 }, historyTabActive: { backgroundColor: '#2A3740' }, historyTabText: { color: '#AAB7B0', fontSize: 14, fontWeight: '700' }, historyTabTextActive: { color: '#F2F5F1', fontWeight: '800' }, emptyHistory: { color: '#82909A', fontSize: 15, textAlign: 'center', marginTop: 24 }, dropdownContainer: { zIndex: 10, elevation: 10 }, dropdownButton: { backgroundColor: '#151D24', borderRadius: 12, minHeight: 52, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#2A3740' }, dropdownText: { color: '#F2F5F1', fontSize: 16 }, dropdownPlaceholder: { color: '#82909A' }, dropdownArrow: { color: '#9BE15D', fontSize: 12 }, dropdownMenu: { position: 'absolute', top: 58, left: 0, right: 0, backgroundColor: '#151D24', borderRadius: 12, borderWidth: 1, borderColor: '#2A3740', overflow: 'hidden', elevation: 10, shadowColor: '#000000', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, dropdownOption: { paddingHorizontal: 15, paddingVertical: 14 }, dropdownOptionText: { color: '#AAB7B0', fontSize: 15 }, dropdownOptionActive: { color: '#9BE15D', fontWeight: '800' }, recordingCard: { backgroundColor: '#151D24', borderRadius: 16, padding: 18, alignItems: 'center' }, recordingTime: { color: '#F2F5F1', fontSize: 32, fontWeight: '800', letterSpacing: 1 }, recordingStatus: { color: '#AAB7B0', fontSize: 13, marginTop: 4, marginBottom: 16 }, recordingActions: { flexDirection: 'row', gap: 10 }, recordButton: { backgroundColor: '#FF6B4A', borderRadius: 10, minWidth: 110, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, recordButtonDisabled: { opacity: 0.45 }, recordButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' }, stopButton: { backgroundColor: '#DCE7DF', borderRadius: 10, minWidth: 110, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, stopButtonDisabled: { opacity: 0.45 }, stopButtonText: { color: '#0B1014', fontSize: 15, fontWeight: '800' }, sensorCard: { backgroundColor: '#20352B', borderRadius: 16, padding: 18, marginTop: 8 }, sensorTitle: { color: '#9BE15D', fontSize: 16, fontWeight: '800', marginBottom: 8 }, sensorDetail: { color: '#AAB7B0', fontSize: 13, lineHeight: 19, marginBottom: 18 }, sensorGrid: { flexDirection: 'row', gap: 8 }, metric: { flex: 1, backgroundColor: '#151D24', borderRadius: 10, padding: 10 }, metricLabel: { color: '#82909A', fontSize: 11, marginBottom: 5 }, metricValue: { color: '#F2F5F1', fontSize: 14, fontWeight: '800' }, primaryButton: { zIndex: 0, elevation: 0, backgroundColor: '#FF6B4A', borderRadius: 14, minHeight: 56, alignItems: 'center', justifyContent: 'center', marginTop: 28, marginBottom: 20 }, primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});

const lightOverrides = StyleSheet.create({
    safeArea: { backgroundColor: '#F7F5F0' },
    header: { backgroundColor: '#F7F5F0' },
    eyebrow: { color: '#7B817A' },
    title: { color: '#1D2824' },
    avatar: { backgroundColor: '#D5E2D8' },
    hamburgerLine: { backgroundColor: '#315B4C' },
    menuDropdown: { backgroundColor: '#FFFFFF', borderColor: '#E1E4DD', shadowColor: '#1D2824' },
    menuItem: { borderBottomColor: '#E1E4DD' },
    menuItemText: { color: '#1D2824' },
    progressCard: { backgroundColor: '#1D2824' },
    progressTitle: { color: '#FFFFFF' },
    progressDetail: { color: '#C4CEC8' },
    progressNumber: { color: '#FFFFFF' },
    progressCircleLabel: { color: '#C4CEC8' },
    sectionTitle: { color: '#1D2824' },
    sectionLink: { color: '#D96C4F' },
    strengthAction: { backgroundColor: '#F2D9D0' },
    cardioAction: { backgroundColor: '#D5E2D8' },
    actionIcon: { color: '#1D2824' },
    actionTitle: { color: '#1D2824' },
    actionDetail: { color: '#59645E' },
    sessionRow: { backgroundColor: '#FFFFFF' },
    sessionTitle: { color: '#1D2824' },
    sessionDetail: { color: '#7B817A' },
    navBar: { borderTopColor: '#E1E4DD', backgroundColor: '#FFFFFF' },
    navIcon: { color: '#B5BBB4' },
    navIconActive: { color: '#D96C4F' },
    navDot: { backgroundColor: '#B5BBB4' },
    navDotActive: { backgroundColor: '#D96C4F' },
    navText: { color: '#8A928B' },
    navTextActive: { color: '#D96C4F' },
    back: { color: '#D96C4F' },
    formTitle: { color: '#1D2824' },
    formSubtitle: { color: '#7B817A' },
    fieldLabel: { color: '#59645E' },
    input: { backgroundColor: '#FFFFFF', color: '#1D2824', borderColor: '#E1E4DD' },
    historyTabs: { backgroundColor: '#E7EEE9' },
    historyTabActive: { backgroundColor: '#FFFFFF' },
    historyTabText: { color: '#59645E' },
    historyTabTextActive: { color: '#1D2824' },
    emptyHistory: { color: '#7B817A' },
    dropdownButton: { backgroundColor: '#FFFFFF', borderColor: '#E1E4DD' },
    dropdownText: { color: '#1D2824' },
    dropdownPlaceholder: { color: '#A3AAA3' },
    dropdownArrow: { color: '#59645E' },
    dropdownMenu: { backgroundColor: '#FFFFFF', borderColor: '#E1E4DD', shadowColor: '#1D2824' },
    dropdownOptionText: { color: '#59645E' },
    dropdownOptionActive: { color: '#D96C4F' },
    recordingCard: { backgroundColor: '#1D2824' },
    recordingTime: { color: '#FFFFFF' },
    recordingStatus: { color: '#C4CEC8' },
    stopButton: { backgroundColor: '#FFFFFF' },
    stopButtonText: { color: '#1D2824' },
    sensorCard: { backgroundColor: '#E7EEE9' },
    sensorTitle: { color: '#315B4C' },
    sensorDetail: { color: '#59645E' },
    metric: { backgroundColor: '#FFFFFF' },
    metricLabel: { color: '#7B817A' },
    metricValue: { color: '#1D2824' },
    primaryButton: { backgroundColor: '#D96C4F' },
    pendingExercises: { backgroundColor: '#FFFFFF' },
    pendingTitle: { color: '#1D2824' },
    pendingRow: { borderTopColor: '#E1E4DD' },
    pendingIndex: { color: '#D96C4F' },
    detailsList: { backgroundColor: '#FFFFFF' },
    detailsHeading: { color: '#1D2824' },
    detailsRow: { borderTopColor: '#E1E4DD' },
    detailsBullet: { color: '#D96C4F' },
    detailsText: { color: '#59645E' },
    secondaryButton: { backgroundColor: '#F2D9D0' },
    secondaryButtonText: { color: '#9E4D3A' },
    themeToggle: { backgroundColor: '#E7EEE9' },
    themeOptionActive: { backgroundColor: '#FFFFFF' },
    themeOptionText: { color: '#59645E' },
    themeOptionTextActive: { color: '#1D2824' },
});

const lightStyles = Object.keys(darkStyles).reduce<Record<string, unknown>>((themeStyles, styleName) => {
  themeStyles[styleName] = [(darkStyles as any)[styleName], (lightOverrides as any)[styleName]];
  return themeStyles;
}, {});

let styles: any = darkStyles;