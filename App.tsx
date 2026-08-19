import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Screen = 'home' | 'strength' | 'cardio';
type Entry = { title: string; detail: string; accent: string };

const initialEntries: Entry[] = [
  { title: 'Upper body strength', detail: '45 min · 6 exercises', accent: '#D96C4F' },
  { title: 'Easy run', detail: '30 min · 4.2 km', accent: '#4D8C78' },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [entries, setEntries] = useState(initialEntries);
  const [exercise, setExercise] = useState('');
  const [repetitions, setRepetitions] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState('Jogging');
  const [duration, setDuration] = useState('');

  const addStrength = () => {
    if (!exercise.trim()) return;
    setEntries([{ title: exercise, detail: `${repetitions || 0} reps · ${weight || 0} kg`, accent: '#D96C4F' }, ...entries]);
    setExercise('');
    setRepetitions('');
    setWeight('');
    setScreen('home');
  };

  const addCardio = () => {
    if (!duration.trim()) return;
    setEntries([{ title: activity, detail: `${duration} min · sensor data pending`, accent: '#4D8C78' }, ...entries]);
    setDuration('');
    setScreen('home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {screen === 'home' && <Home entries={entries} onAdd={() => setScreen('strength')} onCardio={() => setScreen('cardio')} />}
        {screen === 'strength' && (
          <EntryForm title="Log strength" subtitle="Record the work you completed." onBack={() => setScreen('home')} onSave={addStrength}>
            <Field label="Exercise" value={exercise} onChangeText={setExercise} placeholder="e.g. Back squat" />
            <View style={styles.fieldRow}>
              <Field label="Repetitions" value={repetitions} onChangeText={setRepetitions} placeholder="12" keyboardType="numeric" />
              <Field label="Weight (kg)" value={weight} onChangeText={setWeight} placeholder="40" keyboardType="decimal-pad" />
            </View>
          </EntryForm>
        )}
        {screen === 'cardio' && (
          <EntryForm title="Log cardio" subtitle="Add a walk, jog, or run." onBack={() => setScreen('home')} onSave={addCardio}>
            <Text style={styles.fieldLabel}>Activity</Text>
            <View style={styles.choiceRow}>
              {['Walking', 'Jogging', 'Running'].map((option) => (
                <Pressable key={option} style={[styles.choice, activity === option && styles.choiceActive]} onPress={() => setActivity(option)}>
                  <Text style={[styles.choiceText, activity === option && styles.choiceTextActive]}>{option}</Text>
                </Pressable>
              ))}
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
      </View>
    </SafeAreaView>
  );
}

function Home({ entries, onAdd, onCardio }: { entries: Entry[]; onAdd: () => void; onCardio: () => void }) {
  return (
    <>
      <View style={styles.header}>
        <View><Text style={styles.eyebrow}>WEDNESDAY, AUGUST 20</Text><Text style={styles.title}>Train with{`\n`}intention.</Text></View>
        <View style={styles.avatar}><Text style={styles.avatarText}>J</Text></View>
      </View>
      <View style={styles.progressCard}>
        <View style={styles.progressCopy}><Text style={styles.cardLabel}>THIS WEEK</Text><Text style={styles.progressTitle}>{entries.length} sessions logged</Text><Text style={styles.progressDetail}>Keep building your routine</Text></View>
        <View style={styles.progressRing}><Text style={styles.progressNumber}>75%</Text></View>
      </View>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Log a workout</Text></View>
      <View style={styles.actionRow}>
        <Pressable style={[styles.actionCard, styles.strengthAction]} onPress={onAdd}><Text style={styles.actionIcon}>+</Text><Text style={styles.actionTitle}>Strength</Text><Text style={styles.actionDetail}>Reps and kg</Text></Pressable>
        <Pressable style={[styles.actionCard, styles.cardioAction]} onPress={onCardio}><Text style={styles.actionIcon}>→</Text><Text style={styles.actionTitle}>Cardio</Text><Text style={styles.actionDetail}>Time and sensors</Text></Pressable>
      </View>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent activity</Text></View>
      {entries.slice(0, 4).map((entry) => <View key={`${entry.title}-${entry.detail}`} style={styles.sessionRow}><View style={[styles.sessionMark, { backgroundColor: entry.accent }]} /><View style={styles.sessionCopy}><Text style={styles.sessionTitle}>{entry.title}</Text><Text style={styles.sessionDetail}>{entry.detail}</Text></View><Text style={styles.chevron}>›</Text></View>)}
    </>
  );
}

function EntryForm({ title, subtitle, onBack, onSave, children }: { title: string; subtitle: string; onBack: () => void; onSave: () => void; children: React.ReactNode }) {
  return <><Pressable onPress={onBack}><Text style={styles.back}>‹ Back</Text></Pressable><Text style={styles.formTitle}>{title}</Text><Text style={styles.formSubtitle}>{subtitle}</Text><View style={styles.form}>{children}</View><Pressable style={styles.primaryButton} onPress={onSave}><Text style={styles.primaryButtonText}>Save activity</Text></Pressable></>;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'numeric' | 'decimal-pad' }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#A3AAA3" keyboardType={keyboardType} /></View>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function NavButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable style={styles.navButton} onPress={onPress}><View style={[styles.navDot, active && styles.navDotActive]} /><Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F5F0' }, container: { padding: 24, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }, eyebrow: { color: '#7B817A', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 }, title: { color: '#1D2824', fontSize: 38, fontWeight: '800', lineHeight: 42 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D5E2D8', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#315B4C', fontSize: 18, fontWeight: '800' },
  progressCard: { backgroundColor: '#1D2824', borderRadius: 20, padding: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }, progressCopy: { flex: 1 }, cardLabel: { color: '#AFC9B9', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 12 }, progressTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 6 }, progressDetail: { color: '#C4CEC8', fontSize: 14 }, progressRing: { width: 76, height: 76, borderRadius: 38, borderWidth: 7, borderColor: '#E5A178', alignItems: 'center', justifyContent: 'center', marginLeft: 12 }, progressNumber: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  sectionHeader: { marginBottom: 14 }, sectionTitle: { color: '#1D2824', fontSize: 20, fontWeight: '800' }, actionRow: { flexDirection: 'row', gap: 12, marginBottom: 30 }, actionCard: { flex: 1, borderRadius: 16, padding: 18, minHeight: 126 }, strengthAction: { backgroundColor: '#F2D9D0' }, cardioAction: { backgroundColor: '#D5E2D8' }, actionIcon: { color: '#1D2824', fontSize: 25, fontWeight: '400', marginBottom: 14 }, actionTitle: { color: '#1D2824', fontSize: 17, fontWeight: '800', marginBottom: 5 }, actionDetail: { color: '#59645E', fontSize: 13 },
  sessionRow: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }, sessionMark: { width: 10, height: 42, borderRadius: 5, marginRight: 14 }, sessionCopy: { flex: 1 }, sessionTitle: { color: '#1D2824', fontSize: 16, fontWeight: '700', marginBottom: 5 }, sessionDetail: { color: '#7B817A', fontSize: 13 }, chevron: { color: '#9DA39D', fontSize: 28, fontWeight: '300' },
  navBar: { borderTopWidth: 1, borderTopColor: '#E1E4DD', backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, paddingBottom: 12 }, navButton: { alignItems: 'center', minWidth: 80 }, navDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#B5BBB4', marginBottom: 6 }, navDotActive: { backgroundColor: '#D96C4F', width: 18 }, navText: { color: '#8A928B', fontSize: 12, fontWeight: '700' }, navTextActive: { color: '#D96C4F' },
  back: { color: '#D96C4F', fontSize: 16, fontWeight: '700', marginBottom: 30 }, formTitle: { color: '#1D2824', fontSize: 32, fontWeight: '800', marginBottom: 8 }, formSubtitle: { color: '#7B817A', fontSize: 15, marginBottom: 28 }, form: { gap: 18 }, fieldRow: { flexDirection: 'row', gap: 12 }, field: { flex: 1 }, fieldLabel: { color: '#59645E', fontSize: 13, fontWeight: '700', marginBottom: 8 }, input: { backgroundColor: '#FFFFFF', borderRadius: 12, minHeight: 52, paddingHorizontal: 15, color: '#1D2824', fontSize: 16, borderWidth: 1, borderColor: '#E1E4DD' }, choiceRow: { flexDirection: 'row', gap: 8, marginBottom: 2 }, choice: { flex: 1, minHeight: 44, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E1E4DD' }, choiceActive: { backgroundColor: '#1D2824', borderColor: '#1D2824' }, choiceText: { color: '#59645E', fontSize: 13, fontWeight: '700' }, choiceTextActive: { color: '#FFFFFF' }, sensorCard: { backgroundColor: '#E7EEE9', borderRadius: 16, padding: 18, marginTop: 8 }, sensorTitle: { color: '#315B4C', fontSize: 16, fontWeight: '800', marginBottom: 8 }, sensorDetail: { color: '#59645E', fontSize: 13, lineHeight: 19, marginBottom: 18 }, sensorGrid: { flexDirection: 'row', gap: 8 }, metric: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10 }, metricLabel: { color: '#7B817A', fontSize: 11, marginBottom: 5 }, metricValue: { color: '#1D2824', fontSize: 14, fontWeight: '800' }, primaryButton: { backgroundColor: '#D96C4F', borderRadius: 14, minHeight: 56, alignItems: 'center', justifyContent: 'center', marginTop: 28, marginBottom: 20 }, primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});