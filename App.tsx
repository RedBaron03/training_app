import { StatusBar } from 'expo-status-bar';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const sessions = [
  { title: 'Upper body strength', detail: '45 min · 6 exercises', accent: '#D96C4F' },
  { title: 'Easy run', detail: '30 min · 4.2 km', accent: '#4D8C78' },
];

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>WEDNESDAY, AUGUST 19</Text>
            <Text style={styles.title}>Keep your{`\n`}momentum.</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>J</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressCopy}>
            <Text style={styles.cardLabel}>THIS WEEK</Text>
            <Text style={styles.progressTitle}>3 of 4 sessions</Text>
            <Text style={styles.progressDetail}>One more to reach your goal</Text>
          </View>
          <View style={styles.progressRing}>
            <Text style={styles.progressNumber}>75%</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent sessions</Text>
          <Pressable accessibilityRole="button" onPress={() => undefined}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>

        {sessions.map((session) => (
          <View key={session.title} style={styles.sessionRow}>
            <View style={[styles.sessionMark, { backgroundColor: session.accent }]} />
            <View style={styles.sessionCopy}>
              <Text style={styles.sessionTitle}>{session.title}</Text>
              <Text style={styles.sessionDetail}>{session.detail}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        ))}

        <Pressable style={styles.primaryButton} accessibilityRole="button" onPress={() => undefined}>
          <Text style={styles.primaryButtonText}>+ Log a session</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F5F0' },
  container: { padding: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  eyebrow: { color: '#7B817A', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  title: { color: '#1D2824', fontSize: 38, fontWeight: '800', lineHeight: 42 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D5E2D8', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#315B4C', fontSize: 18, fontWeight: '800' },
  progressCard: { backgroundColor: '#1D2824', borderRadius: 20, padding: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 },
  progressCopy: { flex: 1 },
  cardLabel: { color: '#AFC9B9', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 12 },
  progressTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  progressDetail: { color: '#C4CEC8', fontSize: 14 },
  progressRing: { width: 76, height: 76, borderRadius: 38, borderWidth: 7, borderColor: '#E5A178', alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  progressNumber: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: '#1D2824', fontSize: 20, fontWeight: '800' },
  link: { color: '#D96C4F', fontSize: 14, fontWeight: '700' },
  sessionRow: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sessionMark: { width: 10, height: 42, borderRadius: 5, marginRight: 14 },
  sessionCopy: { flex: 1 },
  sessionTitle: { color: '#1D2824', fontSize: 16, fontWeight: '700', marginBottom: 5 },
  sessionDetail: { color: '#7B817A', fontSize: 13 },
  chevron: { color: '#9DA39D', fontSize: 28, fontWeight: '300' },
  primaryButton: { backgroundColor: '#D96C4F', borderRadius: 14, minHeight: 56, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});