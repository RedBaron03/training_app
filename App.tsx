import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Screen = 'home' | 'strength' | 'cardio' | 'recent' | 'settings' | 'details';
type WorkoutType = 'strength' | 'cardio';
type Language = 'en' | 'de' | 'fr' | 'it' | 'es';
type StrengthExercise = { id: string; title: string; repetitions: string; weight: string };
type Entry = { id: string; title: string; detail: string; accent: string; type: WorkoutType; items: string[] };
type Copy = { language: string; overview: string; strength: string; cardio: string; recent: string; settings: string; back: string; logStrength: string; strengthSubtitle: string; logCardio: string; cardioSubtitle: string; exercise: string; repetitions: string; weight: string; selectExercise: string; addExercise: string; saveSession: string; saveActivity: string; exercisesInSession: string; recordingWorkout: string; readyToRecord: string; start: string; stop: string; duration: string; phoneWatchData: string; sensorDetail: string; speed: string; steps: string; heartRate: string; thisWeek: string; sessionsLogged: string; keepBuilding: string; logWorkout: string; recentActivity: string; viewAll: string; recentSubtitle: string; noWorkouts: string; sessionDetails: string; setGoals: string; theme: string; dark: string; light: string; strengthGoal: string; cardioGoal: string; strengthSession: string; exercises: string; reps: string; kg: string; activity: string; minutes: string; sensorPending: string; walking: string; jogging: string; running: string; intention: string };

type ExerciseGroup = { categories: Record<Language, string>; exercises: Record<Language, string[]> };

const exerciseGroups: ExerciseGroup[] = [
  { categories: { en: 'Chest', de: 'Brust', fr: 'Pectoraux', it: 'Petto', es: 'Pecho' }, exercises: { en: ['Bench Press', 'Cable Chest Press', 'Push-Up', 'Pec Deck'], de: ['Bankdrücken', 'Kabel-Brustpresse', 'Liegestütz', 'Butterfly'], fr: ['Développé couché', 'Presse poitrine à la poulie', 'Pompes', 'Pec deck'], it: ['Panca piana', 'Chest press ai cavi', 'Piegamenti', 'Pec deck'], es: ['Press de banca', 'Press de pecho en polea', 'Flexiones', 'Pec deck'] } },
  { categories: { en: 'Shoulders', de: 'Schultern', fr: 'Épaules', it: 'Spalle', es: 'Hombros' }, exercises: { en: ['Overhead Press', 'Dumbbell Shoulder Press', 'Lateral Raise', 'Face Pull'], de: ['Schulterdrücken', 'Schulterdrücken mit Kurzhanteln', 'Seitheben', 'Face Pull'], fr: ['Développé militaire', 'Développé épaules avec haltères', 'Élévations latérales', 'Face pull'], it: ['Lento avanti', 'Shoulder press con manubri', 'Alzate laterali', 'Face pull'], es: ['Press militar', 'Press de hombros con mancuernas', 'Elevaciones laterales', 'Face pull'] } },
  { categories: { en: 'Back', de: 'Rücken', fr: 'Dos', it: 'Schiena', es: 'Espalda' }, exercises: { en: ['Deadlift', 'Lat Pulldown', 'Pull-Up', 'Barbell Row'], de: ['Kreuzheben', 'Latzug', 'Klimmzug', 'Langhantelrudern'], fr: ['Soulevé de terre', 'Tirage vertical', 'Tractions', 'Rowing barre'], it: ['Stacco da terra', 'Lat machine', 'Trazioni', 'Rematore con bilanciere'], es: ['Peso muerto', 'Jalón al pecho', 'Dominadas', 'Remo con barra'] } },
  { categories: { en: 'Biceps', de: 'Bizeps', fr: 'Biceps', it: 'Bicipiti', es: 'Bíceps' }, exercises: { en: ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Concentration Curl'], de: ['Langhantelcurls', 'Kurzhantelcurls', 'Hammercurls', 'Konzentrationscurls'], fr: ['Curl barre', 'Curl haltères', 'Curl marteau', 'Curl concentré'], it: ['Curl con bilanciere', 'Curl con manubri', 'Curl a martello', 'Curl concentrato'], es: ['Curl con barra', 'Curl con mancuernas', 'Curl martillo', 'Curl de concentración'] } },
  { categories: { en: 'Triceps', de: 'Trizeps', fr: 'Triceps', it: 'Tricipiti', es: 'Tríceps' }, exercises: { en: ['Tricep Pushdown', 'Close-Grip Bench Press', 'Overhead Cable Extension', 'Bench Dip'], de: ['Trizepsdrücken', 'Enges Bankdrücken', 'Trizepsstrecken über Kopf am Kabel', 'Bank-Dips'], fr: ['Extension triceps à la poulie', 'Développé couché prise serrée', 'Extension triceps au-dessus de la tête', 'Dips sur banc'], it: ['Pushdown tricipiti', 'Panca a presa stretta', 'Estensione tricipiti sopra la testa', 'Dip su panca'], es: ['Extensión de tríceps en polea', 'Press de banca con agarre cerrado', 'Extensión de tríceps sobre la cabeza', 'Fondos en banco'] } },
  { categories: { en: 'Legs', de: 'Beine', fr: 'Jambes', it: 'Gambe', es: 'Piernas' }, exercises: { en: ['Squat', 'Leg Press', 'Leg Extension', 'Romanian Deadlift'], de: ['Kniebeuge', 'Beinpresse', 'Beinstrecken', 'Rumänisches Kreuzheben'], fr: ['Squat', 'Presse à cuisses', 'Extension des jambes', 'Soulevé de terre roumain'], it: ['Squat', 'Leg press', 'Leg extension', 'Stacco rumeno'], es: ['Sentadilla', 'Prensa de piernas', 'Extensión de piernas', 'Peso muerto rumano'] } },
  { categories: { en: 'Glutes', de: 'Gesäß', fr: 'Fessiers', it: 'Glutei', es: 'Glúteos' }, exercises: { en: ['Hip Thrust', 'Bulgarian Split Squat', 'Glute Bridge', 'Cable Glute Kickback'], de: ['Hip Thrust', 'Bulgarische Split Squats', 'Glute Bridge', 'Kabel-Kickbacks'], fr: ['Hip thrust', 'Fentes bulgares', 'Pont fessier', 'Extension fessiers à la poulie'], it: ['Hip thrust', 'Split squat bulgaro', 'Ponte per glutei', 'Calcio glutei ai cavi'], es: ['Hip thrust', 'Sentadilla búlgara', 'Puente de glúteos', 'Patada de glúteo en polea'] } },
  { categories: { en: 'Abs', de: 'Bauch', fr: 'Abdominaux', it: 'Addominali', es: 'Abdominales' }, exercises: { en: ['Plank', 'Cable Crunch', 'Hanging Leg Raise', 'Mountain Climbers'], de: ['Plank', 'Kabel-Crunch', 'Beinheben im Hang', 'Mountain Climbers'], fr: ['Planche', 'Crunch à la poulie', 'Relevé de jambes suspendu', 'Mountain climbers'], it: ['Plank', 'Crunch ai cavi', 'Sollevamento gambe alla sbarra', 'Mountain climber'], es: ['Plancha', 'Crunch en polea', 'Elevación de piernas colgado', 'Escaladores'] } },
  { categories: { en: 'Calves', de: 'Waden', fr: 'Mollets', it: 'Polpacci', es: 'Pantorrillas' }, exercises: { en: ['Standing Calf Raise', 'Seated Calf Raise'], de: ['Wadenheben im Stehen', 'Wadenheben im Sitzen'], fr: ['Mollets debout', 'Mollets assis'], it: ['Calf raise in piedi', 'Calf raise da seduto'], es: ['Elevación de talones de pie', 'Elevación de talones sentado'] } },
];

const translations: Record<Language, Copy> = {
  en: { language: 'English (UK)', overview: 'Overview', strength: 'Strength', cardio: 'Cardio', recent: 'Recent', settings: 'Settings', back: '‹ Back', logStrength: 'Log strength', strengthSubtitle: 'Build a session with one or more exercises.', logCardio: 'Log cardio', cardioSubtitle: 'Add a walk, jog, or run.', exercise: 'Exercise', repetitions: 'Repetitions', weight: 'Weight (kg)', selectExercise: 'Select exercise', addExercise: 'Add exercise', saveSession: 'Save session', saveActivity: 'Save activity', exercisesInSession: 'Exercises in this session', recordingWorkout: 'Recording workout', readyToRecord: 'Ready to record', start: 'Start', stop: 'Stop', duration: 'Duration (minutes)', phoneWatchData: 'Phone & watch data', sensorDetail: 'Speed, steps, heart rate, and route will appear here when device permissions and wearable sync are connected.', speed: 'Speed', steps: 'Steps', heartRate: 'Heart rate', thisWeek: 'THIS WEEK', sessionsLogged: 'sessions logged', keepBuilding: 'Keep building your routine', logWorkout: 'Log a workout', recentActivity: 'Recent activity', viewAll: 'View all ›', recentSubtitle: 'Your complete workout history.', noWorkouts: 'No {type} workouts logged yet.', sessionDetails: 'Session details', setGoals: 'Set your weekly training goals.', theme: 'Theme', dark: 'Dark', light: 'Light', strengthGoal: 'Strength trainings per week', cardioGoal: 'Cardio trainings per week', strengthSession: 'Strength session', exercises: 'exercises', reps: 'reps', kg: 'kg', activity: 'Activity', minutes: 'minutes', sensorPending: 'Sensor data pending', walking: 'Walking', jogging: 'Jogging', running: 'Running', intention: 'Train with\nintention.' },
  de: { language: 'Deutsch', overview: 'Übersicht', strength: 'Kraft', cardio: 'Cardio', recent: 'Verlauf', settings: 'Einstellungen', back: '‹ Zurück', logStrength: 'Krafttraining eintragen', strengthSubtitle: 'Erstelle eine Einheit mit einer oder mehreren Übungen.', logCardio: 'Cardio eintragen', cardioSubtitle: 'Füge einen Spaziergang, Lauf oder Jogging hinzu.', exercise: 'Übung', repetitions: 'Wiederholungen', weight: 'Gewicht (kg)', selectExercise: 'Übung auswählen', addExercise: 'Übung hinzufügen', saveSession: 'Einheit speichern', saveActivity: 'Aktivität speichern', exercisesInSession: 'Übungen in dieser Einheit', recordingWorkout: 'Training wird aufgezeichnet', readyToRecord: 'Bereit zur Aufzeichnung', start: 'Start', stop: 'Stopp', duration: 'Dauer (Minuten)', phoneWatchData: 'Telefon- und Uhrdaten', sensorDetail: 'Geschwindigkeit, Schritte, Herzfrequenz und Route erscheinen hier, sobald Berechtigungen und die Wearable-Synchronisierung verbunden sind.', speed: 'Geschwindigkeit', steps: 'Schritte', heartRate: 'Herzfrequenz', thisWeek: 'DIESE WOCHE', sessionsLogged: 'Einheiten aufgezeichnet', keepBuilding: 'Baue deine Routine weiter aus', logWorkout: 'Training eintragen', recentActivity: 'Letzte Aktivitäten', viewAll: 'Alle anzeigen ›', recentSubtitle: 'Dein vollständiger Trainingsverlauf.', noWorkouts: 'Noch keine {type}-Trainings eingetragen.', sessionDetails: 'Einheitsdetails', setGoals: 'Lege deine wöchentlichen Trainingsziele fest.', theme: 'Erscheinungsbild', dark: 'Dunkel', light: 'Hell', strengthGoal: 'Krafttrainings pro Woche', cardioGoal: 'Cardio-Trainings pro Woche', strengthSession: 'Krafteinheit', exercises: 'Übungen', reps: 'Wiederholungen', kg: 'kg', activity: 'Aktivität', minutes: 'Minuten', sensorPending: 'Sensordaten ausstehend', walking: 'Gehen', jogging: 'Joggen', running: 'Laufen', intention: 'Trainiere mit\nAbsicht.' },
  fr: { language: 'Français', overview: 'Aperçu', strength: 'Force', cardio: 'Cardio', recent: 'Historique', settings: 'Réglages', back: '‹ Retour', logStrength: 'Enregistrer la force', strengthSubtitle: 'Créez une séance avec un ou plusieurs exercices.', logCardio: 'Enregistrer le cardio', cardioSubtitle: 'Ajoutez une marche, un jogging ou une course.', exercise: 'Exercice', repetitions: 'Répétitions', weight: 'Poids (kg)', selectExercise: 'Choisir un exercice', addExercise: 'Ajouter un exercice', saveSession: 'Enregistrer la séance', saveActivity: 'Enregistrer l’activité', exercisesInSession: 'Exercices de cette séance', recordingWorkout: 'Enregistrement en cours', readyToRecord: 'Prêt à enregistrer', start: 'Démarrer', stop: 'Arrêter', duration: 'Durée (minutes)', phoneWatchData: 'Données du téléphone et de la montre', sensorDetail: 'La vitesse, les pas, la fréquence cardiaque et le parcours apparaîtront ici lorsque les autorisations et la synchronisation seront activées.', speed: 'Vitesse', steps: 'Pas', heartRate: 'Fréquence cardiaque', thisWeek: 'CETTE SEMAINE', sessionsLogged: 'séances enregistrées', keepBuilding: 'Continuez à construire votre routine', logWorkout: 'Enregistrer une séance', recentActivity: 'Activité récente', viewAll: 'Tout voir ›', recentSubtitle: 'Votre historique complet des séances.', noWorkouts: 'Aucune séance de {type} enregistrée.', sessionDetails: 'Détails de la séance', setGoals: 'Définissez vos objectifs hebdomadaires.', theme: 'Thème', dark: 'Sombre', light: 'Clair', strengthGoal: 'Séances de force par semaine', cardioGoal: 'Séances de cardio par semaine', strengthSession: 'Séance de force', exercises: 'exercices', reps: 'répétitions', kg: 'kg', activity: 'Activité', minutes: 'minutes', sensorPending: 'Données des capteurs en attente', walking: 'Marche', jogging: 'Jogging', running: 'Course', intention: 'Entraînez-vous avec\nintention.' },
  it: { language: 'Italiano', overview: 'Panoramica', strength: 'Forza', cardio: 'Cardio', recent: 'Cronologia', settings: 'Impostazioni', back: '‹ Indietro', logStrength: 'Registra forza', strengthSubtitle: 'Crea una sessione con uno o più esercizi.', logCardio: 'Registra cardio', cardioSubtitle: 'Aggiungi una camminata, una corsa o un jogging.', exercise: 'Esercizio', repetitions: 'Ripetizioni', weight: 'Peso (kg)', selectExercise: 'Seleziona esercizio', addExercise: 'Aggiungi esercizio', saveSession: 'Salva sessione', saveActivity: 'Salva attività', exercisesInSession: 'Esercizi in questa sessione', recordingWorkout: 'Registrazione in corso', readyToRecord: 'Pronto per registrare', start: 'Avvia', stop: 'Ferma', duration: 'Durata (minuti)', phoneWatchData: 'Dati del telefono e dell’orologio', sensorDetail: 'Velocità, passi, frequenza cardiaca e percorso appariranno qui quando saranno collegate autorizzazioni e sincronizzazione.', speed: 'Velocità', steps: 'Passi', heartRate: 'Frequenza cardiaca', thisWeek: 'QUESTA SETTIMANA', sessionsLogged: 'sessioni registrate', keepBuilding: 'Continua a costruire la tua routine', logWorkout: 'Registra allenamento', recentActivity: 'Attività recenti', viewAll: 'Vedi tutto ›', recentSubtitle: 'La cronologia completa dei tuoi allenamenti.', noWorkouts: 'Nessun allenamento di {type} registrato.', sessionDetails: 'Dettagli sessione', setGoals: 'Imposta i tuoi obiettivi settimanali.', theme: 'Tema', dark: 'Scuro', light: 'Chiaro', strengthGoal: 'Allenamenti di forza a settimana', cardioGoal: 'Allenamenti cardio a settimana', strengthSession: 'Sessione di forza', exercises: 'esercizi', reps: 'ripetizioni', kg: 'kg', activity: 'Attività', minutes: 'minuti', sensorPending: 'Dati sensore in attesa', walking: 'Camminata', jogging: 'Jogging', running: 'Corsa', intention: 'Allenati con\nintenzione.' },
  es: { language: 'Español', overview: 'Resumen', strength: 'Fuerza', cardio: 'Cardio', recent: 'Historial', settings: 'Ajustes', back: '‹ Atrás', logStrength: 'Registrar fuerza', strengthSubtitle: 'Crea una sesión con uno o más ejercicios.', logCardio: 'Registrar cardio', cardioSubtitle: 'Añade una caminata, un trote o una carrera.', exercise: 'Ejercicio', repetitions: 'Repeticiones', weight: 'Peso (kg)', selectExercise: 'Seleccionar ejercicio', addExercise: 'Añadir ejercicio', saveSession: 'Guardar sesión', saveActivity: 'Guardar actividad', exercisesInSession: 'Ejercicios de esta sesión', recordingWorkout: 'Grabando entrenamiento', readyToRecord: 'Listo para grabar', start: 'Iniciar', stop: 'Detener', duration: 'Duración (minutos)', phoneWatchData: 'Datos del teléfono y reloj', sensorDetail: 'La velocidad, los pasos, la frecuencia cardíaca y la ruta aparecerán aquí cuando se conecten los permisos y la sincronización.', speed: 'Velocidad', steps: 'Pasos', heartRate: 'Frecuencia cardíaca', thisWeek: 'ESTA SEMANA', sessionsLogged: 'sesiones registradas', keepBuilding: 'Sigue construyendo tu rutina', logWorkout: 'Registrar entrenamiento', recentActivity: 'Actividad reciente', viewAll: 'Ver todo ›', recentSubtitle: 'Tu historial completo de entrenamientos.', noWorkouts: 'Aún no hay entrenamientos de {type}.', sessionDetails: 'Detalles de la sesión', setGoals: 'Define tus objetivos semanales.', theme: 'Tema', dark: 'Oscuro', light: 'Claro', strengthGoal: 'Entrenamientos de fuerza por semana', cardioGoal: 'Entrenamientos de cardio por semana', strengthSession: 'Sesión de fuerza', exercises: 'ejercicios', reps: 'repeticiones', kg: 'kg', activity: 'Actividad', minutes: 'minutos', sensorPending: 'Datos del sensor pendientes', walking: 'Caminar', jogging: 'Trote', running: 'Correr', intention: 'Entrena con\nintención.' },
};

const initialEntries: Entry[] = [];

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [entries, setEntries] = useState(initialEntries);
  const [exercise, setExercise] = useState('');
  const [repetitions, setRepetitions] = useState('');
  const [weight, setWeight] = useState('');
  const [strengthExercises, setStrengthExercises] = useState<StrengthExercise[]>([]);
  const [strengthPresets, setStrengthPresets] = useState<string[]>([]);
  const [activity, setActivity] = useState('Jogging');
  const [duration, setDuration] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [strengthGoal, setStrengthGoal] = useState('3');
  const [cardioGoal, setCardioGoal] = useState('3');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const copy = translations[language];
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
    setEntries([{ id: createEntryId(), title: copy.strengthSession, detail: `${strengthExercises.length} ${copy.exercises} · ${exerciseNames}`, accent: '#FF6B4A', type: 'strength', items: strengthExercises.map((item) => `${item.title} · ${item.repetitions} ${copy.reps} · ${item.weight} ${copy.kg}`) }, ...entries]);
    setStrengthExercises([]);
    setScreen('home');
  };

  const addCardio = () => {
    if (!duration.trim()) return;
    setEntries([{ id: createEntryId(), title: activity, detail: `${duration} min · ${copy.sensorPending}`, accent: '#9BE15D', type: 'cardio', items: [`${copy.activity}: ${activity}`, `${copy.duration}: ${duration} ${copy.minutes}`, copy.sensorPending] }, ...entries]);
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
        <ScreenMenu copy={copy} onNavigate={(destination) => setScreen(destination)} />
        {screen === 'home' && <Home entries={entries} copy={copy} strengthGoal={strengthGoal} cardioGoal={cardioGoal} onAdd={() => setScreen('strength')} onCardio={() => setScreen('cardio')} onRecent={() => setScreen('recent')} onOpenSession={openSession} />}
        {screen === 'recent' && <RecentActivities entries={entries} copy={copy} onBack={() => setScreen('home')} onOpenSession={openSession} />}
        {screen === 'settings' && <Settings strengthGoal={strengthGoal} cardioGoal={cardioGoal} language={language} copy={copy} isDark={isDark} strengthPresets={strengthPresets} onAddStrengthPreset={(preset) => setStrengthPresets(strengthPresets.includes(preset) ? strengthPresets : [...strengthPresets, preset])} onLanguageChange={setLanguage} onThemeChange={setIsDark} onStrengthGoalChange={setStrengthGoal} onCardioGoalChange={setCardioGoal} onBack={() => setScreen('home')} />}
        {screen === 'details' && selectedEntry && <SessionDetails entry={selectedEntry} copy={copy} onBack={() => setScreen('recent')} />}
        {screen === 'strength' && (
          <EntryForm title={copy.logStrength} subtitle={copy.strengthSubtitle} onBack={() => setScreen('home')} onSave={saveStrengthSession} saveLabel={copy.saveSession} copy={copy}>
            <Text style={styles.fieldLabel}>{copy.exercise}</Text>
            <ExerciseDropdown value={exercise} onChange={setExercise} copy={copy} options={strengthPresets} />
            <View style={styles.fieldRow}>
              <Field label={copy.repetitions} value={repetitions} onChangeText={setRepetitions} placeholder="12" keyboardType="numeric" copy={copy} />
              <Field label={copy.weight} value={weight} onChangeText={setWeight} placeholder="40" keyboardType="decimal-pad" copy={copy} />
            </View>
            <Pressable style={styles.secondaryButton} onPress={addStrengthExercise}>
              <Text style={styles.secondaryButtonText}>{copy.addExercise}</Text>
            </Pressable>
            {strengthExercises.length > 0 && <View style={styles.pendingExercises}><Text style={styles.pendingTitle}>{copy.exercisesInSession}</Text>{strengthExercises.map((item, index) => <View key={item.id} style={styles.pendingRow}><Text style={styles.pendingIndex}>{index + 1}</Text><View style={styles.sessionCopy}><Text style={styles.sessionTitle}>{item.title}</Text><Text style={styles.sessionDetail}>{item.repetitions} {copy.reps} · {item.weight} {copy.kg}</Text></View></View>)}</View>}
          </EntryForm>
        )}
        {screen === 'cardio' && (
          <EntryForm title={copy.logCardio} subtitle={copy.cardioSubtitle} onBack={() => setScreen('home')} onSave={addCardio} saveLabel={copy.saveActivity} copy={copy}>
            <Text style={styles.fieldLabel}>{copy.activity}</Text>
            <ActivityDropdown value={activity} onChange={setActivity} copy={copy} />
            <View style={styles.recordingCard}>
              <Text style={styles.recordingTime}>{formatRecordingTime(recordingSeconds)}</Text>
              <Text style={styles.recordingStatus}>{isRecording ? copy.recordingWorkout : copy.readyToRecord}</Text>
              <View style={styles.recordingActions}>
                <Pressable style={[styles.recordButton, isRecording && styles.recordButtonDisabled]} onPress={startRecording} disabled={isRecording}>
                  <Text style={styles.recordButtonText}>{copy.start}</Text>
                </Pressable>
                <Pressable style={[styles.stopButton, !isRecording && styles.stopButtonDisabled]} onPress={stopRecording} disabled={!isRecording}>
                  <Text style={styles.stopButtonText}>{copy.stop}</Text>
                </Pressable>
              </View>
            </View>
            <Field label={copy.duration} value={duration} onChangeText={setDuration} placeholder="30" keyboardType="numeric" copy={copy} />
            <View style={styles.sensorCard}>
              <Text style={styles.sensorTitle}>{copy.phoneWatchData}</Text>
              <Text style={styles.sensorDetail}>{copy.sensorDetail}</Text>
              <View style={styles.sensorGrid}>
                <Metric label={copy.speed} value="-- km/h" />
                <Metric label={copy.steps} value="--" />
                <Metric label={copy.heartRate} value="-- bpm" />
              </View>
            </View>
          </EntryForm>
        )}
      </ScrollView>
      <View style={styles.navBar}>
        <NavButton icon="⌂" label={copy.overview} active={screen === 'home'} onPress={() => setScreen('home')} />
        <NavButton icon="✦" label={copy.strength} active={screen === 'strength'} onPress={() => setScreen('strength')} />
        <NavButton icon="◒" label={copy.cardio} active={screen === 'cardio'} onPress={() => setScreen('cardio')} />
        <NavButton icon="◷" label={copy.recent} active={screen === 'recent'} onPress={() => setScreen('recent')} />
      </View>
    </SafeAreaView>
  );
}

function ScreenMenu({ copy, onNavigate }: { copy: Copy; onNavigate: (destination: 'settings' | 'strength' | 'cardio' | 'recent') => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigateFromMenu = (destination: 'settings' | 'strength' | 'cardio' | 'recent') => {
    setMenuOpen(false);
    onNavigate(destination);
  };

  return <View style={styles.menuBar}><Pressable style={styles.avatar} onPress={() => setMenuOpen(!menuOpen)} accessibilityLabel="Open navigation menu" accessibilityState={{ expanded: menuOpen }}><View style={styles.hamburger}><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /></View></Pressable>{menuOpen && <View style={styles.menuDropdown}>{[['settings', copy.settings], ['strength', copy.strength], ['cardio', copy.cardio], ['recent', copy.recent]].map(([destination, label]) => <Pressable key={destination} style={styles.menuItem} onPress={() => navigateFromMenu(destination as 'settings' | 'strength' | 'cardio' | 'recent')}><Text style={styles.menuItemText}>{label}</Text></Pressable>)}</View>}</View>;
}

function Home({ entries, copy, strengthGoal, cardioGoal, onAdd, onCardio, onRecent, onOpenSession }: { entries: Entry[]; copy: Copy; strengthGoal: string; cardioGoal: string; onAdd: () => void; onCardio: () => void; onRecent: () => void; onOpenSession: (entry: Entry) => void }) {
  const strengthPercentage = getGoalPercentage(entries.filter((entry) => entry.type === 'strength').length, strengthGoal);
  const cardioPercentage = getGoalPercentage(entries.filter((entry) => entry.type === 'cardio').length, cardioGoal);
  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerDate}><Text style={styles.eyebrow}>{formatDate(languageFromCopy(copy))}</Text><Text style={styles.title}>{copy.intention}</Text></View>
      </View>
      <View style={styles.progressCard}>
        <View style={styles.progressCopy}><Text style={styles.cardLabel}>{copy.thisWeek}</Text><Text style={styles.progressTitle}>{entries.length} {copy.sessionsLogged}</Text><Text style={styles.progressDetail}>{copy.keepBuilding}</Text></View>
        <View style={styles.progressRings}><ProgressCircle label={copy.cardio} percentage={cardioPercentage} accent="#9BE15D" /><ProgressCircle label={copy.strength} percentage={strengthPercentage} accent="#FF6B4A" /></View>
      </View>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{copy.logWorkout}</Text></View>
      <View style={styles.actionRow}>
        <Pressable style={[styles.actionCard, styles.strengthAction]} onPress={onAdd}><Text style={styles.actionIcon}>+</Text><Text style={styles.actionTitle}>{copy.strength}</Text><Text style={styles.actionDetail}>{copy.reps} & {copy.kg}</Text></Pressable>
        <Pressable style={[styles.actionCard, styles.cardioAction]} onPress={onCardio}><Text style={styles.actionIcon}>→</Text><Text style={styles.actionTitle}>{copy.cardio}</Text><Text style={styles.actionDetail}>{copy.duration} & {copy.speed}</Text></Pressable>
      </View>
      <Pressable style={styles.sectionHeader} onPress={onRecent}><Text style={styles.sectionTitle}>{copy.recentActivity}</Text><Text style={styles.sectionLink}>{copy.viewAll}</Text></Pressable>
      {entries.slice(0, 4).map((entry) => <Pressable key={entry.id} style={styles.sessionRow} onPress={() => onOpenSession(entry)}><View style={[styles.sessionMark, { backgroundColor: entry.accent }]} /><View style={styles.sessionCopy}><Text style={styles.sessionTitle}>{entry.title}</Text><Text style={styles.sessionDetail}>{entry.detail}</Text></View><Text style={styles.chevron}>›</Text></Pressable>)}
    </>
  );
}

function ProgressCircle({ label, percentage, accent }: { label: string; percentage: number; accent: string }) {
  return <View style={styles.progressCircleGroup}><View style={[styles.progressRing, { borderColor: accent }]}><Text style={styles.progressNumber}>{percentage}%</Text></View><Text style={styles.progressCircleLabel}>{label}</Text></View>;
}

function Settings({ strengthGoal, cardioGoal, language, copy, isDark, strengthPresets, onAddStrengthPreset, onLanguageChange, onThemeChange, onStrengthGoalChange, onCardioGoalChange, onBack }: { strengthGoal: string; cardioGoal: string; language: Language; copy: Copy; isDark: boolean; strengthPresets: string[]; onAddStrengthPreset: (preset: string) => void; onLanguageChange: (value: Language) => void; onThemeChange: (value: boolean) => void; onStrengthGoalChange: (value: string) => void; onCardioGoalChange: (value: string) => void; onBack: () => void }) {
  return <><Pressable style={styles.backButton} onPress={onBack} hitSlop={8}><Text style={styles.back}>{copy.back}</Text></Pressable><Text style={styles.formTitle}>{copy.settings}</Text><Text style={styles.formSubtitle}>{copy.setGoals}</Text><View style={styles.settingsForm}><LanguageDropdown value={language} onChange={onLanguageChange} copy={copy} /><ThemeToggle isDark={isDark} onChange={onThemeChange} copy={copy} /><Field label={copy.strengthGoal} value={strengthGoal} onChangeText={onStrengthGoalChange} placeholder="3" keyboardType="numeric" copy={copy} /><Field label={copy.cardioGoal} value={cardioGoal} onChangeText={onCardioGoalChange} placeholder="3" keyboardType="numeric" copy={copy} /><StrengthPresetPicker presets={strengthPresets} language={language} onSelect={onAddStrengthPreset} copy={copy} /></View></>;
}

function ThemeToggle({ isDark, onChange, copy }: { isDark: boolean; onChange: (value: boolean) => void; copy: Copy }) {
  return <View><Text style={styles.fieldLabel}>{copy.theme}</Text><View style={styles.themeToggle}><Pressable style={[styles.themeOption, isDark && styles.themeOptionActive]} onPress={() => onChange(true)}><Text style={[styles.themeOptionText, isDark && styles.themeOptionTextActive]}>{copy.dark}</Text></Pressable><Pressable style={[styles.themeOption, !isDark && styles.themeOptionActive]} onPress={() => onChange(false)}><Text style={[styles.themeOptionText, !isDark && styles.themeOptionTextActive]}>{copy.light}</Text></Pressable></View></View>;
}

function LanguageDropdown({ value, onChange, copy }: { value: Language; onChange: (value: Language) => void; copy: Copy }) {
  const [open, setOpen] = useState(false);
  const options: { key: Language; label: string }[] = [['en', 'English (UK)'], ['de', 'Deutsch'], ['fr', 'Français'], ['it', 'Italiano'], ['es', 'Español']].map(([key, label]) => ({ key: key as Language, label }));
  const selected = options.find((option) => option.key === value);

  return <View><Text style={styles.fieldLabel}>{getLanguageLabel(value)}</Text><View style={styles.dropdownContainer}><Pressable style={styles.dropdownButton} onPress={() => setOpen(!open)}><Text style={styles.dropdownText}>{selected?.label}</Text><Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text></Pressable>{open && <View style={styles.dropdownMenu}>{options.map((option) => <Pressable key={option.key} style={styles.dropdownOption} onPress={() => { onChange(option.key); setOpen(false); }}><Text style={[styles.dropdownOptionText, option.key === value && styles.dropdownOptionActive]}>{option.label}</Text></Pressable>)}</View>}</View></View>;
}

function RecentActivities({ entries, copy, onBack, onOpenSession }: { entries: Entry[]; copy: Copy; onBack: () => void; onOpenSession: (entry: Entry) => void }) {
  const [activeTab, setActiveTab] = useState<WorkoutType>('strength');
  const filteredEntries = entries.filter((entry) => entry.type === activeTab);

  return (
    <>
      <Pressable style={styles.backButton} onPress={onBack} hitSlop={8}><Text style={styles.back}>{copy.back}</Text></Pressable>
      <Text style={styles.formTitle}>{copy.recentActivity}</Text>
      <Text style={styles.formSubtitle}>{copy.recentSubtitle}</Text>
      <View style={styles.historyTabs}>
        <Pressable style={[styles.historyTab, activeTab === 'strength' && styles.historyTabActive]} onPress={() => setActiveTab('strength')}>
          <Text style={[styles.historyTabText, activeTab === 'strength' && styles.historyTabTextActive]}>{copy.strength}</Text>
        </Pressable>
        <Pressable style={[styles.historyTab, activeTab === 'cardio' && styles.historyTabActive]} onPress={() => setActiveTab('cardio')}>
          <Text style={[styles.historyTabText, activeTab === 'cardio' && styles.historyTabTextActive]}>{copy.cardio}</Text>
        </Pressable>
      </View>
      {filteredEntries.length > 0 ? filteredEntries.map((entry) => (
        <Pressable key={entry.id} style={styles.sessionRow} onPress={() => onOpenSession(entry)}>
          <View style={[styles.sessionMark, { backgroundColor: entry.accent }]} />
          <View style={styles.sessionCopy}><Text style={styles.sessionTitle}>{entry.title}</Text><Text style={styles.sessionDetail}>{entry.detail}</Text></View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )) : <Text style={styles.emptyHistory}>{copy.noWorkouts.replace('{type}', activeTab === 'strength' ? copy.strength : copy.cardio)}</Text>}
    </>
  );
}

function SessionDetails({ entry, copy, onBack }: { entry: Entry; copy: Copy; onBack: () => void }) {
  return (
    <>
      <Pressable style={styles.backButton} onPress={onBack} hitSlop={8}><Text style={styles.back}>{copy.back}</Text></Pressable>
      <View style={[styles.detailsAccent, { backgroundColor: entry.accent }]} />
      <Text style={styles.formTitle}>{entry.title}</Text>
      <Text style={styles.formSubtitle}>{entry.detail}</Text>
      <View style={styles.detailsList}>
        <Text style={styles.detailsHeading}>{copy.sessionDetails}</Text>
        {entry.items.map((item, index) => <View key={`${entry.id}-${index}`} style={styles.detailsRow}><Text style={styles.detailsBullet}>•</Text><Text style={styles.detailsText}>{item}</Text></View>)}
      </View>
    </>
  );
}

function EntryForm({ title, subtitle, onBack, onSave, saveLabel = 'Save activity', copy, children }: { title: string; subtitle: string; onBack: () => void; onSave: () => void; saveLabel?: string; copy: Copy; children: React.ReactNode }) {
  return <><Pressable style={styles.backButton} onPress={onBack} hitSlop={8}><Text style={styles.back}>{copy.back}</Text></Pressable><Text style={styles.formTitle}>{title}</Text><Text style={styles.formSubtitle}>{subtitle}</Text><View style={styles.form}>{children}</View><Pressable style={styles.primaryButton} onPress={onSave}><Text style={styles.primaryButtonText}>{saveLabel}</Text></Pressable></>;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'numeric' | 'decimal-pad'; copy?: Copy }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#82909A" keyboardType={keyboardType} /></View>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>;
}

function ActivityDropdown({ value, onChange, copy }: { value: string; onChange: (value: string) => void; copy: Copy }) {
  const [open, setOpen] = useState(false);
  const options = [{ key: 'Walking', label: copy.walking }, { key: 'Jogging', label: copy.jogging }, { key: 'Running', label: copy.running }];
  const selected = options.find((option) => option.key === value);

  return (
    <View style={styles.dropdownContainer}>
      <Pressable style={styles.dropdownButton} onPress={() => setOpen(!open)}>
        <Text style={styles.dropdownText}>{selected?.label}</Text>
        <Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open && (
        <View style={styles.dropdownMenu}>
          {options.map((option) => (
            <Pressable key={option.key} style={styles.dropdownOption} onPress={() => { onChange(option.key); setOpen(false); }}>
              <Text style={[styles.dropdownOptionText, option.key === value && styles.dropdownOptionActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function ExerciseDropdown({ value, onChange, copy, options }: { value: string; onChange: (value: string) => void; copy: Copy; options: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <Pressable style={styles.dropdownButton} onPress={() => setOpen(!open)}>
        <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>{value || copy.selectExercise}</Text>
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

function StrengthPresetPicker({ presets, language, onSelect, copy }: { presets: string[]; language: Language; onSelect: (preset: string) => void; copy: Copy }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filteredGroups = exerciseGroups.map((group) => ({ ...group, exercises: group.exercises[language].filter((item) => item.toLowerCase().includes(search.toLowerCase()) && !presets.includes(item)) })).filter((group) => group.exercises.length > 0);

  return <View style={styles.presetPicker}><Text style={styles.fieldLabel}>{copy.exercise}</Text><Pressable style={styles.dropdownButton} onPress={() => setOpen(!open)}><Text style={styles.dropdownText}>{copy.addExercise}</Text><Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text></Pressable>{open && <View style={styles.presetMenu}><TextInput style={styles.presetSearch} value={search} onChangeText={setSearch} placeholder={copy.selectExercise} placeholderTextColor="#82909A" autoFocus />{filteredGroups.map((group) => <View key={group.categories[language]}><Text style={styles.presetCategory}>{group.categories[language]}</Text>{group.exercises.map((item) => <Pressable key={item} style={styles.dropdownOption} onPress={() => { onSelect(item); setSearch(''); setOpen(false); }}><Text style={styles.dropdownOptionText}>{item}</Text></Pressable>)}</View>)}</View>}</View>;
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

function languageFromCopy(copy: Copy): Language {
  const language = (Object.keys(translations) as Language[]).find((key) => translations[key] === copy);
  return language || 'en';
}

function formatDate(language: Language) {
  const locale = { en: 'en-GB', de: 'de-DE', fr: 'fr-FR', it: 'it-IT', es: 'es-ES' }[language];
  return new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(2025, 7, 20)).toUpperCase();
}

function getLanguageLabel(language: Language) {
  return { en: 'Language', de: 'Sprache', fr: 'Langue', it: 'Lingua', es: 'Idioma' }[language];
}

function createEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function NavButton({ icon, label, active, onPress }: { icon: string; label: string; active: boolean; onPress: () => void }) {
  return <Pressable style={styles.navButton} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}><Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text><Text style={[styles.navText, active && styles.navTextActive]}>{label}</Text></Pressable>;
}

const darkStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B1014' }, container: { padding: 24, paddingBottom: 32 },
  menuBar: { position: 'absolute', top: 24, right: 24, alignItems: 'flex-end', zIndex: 30 },
  presetPicker: { zIndex: 4, elevation: 4 }, presetMenu: { backgroundColor: '#151D24', borderRadius: 12, borderWidth: 1, borderColor: '#2A3740', marginTop: 6, overflow: 'hidden', elevation: 10 }, presetSearch: { backgroundColor: '#1B272E', color: '#F2F5F1', minHeight: 48, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#2A3740' }, presetCategory: { color: '#9BE15D', fontSize: 12, fontWeight: '800', paddingHorizontal: 15, paddingTop: 12, paddingBottom: 4 },
  settingsForm: { gap: 18 }, themeToggle: { flexDirection: 'row', gap: 4, backgroundColor: '#1B272E', borderRadius: 12, padding: 4 }, themeOption: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9 }, themeOptionActive: { backgroundColor: '#2A3740' }, themeOptionText: { color: '#AAB7B0', fontSize: 14, fontWeight: '700' }, themeOptionTextActive: { color: '#F2F5F1', fontWeight: '800' },
  secondaryButton: { backgroundColor: '#2A211E', borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, secondaryButtonText: { color: '#FF8A70', fontSize: 15, fontWeight: '800' }, pendingExercises: { backgroundColor: '#151D24', borderRadius: 16, padding: 16, marginTop: 2 }, pendingTitle: { color: '#F2F5F1', fontSize: 15, fontWeight: '800', marginBottom: 12 }, pendingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#2A3740' }, pendingIndex: { color: '#FF6B4A', fontSize: 15, fontWeight: '800', width: 28 },
  detailsAccent: { width: 48, height: 8, borderRadius: 4, marginBottom: 22 }, detailsList: { backgroundColor: '#151D24', borderRadius: 16, padding: 18, marginTop: 4 }, detailsHeading: { color: '#F2F5F1', fontSize: 16, fontWeight: '800', marginBottom: 12 }, detailsRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#2A3740' }, detailsBullet: { color: '#FF6B4A', fontSize: 18, lineHeight: 20, marginRight: 10 }, detailsText: { flex: 1, color: '#AAB7B0', fontSize: 15, lineHeight: 21 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, zIndex: 20 }, headerDate: { marginTop: 3 }, eyebrow: { color: '#82909A', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 }, title: { color: '#F2F5F1', fontSize: 38, fontWeight: '800', lineHeight: 42 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#24332B', alignItems: 'center', justifyContent: 'center', marginTop: 3 }, hamburger: { width: 20, gap: 4 }, hamburgerLine: { height: 2, width: 20, borderRadius: 1, backgroundColor: '#9BE15D' }, avatarText: { color: '#9BE15D', fontSize: 18, fontWeight: '800' }, menuDropdown: { position: 'absolute', top: 60, right: 0, width: 170, backgroundColor: '#151D24', borderRadius: 14, borderWidth: 1, borderColor: '#2A3740', overflow: 'visible', zIndex: 30, elevation: 12, shadowColor: '#000000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, menuLanguage: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#2A3740' }, menuItem: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#2A3740' }, menuItemText: { color: '#F2F5F1', fontSize: 15, fontWeight: '700' },
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
    presetMenu: { backgroundColor: '#FFFFFF', borderColor: '#E1E4DD' },
    presetSearch: { backgroundColor: '#F7F5F0', color: '#1D2824', borderBottomColor: '#E1E4DD' },
    presetCategory: { color: '#315B4C' },
    menuLanguage: { borderBottomColor: '#E1E4DD' },
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