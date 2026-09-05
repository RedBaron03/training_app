import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Alert, BackHandler, Linking, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { exerciseGroups, type ExerciseGroup } from './exerciseGroups';
import { motivationalMessages, type Language } from './motivationalMessages';
import { mergeExerciseGroups, translateToAllLanguages, type CustomExercise } from './customExercises';
import { isHealthConnectAvailable, pollLiveMetrics, requestHealthPermissions, type LiveHealthMetrics } from './healthConnect';
import { filterEntriesByRange, formatRangeLabel, rangeForPreset, shareExport, type DateRange, type ExportFormat, type RangePreset } from './exportData';
import { formatEntryDate, getEntryTitle, type Copy, type Entry, type StrengthExercise, type WorkoutType } from './types';

type Screen = 'home' | 'strength' | 'cardio' | 'recent' | 'settings' | 'details' | 'exercises';

const translations: Record<Language, Copy> = {
  en: { language: 'English (UK)', overview: 'Overview', strength: 'Strength', cardio: 'Cardio', recent: 'Recent', settings: 'Settings', back: '‹ Back', logStrength: 'Log strength', strengthSubtitle: 'Build a session with one or more exercises.', logCardio: 'Log cardio', cardioSubtitle: 'Add a walk, jog, or run.', exercise: 'Exercise', repetitions: 'Repetitions', weight: 'Weight (kg)', selectExercise: 'Select exercise', addExercise: 'Add exercise', saveSession: 'Save session', saveActivity: 'Save activity', exercisesInSession: 'Exercises in this session', recordingWorkout: 'Recording workout', readyToRecord: 'Ready to record', start: 'Start', stop: 'Stop', duration: 'Duration (minutes)', phoneWatchData: 'Phone & watch data', sensorDetail: 'Speed, steps, heart rate, and route will appear here when device permissions and wearable sync are connected.', speed: 'Speed', steps: 'Steps', heartRate: 'Heart rate', calories: 'Calories', thisWeek: 'THIS WEEK', sessionsLogged: 'sessions logged', keepBuilding: 'Keep building your routine', goalReached: 'You are a machine', logWorkout: 'Log a workout', recentActivity: 'Recent activity', viewAll: 'View all ›', recentSubtitle: 'Your complete workout history.', noWorkouts: 'No {type} workouts logged yet.', sessionDetails: 'Session details', setGoals: 'Set your weekly training goals.', theme: 'Theme', dark: 'Dark', light: 'Light', strengthGoal: 'Strength trainings per week', cardioGoal: 'Cardio trainings per week', strengthSession: 'Strength session', exercises: 'exercises', reps: 'reps', kg: 'kg', activity: 'Activity', minutes: 'minutes', sensorPending: 'Sensor data pending', walking: 'Walking', jogging: 'Jogging', running: 'Running', intention: 'Train with\nintention.', addNewExercise: 'Add "{name}" as a new exercise', chooseCategory: 'Choose a category', confirmAdd: 'Add exercise', translatingExercise: 'Translating…', translateExerciseFailed: 'Could not translate automatically; saved in the original language only.', installHealthConnect: 'Install Health Connect', healthConnectMissing: 'Health Connect is not installed on this device.', exportData: 'Export data', exportTitle: 'Training export', exportSubtitle: 'Choose a format and time range.', chooseFormat: 'Format', csvFormat: 'CSV file', pdfFormat: 'PDF file', rangeAll: 'All', rangeWeek: 'Last 7 days', rangeMonth: 'Last 30 days', rangeYear: 'Last 12 months', rangeCustom: 'Custom', rangeFrom: 'From', rangeTo: 'To', entriesInExport: '{count} entries in range', exportFailed: 'Export failed. Please try again.', exportUnavailable: 'Sharing is not available on this device.', dateHeader: 'Date', typeHeader: 'Type', titleHeader: 'Title', detailsHeader: 'Details', exportColumnDate: 'Date', exportColumnType: 'Type', exportColumnTitle: 'Title', exportColumnExercise: 'Exercise / Activity', exportColumnReps: 'Reps', exportColumnWeight: 'Weight (kg)', exportColumnDuration: 'Duration (min)', exportColumnHeartRate: 'Heart rate (bpm)', exportColumnSteps: 'Steps', exportColumnSpeed: 'Speed (km/h)', exportColumnCalories: 'Calories (kcal)' },
  de: { language: 'Deutsch', overview: 'Übersicht', strength: 'Kraft', cardio: 'Cardio', recent: 'Verlauf', settings: 'Einstellungen', back: '‹ Zurück', logStrength: 'Krafttraining eintragen', strengthSubtitle: 'Erstelle eine Einheit mit einer oder mehreren Übungen.', logCardio: 'Cardio eintragen', cardioSubtitle: 'Füge einen Spaziergang, Lauf oder Jogging hinzu.', exercise: 'Übung', repetitions: 'Wiederholungen', weight: 'Gewicht (kg)', selectExercise: 'Übung auswählen', addExercise: 'Übung hinzufügen', saveSession: 'Einheit speichern', saveActivity: 'Aktivität speichern', exercisesInSession: 'Übungen in dieser Einheit', recordingWorkout: 'Training wird aufgezeichnet', readyToRecord: 'Bereit zur Aufzeichnung', start: 'Start', stop: 'Stopp', duration: 'Dauer (Minuten)', phoneWatchData: 'Telefon- und Uhrdaten', sensorDetail: 'Geschwindigkeit, Schritte, Herzfrequenz und Route erscheinen hier, sobald Berechtigungen und die Wearable-Synchronisierung verbunden sind.', speed: 'Geschwindigkeit', steps: 'Schritte', heartRate: 'Herzfrequenz', calories: 'Kalorien', thisWeek: 'DIESE WOCHE', sessionsLogged: 'Einheiten aufgezeichnet', keepBuilding: 'Baue deine Routine weiter aus', goalReached: 'Du bist eine Maschine', logWorkout: 'Training eintragen', recentActivity: 'Letzte Aktivitäten', viewAll: 'Alle anzeigen ›', recentSubtitle: 'Dein vollständiger Trainingsverlauf.', noWorkouts: 'Noch keine {type}-Trainings eingetragen.', sessionDetails: 'Einheitsdetails', setGoals: 'Lege deine wöchentlichen Trainingsziele fest.', theme: 'Erscheinungsbild', dark: 'Dunkel', light: 'Hell', strengthGoal: 'Krafttrainings pro Woche', cardioGoal: 'Cardio-Trainings pro Woche', strengthSession: 'Krafteinheit', exercises: 'Übungen', reps: 'Wiederholungen', kg: 'kg', activity: 'Aktivität', minutes: 'Minuten', sensorPending: 'Sensordaten ausstehend', walking: 'Gehen', jogging: 'Joggen', running: 'Laufen', intention: 'Trainiere mit\nAbsicht.', addNewExercise: '„{name}“ als neue Übung hinzufügen', chooseCategory: 'Kategorie auswählen', confirmAdd: 'Übung hinzufügen', translatingExercise: 'Wird übersetzt…', translateExerciseFailed: 'Automatische Übersetzung fehlgeschlagen; nur in der Originalsprache gespeichert.', installHealthConnect: 'Health Connect installieren', healthConnectMissing: 'Health Connect ist auf diesem Gerät nicht installiert.', exportData: 'Daten exportieren', exportTitle: 'Trainingsexport', exportSubtitle: 'Wähle Format und Zeitraum.', chooseFormat: 'Format', csvFormat: 'CSV-Datei', pdfFormat: 'PDF-Datei', rangeAll: 'Alle', rangeWeek: 'Letzte 7 Tage', rangeMonth: 'Letzte 30 Tage', rangeYear: 'Letzte 12 Monate', rangeCustom: 'Benutzerdefiniert', rangeFrom: 'Von', rangeTo: 'Bis', entriesInExport: '{count} Einträge im Zeitraum', exportFailed: 'Export fehlgeschlagen. Bitte erneut versuchen.', exportUnavailable: 'Teilen ist auf diesem Gerät nicht verfügbar.', dateHeader: 'Datum', typeHeader: 'Typ', titleHeader: 'Titel', detailsHeader: 'Details', exportColumnDate: 'Datum', exportColumnType: 'Typ', exportColumnTitle: 'Titel', exportColumnExercise: 'Übung / Aktivität', exportColumnReps: 'Wdh.', exportColumnWeight: 'Gewicht (kg)', exportColumnDuration: 'Dauer (Min.)', exportColumnHeartRate: 'Herzfrequenz (bpm)', exportColumnSteps: 'Schritte', exportColumnSpeed: 'Tempo (km/h)', exportColumnCalories: 'Kalorien (kcal)' },
  fr: { language: 'Français', overview: 'Aperçu', strength: 'Force', cardio: 'Cardio', recent: 'Historique', settings: 'Réglages', back: '‹ Retour', logStrength: 'Enregistrer la force', strengthSubtitle: 'Créez une séance avec un ou plusieurs exercices.', logCardio: 'Enregistrer le cardio', cardioSubtitle: 'Ajoutez une marche, un jogging ou une course.', exercise: 'Exercice', repetitions: 'Répétitions', weight: 'Poids (kg)', selectExercise: 'Choisir un exercice', addExercise: 'Ajouter un exercice', saveSession: 'Enregistrer la séance', saveActivity: 'Enregistrer l’activité', exercisesInSession: 'Exercices de cette séance', recordingWorkout: 'Enregistrement en cours', readyToRecord: 'Prêt à enregistrer', start: 'Démarrer', stop: 'Arrêter', duration: 'Durée (minutes)', phoneWatchData: 'Données du téléphone et de la montre', sensorDetail: 'La vitesse, les pas, la fréquence cardiaque et le parcours apparaîtront ici lorsque les autorisations et la synchronisation seront activées.', speed: 'Vitesse', steps: 'Pas', heartRate: 'Fréquence cardiaque', calories: 'Calories', thisWeek: 'CETTE SEMAINE', sessionsLogged: 'séances enregistrées', keepBuilding: 'Continuez à construire votre routine', logWorkout: 'Enregistrer une séance', recentActivity: 'Activité récente', viewAll: 'Tout voir ›', recentSubtitle: 'Votre historique complet des séances.', noWorkouts: 'Aucune séance de {type} enregistrée.', sessionDetails: 'Détails de la séance', setGoals: 'Définissez vos objectifs hebdomadaires.', theme: 'Thème', dark: 'Sombre', light: 'Clair', strengthGoal: 'Séances de force par semaine', cardioGoal: 'Séances de cardio par semaine', strengthSession: 'Séance de force', exercises: 'exercices', reps: 'répétitions', kg: 'kg', activity: 'Activité', minutes: 'minutes', sensorPending: 'Données des capteurs en attente', walking: 'Marche', jogging: 'Jogging', running: 'Course', intention: 'Entraînez-vous avec\nintention.', addNewExercise: 'Ajouter « {name} » comme nouvel exercice', chooseCategory: 'Choisir une catégorie', confirmAdd: 'Ajouter l’exercice', translatingExercise: 'Traduction en cours…', translateExerciseFailed: 'Traduction automatique impossible ; enregistré uniquement dans la langue d’origine.', installHealthConnect: 'Installer Health Connect', healthConnectMissing: 'Health Connect n’est pas installé sur cet appareil.', exportData: 'Exporter les données', exportTitle: 'Export d’entraînement', exportSubtitle: 'Choisissez un format et une période.', chooseFormat: 'Format', csvFormat: 'Fichier CSV', pdfFormat: 'Fichier PDF', rangeAll: 'Tout', rangeWeek: '7 derniers jours', rangeMonth: '30 derniers jours', rangeYear: '12 derniers mois', rangeCustom: 'Personnalisé', rangeFrom: 'Du', rangeTo: 'Au', entriesInExport: '{count} entrées dans la période', exportFailed: 'Échec de l’export. Veuillez réessayer.', exportUnavailable: 'Le partage n’est pas disponible sur cet appareil.', dateHeader: 'Date', typeHeader: 'Type', titleHeader: 'Titre', detailsHeader: 'Détails', exportColumnDate: 'Date', exportColumnType: 'Type', exportColumnTitle: 'Titre', exportColumnExercise: 'Exercice / Activité', exportColumnReps: 'Rép.', exportColumnWeight: 'Poids (kg)', exportColumnDuration: 'Durée (min)', exportColumnHeartRate: 'Fréquence cardiaque (bpm)', exportColumnSteps: 'Pas', exportColumnSpeed: 'Vitesse (km/h)', exportColumnCalories: 'Calories (kcal)' },
  it: { language: 'Italiano', overview: 'Panoramica', strength: 'Forza', cardio: 'Cardio', recent: 'Cronologia', settings: 'Impostazioni', back: '‹ Indietro', logStrength: 'Registra forza', strengthSubtitle: 'Crea una sessione con uno o più esercizi.', logCardio: 'Registra cardio', cardioSubtitle: 'Aggiungi una camminata, una corsa o un jogging.', exercise: 'Esercizio', repetitions: 'Ripetizioni', weight: 'Peso (kg)', selectExercise: 'Seleziona esercizio', addExercise: 'Aggiungi esercizio', saveSession: 'Salva sessione', saveActivity: 'Salva attività', exercisesInSession: 'Esercizi in questa sessione', recordingWorkout: 'Registrazione in corso', readyToRecord: 'Pronto per registrare', start: 'Avvia', stop: 'Ferma', duration: 'Durata (minuti)', phoneWatchData: 'Dati del telefono e dell’orologio', sensorDetail: 'Velocità, passi, frequenza cardiaca e percorso appariranno qui quando saranno collegate autorizzazioni e sincronizzazione.', speed: 'Velocità', steps: 'Passi', heartRate: 'Frequenza cardiaca', calories: 'Calorie', thisWeek: 'QUESTA SETTIMANA', sessionsLogged: 'sessioni registrate', keepBuilding: 'Continua a costruire la tua routine', logWorkout: 'Registra allenamento', recentActivity: 'Attività recenti', viewAll: 'Vedi tutto ›', recentSubtitle: 'La cronologia completa dei tuoi allenamenti.', noWorkouts: 'Nessun allenamento di {type} registrato.', sessionDetails: 'Dettagli sessione', setGoals: 'Imposta i tuoi obiettivi settimanali.', theme: 'Tema', dark: 'Scuro', light: 'Chiaro', strengthGoal: 'Allenamenti di forza a settimana', cardioGoal: 'Allenamenti cardio a settimana', strengthSession: 'Sessione di forza', exercises: 'esercizi', reps: 'ripetizioni', kg: 'kg', activity: 'Attività', minutes: 'minuti', sensorPending: 'Dati sensore in attesa', walking: 'Camminata', jogging: 'Jogging', running: 'Corsa', intention: 'Allenati con\nintenzione.', addNewExercise: 'Aggiungi "{name}" come nuovo esercizio', chooseCategory: 'Scegli una categoria', confirmAdd: 'Aggiungi esercizio', translatingExercise: 'Traduzione in corso…', translateExerciseFailed: 'Traduzione automatica non riuscita; salvato solo nella lingua originale.', installHealthConnect: 'Installa Health Connect', healthConnectMissing: 'Health Connect non è installato su questo dispositivo.', exportData: 'Esporta dati', exportTitle: 'Esportazione allenamenti', exportSubtitle: 'Scegli formato e periodo.', chooseFormat: 'Formato', csvFormat: 'File CSV', pdfFormat: 'File PDF', rangeAll: 'Tutto', rangeWeek: 'Ultimi 7 giorni', rangeMonth: 'Ultimi 30 giorni', rangeYear: 'Ultimi 12 mesi', rangeCustom: 'Personalizzato', rangeFrom: 'Da', rangeTo: 'A', entriesInExport: '{count} voci nel periodo', exportFailed: 'Esportazione non riuscita. Riprova.', exportUnavailable: 'La condivisione non è disponibile su questo dispositivo.', dateHeader: 'Data', typeHeader: 'Tipo', titleHeader: 'Titolo', detailsHeader: 'Dettagli', exportColumnDate: 'Data', exportColumnType: 'Tipo', exportColumnTitle: 'Titolo', exportColumnExercise: 'Esercizio / Attività', exportColumnReps: 'Rip.', exportColumnWeight: 'Peso (kg)', exportColumnDuration: 'Durata (min)', exportColumnHeartRate: 'Frequenza cardiaca (bpm)', exportColumnSteps: 'Passi', exportColumnSpeed: 'Velocità (km/h)', exportColumnCalories: 'Calorie (kcal)' },
  es: { language: 'Español', overview: 'Resumen', strength: 'Fuerza', cardio: 'Cardio', recent: 'Historial', settings: 'Ajustes', back: '‹ Atrás', logStrength: 'Registrar fuerza', strengthSubtitle: 'Crea una sesión con uno o más ejercicios.', logCardio: 'Registrar cardio', cardioSubtitle: 'Añade una caminata, un trote o una carrera.', exercise: 'Ejercicio', repetitions: 'Repeticiones', weight: 'Peso (kg)', selectExercise: 'Seleccionar ejercicio', addExercise: 'Añadir ejercicio', saveSession: 'Guardar sesión', saveActivity: 'Guardar actividad', exercisesInSession: 'Ejercicios de esta sesión', recordingWorkout: 'Grabando entrenamiento', readyToRecord: 'Listo para grabar', start: 'Iniciar', stop: 'Detener', duration: 'Duración (minutos)', phoneWatchData: 'Datos del teléfono y reloj', sensorDetail: 'La velocidad, los pasos, la frecuencia cardíaca y la ruta aparecerán aquí cuando se conecten los permisos y la sincronización.', speed: 'Velocidad', steps: 'Pasos', heartRate: 'Frecuencia cardíaca', calories: 'Calorías', thisWeek: 'ESTA SEMANA', sessionsLogged: 'sesiones registradas', keepBuilding: 'Sigue construyendo tu rutina', logWorkout: 'Registrar entrenamiento', recentActivity: 'Actividad reciente', viewAll: 'Ver todo ›', recentSubtitle: 'Tu historial completo de entrenamientos.', noWorkouts: 'Aún no hay entrenamientos de {type}.', sessionDetails: 'Detalles de la sesión', setGoals: 'Define tus objetivos semanales.', theme: 'Tema', dark: 'Oscuro', light: 'Claro', strengthGoal: 'Entrenamientos de fuerza por semana', cardioGoal: 'Entrenamientos de cardio por semana', strengthSession: 'Sesión de fuerza', exercises: 'ejercicios', reps: 'repeticiones', kg: 'kg', activity: 'Actividad', minutes: 'minutos', sensorPending: 'Datos del sensor pendientes', walking: 'Caminar', jogging: 'Trote', running: 'Correr', intention: 'Entrena con\nintención.', addNewExercise: 'Añadir "{name}" como nuevo ejercicio', chooseCategory: 'Elige una categoría', confirmAdd: 'Añadir ejercicio', translatingExercise: 'Traduciendo…', translateExerciseFailed: 'No se pudo traducir automáticamente; guardado solo en el idioma original.', installHealthConnect: 'Instalar Health Connect', healthConnectMissing: 'Health Connect no está instalado en este dispositivo.', exportData: 'Exportar datos', exportTitle: 'Exportación de entrenamientos', exportSubtitle: 'Elige un formato y un periodo.', chooseFormat: 'Formato', csvFormat: 'Archivo CSV', pdfFormat: 'Archivo PDF', rangeAll: 'Todo', rangeWeek: 'Últimos 7 días', rangeMonth: 'Últimos 30 días', rangeYear: 'Últimos 12 meses', rangeCustom: 'Personalizado', rangeFrom: 'Desde', rangeTo: 'Hasta', entriesInExport: '{count} registros en el periodo', exportFailed: 'Error al exportar. Inténtalo de nuevo.', exportUnavailable: 'Compartir no está disponible en este dispositivo.', dateHeader: 'Fecha', typeHeader: 'Tipo', titleHeader: 'Título', detailsHeader: 'Detalles', exportColumnDate: 'Fecha', exportColumnType: 'Tipo', exportColumnTitle: 'Título', exportColumnExercise: 'Ejercicio / Actividad', exportColumnReps: 'Reps', exportColumnWeight: 'Peso (kg)', exportColumnDuration: 'Duración (min)', exportColumnHeartRate: 'Frecuencia cardíaca (bpm)', exportColumnSteps: 'Pasos', exportColumnSpeed: 'Velocidad (km/h)', exportColumnCalories: 'Calorías (kcal)' },
};

const initialEntries: Entry[] = [];
// v2: structured entry payloads (strength/cardio) — clean break, entries stored under the v1 key are discarded.
const STORAGE_KEY = 'training-app-state-v2';
const LEGACY_STORAGE_KEY = 'training-app-state';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [entries, setEntries] = useState(initialEntries);
  const [exercise, setExercise] = useState('');
  const [repetitions, setRepetitions] = useState('');
  const [weight, setWeight] = useState('');
  const [strengthExercises, setStrengthExercises] = useState<StrengthExercise[]>([]);
  const [strengthPresets, setStrengthPresets] = useState<string[]>([]);
  const [activity, setActivity] = useState('Jogging');
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [strengthGoal, setStrengthGoal] = useState('3');
  const [cardioGoal, setCardioGoal] = useState('3');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [detailsBackScreen, setDetailsBackScreen] = useState<'home' | 'recent'>('recent');
  const [isDark, setIsDark] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [isHydrated, setIsHydrated] = useState(false);
  const [exerciseSelectorBackScreen, setExerciseSelectorBackScreen] = useState<'home' | 'strength' | 'settings'>('settings');
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
  const [liveHealthMetrics, setLiveHealthMetrics] = useState<LiveHealthMetrics>({});
  const [healthConnectStatus, setHealthConnectStatus] = useState<'idle' | 'unavailable' | 'ready'>('idle');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const copy = translations[language];
  const recordingStartedAt = useRef<number | null>(null);

  styles = isDark ? darkStyles : lightStyles;

  useEffect(() => {
    AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch(() => undefined);
    AsyncStorage.getItem(STORAGE_KEY).then((storedState) => {
      if (storedState) {
        const saved = JSON.parse(storedState);
        setEntries(saved.entries || initialEntries);
        setStrengthPresets(saved.strengthPresets || []);
        setCustomExercises(saved.customExercises || []);
        setActivity(saved.activity || 'Jogging');
        setDurationHours(saved.durationHours || '');
        setDurationMinutes(saved.durationMinutes || '');
        setDurationSeconds(saved.durationSeconds || '');
        setStrengthGoal(saved.strengthGoal || '3');
        setCardioGoal(saved.cardioGoal || '3');
        setIsDark(saved.isDark ?? true);
        setLanguage(saved.language || 'en');
      }
    }).catch(() => undefined).finally(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ entries, strengthPresets, customExercises, activity, durationHours, durationMinutes, durationSeconds, strengthGoal, cardioGoal, isDark, language })).catch(() => undefined);
  }, [isHydrated, entries, strengthPresets, customExercises, activity, durationHours, durationMinutes, durationSeconds, strengthGoal, cardioGoal, isDark, language]);

  const changeLanguage = (nextLanguage: Language) => {
    const mergedGroups = mergeExerciseGroups(customExercises);
    setStrengthPresets((presets) => presets.map((preset) => translateExerciseName(preset, language, nextLanguage, mergedGroups)));
    setLanguage(nextLanguage);
  };

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
    const toNumber = (value: string) => Number.parseFloat(value.replace(',', '.')) || 0;
    const exercises = strengthExercises.map((item) => ({ title: item.title, repetitions: toNumber(item.repetitions), weight: toNumber(item.weight) }));
    setEntries([{ id: createEntryId(), title: copy.strengthSession, titleKey: 'strengthSession', detail: `${strengthExercises.length} ${copy.exercises} · ${exerciseNames}`, accent: '#FF6B4A', type: 'strength', items: strengthExercises.map((item) => `${item.title} · ${item.repetitions} ${copy.reps} · ${item.weight} ${copy.kg}`), date: new Date().toISOString(), strength: { exercises } }, ...entries]);
    setStrengthExercises([]);
    setScreen('home');
  };

  const addCardio = () => {
    const selectedSeconds = (Number.parseInt(durationHours, 10) || 0) * 3600 + (Number.parseInt(durationMinutes, 10) || 0) * 60 + (Number.parseInt(durationSeconds, 10) || 0);
    const totalSeconds = recordingSeconds > 0 ? recordingSeconds : selectedSeconds;
    if (totalSeconds <= 0) return;
    const savedDuration = formatDuration(totalSeconds);
    const healthItems = formatHealthMetricsSummary(liveHealthMetrics, copy);
    const sensorSummary = healthItems.length > 0 ? healthItems.join(' · ') : copy.sensorPending;
    setEntries([{ id: createEntryId(), title: activity, titleKey: 'activity', detail: `${savedDuration} · ${sensorSummary}`, accent: '#9BE15D', type: 'cardio', items: [`${copy.activity}: ${activity}`, `${copy.duration}: ${savedDuration}`, ...(healthItems.length > 0 ? healthItems : [copy.sensorPending])], date: new Date().toISOString(), cardio: { activity, durationSeconds: totalSeconds, metrics: { ...liveHealthMetrics } } }, ...entries]);
    setDurationHours('');
    setDurationMinutes('');
    setDurationSeconds('');
    setRecordingSeconds(0);
    setLiveHealthMetrics({});
    setHealthConnectStatus('idle');
    setScreen('home');
  };

  const deleteAllData = () => {
    const confirmation = getDeleteDataCopy(language);
    Alert.alert(confirmation.title, confirmation.message, [
      { text: confirmation.cancel, style: 'cancel' },
      { text: confirmation.confirm, style: 'destructive', onPress: () => { setEntries([]); setStrengthPresets([]); setCustomExercises([]); setStrengthExercises([]); setExercise(''); setRepetitions(''); setWeight(''); setDurationHours(''); setDurationMinutes(''); setDurationSeconds(''); setRecordingSeconds(0); setLiveHealthMetrics({}); setHealthConnectStatus('idle'); setStrengthGoal('3'); setCardioGoal('3'); } },
    ]);
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
    if (!isRecording || healthConnectStatus !== 'ready') return;
    const poll = () => {
      if (!recordingStartedAt.current) return;
      pollLiveMetrics(new Date(recordingStartedAt.current)).then(setLiveHealthMetrics);
    };
    poll();
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, [isRecording, healthConnectStatus]);

  useEffect(() => {
    const handleBackGesture = () => {
      if (screen === 'home') return false;
      setScreen(screen === 'details' ? detailsBackScreen : screen === 'exercises' ? exerciseSelectorBackScreen : 'home');
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackGesture);
    return () => subscription.remove();
  }, [screen, detailsBackScreen]);

  const startRecording = () => {
    recordingStartedAt.current = Date.now();
    setRecordingSeconds(0);
    setLiveHealthMetrics({});
    setIsRecording(true);
    if (Platform.OS !== 'android') {
      setHealthConnectStatus('unavailable');
      return;
    }
    isHealthConnectAvailable().then((available) => {
      if (!available) { setHealthConnectStatus('unavailable'); return; }
      requestHealthPermissions().then((granted) => setHealthConnectStatus(granted ? 'ready' : 'unavailable'));
    });
  };

  const stopRecording = () => {
    const seconds = recordingStartedAt.current ? Math.floor((Date.now() - recordingStartedAt.current) / 1000) : recordingSeconds;
    setRecordingSeconds(seconds);
    setDurationHours(String(Math.floor(seconds / 3600)).padStart(2, '0'));
    setDurationMinutes(String(Math.floor((seconds % 3600) / 60)).padStart(2, '0'));
    setDurationSeconds(String(seconds % 60).padStart(2, '0'));
    recordingStartedAt.current = null;
    setIsRecording(false);
  };

  const handleExport = async (format: ExportFormat, range: DateRange) => {
    const exportEntries = filterEntriesByRange(entries, range);
    if (exportEntries.length === 0) return;
    setIsExporting(true);
    try {
      await shareExport(format, exportEntries, copy, formatRangeLabel(range, language));
      setExportModalVisible(false);
    } catch (error) {
      Alert.alert(copy.exportData, (error as Error)?.message === 'unavailable' ? copy.exportUnavailable : copy.exportFailed);
    } finally {
      setIsExporting(false);
    }
  };

  const openSession = (entry: Entry, backScreen: 'home' | 'recent') => {
    setSelectedEntry(entry);
    setDetailsBackScreen(backScreen);
    setScreen('details');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ScreenMenu copy={copy} onNavigate={(destination) => setScreen(destination)} />
        {screen === 'home' && <Home entries={entries} copy={copy} strengthGoal={strengthGoal} cardioGoal={cardioGoal} onAdd={() => setScreen('strength')} onCardio={() => setScreen('cardio')} onRecent={() => setScreen('recent')} onOpenSession={(entry) => openSession(entry, 'home')} />}
        {screen === 'recent' && <RecentActivities entries={entries} copy={copy} onBack={() => setScreen('home')} onOpenSession={(entry) => openSession(entry, 'recent')} onExport={() => setExportModalVisible(true)} />}
        {screen === 'settings' && <Settings strengthGoal={strengthGoal} cardioGoal={cardioGoal} language={language} copy={copy} isDark={isDark} onLanguageChange={changeLanguage} onThemeChange={setIsDark} onStrengthGoalChange={setStrengthGoal} onCardioGoalChange={setCardioGoal} onOpenExercises={() => { setExerciseSelectorBackScreen('settings'); setScreen('exercises'); }} onDeleteAllData={deleteAllData} onExport={() => setExportModalVisible(true)} onBack={() => setScreen('home')} />}
        {screen === 'exercises' && <ExerciseSelector presets={strengthPresets} language={language} customExercises={customExercises} onAddCustomExercise={(custom) => setCustomExercises((items) => [...items, custom])} onSelect={(preset) => setStrengthPresets((presets) => presets.includes(preset) ? presets.filter((item) => item !== preset) : [...presets, preset])} copy={copy} onBack={() => setScreen(exerciseSelectorBackScreen)} />}
        {screen === 'details' && selectedEntry && <SessionDetails entry={selectedEntry} copy={copy} onBack={() => setScreen(detailsBackScreen)} />}
        {screen === 'strength' && (
          <EntryForm title={copy.logStrength} subtitle={copy.strengthSubtitle} onBack={() => setScreen('home')} onSave={saveStrengthSession} saveLabel={copy.saveSession} copy={copy}>
            <Text style={styles.fieldLabel}>{copy.exercise}</Text>
            <ExerciseDropdown value={exercise} onChange={setExercise} copy={copy} options={strengthPresets} onEmptySelect={() => { setExerciseSelectorBackScreen('strength'); setScreen('exercises'); }} />
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
            <DurationInput hours={durationHours} minutes={durationMinutes} seconds={durationSeconds} onChange={(hours, minutes, seconds) => { setDurationHours(hours); setDurationMinutes(minutes); setDurationSeconds(seconds); setRecordingSeconds(0); }} />
            <View style={styles.sensorCard}>
              <Text style={styles.sensorTitle}>{copy.phoneWatchData}</Text>
              <Text style={styles.sensorDetail}>{copy.sensorDetail}</Text>
              <View style={styles.sensorGrid}>
                <Metric label={copy.speed} value={liveHealthMetrics.speedKmh != null ? `${liveHealthMetrics.speedKmh} km/h` : '-- km/h'} />
                <Metric label={copy.steps} value={liveHealthMetrics.steps != null ? String(liveHealthMetrics.steps) : '--'} />
                <Metric label={copy.heartRate} value={liveHealthMetrics.heartRate != null ? `${liveHealthMetrics.heartRate} bpm` : '-- bpm'} />
                <Metric label={copy.calories} value={liveHealthMetrics.calories != null ? String(liveHealthMetrics.calories) : '--'} />
              </View>
              {healthConnectStatus === 'unavailable' && Platform.OS === 'android' && (
                <Pressable style={styles.secondaryButton} onPress={() => Linking.openURL('market://details?id=com.google.android.apps.healthdata')}>
                  <Text style={styles.secondaryButtonText}>{copy.installHealthConnect}</Text>
                </Pressable>
              )}
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
      <ExportModal visible={exportModalVisible} entries={entries} copy={copy} exporting={isExporting} onClose={() => setExportModalVisible(false)} onExport={handleExport} />
    </SafeAreaView>
  );
}

function ScreenMenu({ copy, onNavigate }: { copy: Copy; onNavigate: (destination: 'settings' | 'strength' | 'cardio' | 'recent' | 'exercises') => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigateFromMenu = (destination: 'settings' | 'strength' | 'cardio' | 'recent' | 'exercises') => {
    setMenuOpen(false);
    onNavigate(destination);
  };

  return <View style={styles.menuBar}><Pressable style={styles.avatar} onPress={() => setMenuOpen(!menuOpen)} accessibilityLabel="Open navigation menu" accessibilityState={{ expanded: menuOpen }}><View style={styles.hamburger}><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /><View style={styles.hamburgerLine} /></View></Pressable>{menuOpen && <View style={styles.menuDropdown}>{[['settings', copy.settings], ['exercises', copy.addExercise], ['strength', copy.strength], ['cardio', copy.cardio], ['recent', copy.recent]].map(([destination, label]) => <Pressable key={destination} style={styles.menuItem} onPress={() => navigateFromMenu(destination as 'settings' | 'strength' | 'cardio' | 'recent' | 'exercises')}><Text style={styles.menuItemText}>{label}</Text></Pressable>)}</View>}</View>;
}

function Home({ entries, copy, strengthGoal, cardioGoal, onAdd, onCardio, onRecent, onOpenSession }: { entries: Entry[]; copy: Copy; strengthGoal: string; cardioGoal: string; onAdd: () => void; onCardio: () => void; onRecent: () => void; onOpenSession: (entry: Entry) => void }) {
  const currentWeekStart = getWeekStart(new Date()).getTime();
  const currentWeekEntries = entries.filter((entry) => getWeekStart(new Date(entry.date)).getTime() === currentWeekStart);
  const strengthPercentage = getGoalPercentage(currentWeekEntries.filter((entry) => entry.type === 'strength').length, strengthGoal);
  const cardioPercentage = getGoalPercentage(currentWeekEntries.filter((entry) => entry.type === 'cardio').length, cardioGoal);
  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerDate}><Text style={styles.eyebrow}>{formatDate(languageFromCopy(copy))}</Text><Text style={styles.title}>{getMotivationalMessage(languageFromCopy(copy))}</Text></View>
      </View>
      <View style={styles.progressCard}>
        <View style={styles.progressCopy}><Text style={styles.cardLabel}>{copy.thisWeek}</Text><Text style={styles.progressTitle}>{currentWeekEntries.length} {copy.sessionsLogged}</Text><Text style={styles.progressDetail}>{(strengthPercentage >= 100 || cardioPercentage >= 100) ? getGoalReachedMessage(languageFromCopy(copy)) : copy.keepBuilding}</Text></View>
        <View style={styles.progressRings}><ProgressCircle label={copy.cardio} percentage={cardioPercentage} accent="#9BE15D" /><ProgressCircle label={copy.strength} percentage={strengthPercentage} accent="#FF6B4A" /></View>
      </View>
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{copy.logWorkout}</Text></View>
      <View style={styles.actionRow}>
        <Pressable style={[styles.actionCard, styles.strengthAction]} onPress={onAdd}><Text style={styles.actionIcon}>+</Text><Text style={styles.actionTitle}>{copy.strength}</Text><Text style={styles.actionDetail}>{copy.reps} & {copy.kg}</Text></Pressable>
        <Pressable style={[styles.actionCard, styles.cardioAction]} onPress={onCardio}><Text style={styles.actionIcon}>→</Text><Text style={styles.actionTitle}>{copy.cardio}</Text><Text style={styles.actionDetail}>{copy.duration} & {copy.speed}</Text></Pressable>
      </View>
      <Pressable style={styles.sectionHeader} onPress={onRecent}><Text style={styles.sectionTitle}>{copy.recentActivity}</Text><Text style={styles.sectionLink}>{copy.viewAll}</Text></Pressable>
      {entries.slice(0, 4).map((entry) => <Pressable key={entry.id} style={styles.sessionRow} onPress={() => onOpenSession(entry)}><View style={[styles.sessionMark, { backgroundColor: entry.accent }]} /><View style={styles.sessionCopy}><Text style={styles.sessionTitle}>{getEntryTitle(entry, copy)}</Text><Text style={styles.sessionDetail}>{entry.detail}</Text></View><Text style={styles.chevron}>›</Text></Pressable>)}
    </>
  );
}

function ProgressCircle({ label, percentage, accent }: { label: string; percentage: number; accent: string }) {
  return <View style={styles.progressCircleGroup}><View style={[styles.progressRing, { borderColor: accent }]}><Text style={styles.progressNumber}>{percentage}%</Text></View><Text style={styles.progressCircleLabel}>{label}</Text></View>;
}

function Settings({ strengthGoal, cardioGoal, language, copy, isDark, onLanguageChange, onThemeChange, onStrengthGoalChange, onCardioGoalChange, onOpenExercises, onDeleteAllData, onExport, onBack }: { strengthGoal: string; cardioGoal: string; language: Language; copy: Copy; isDark: boolean; onLanguageChange: (value: Language) => void; onThemeChange: (value: boolean) => void; onStrengthGoalChange: (value: string) => void; onCardioGoalChange: (value: string) => void; onOpenExercises: () => void; onDeleteAllData: () => void; onExport: () => void; onBack: () => void }) {
  return <><Pressable style={styles.backButton} onPress={onBack} hitSlop={8}><Text style={styles.back}>{copy.back}</Text></Pressable><Text style={styles.formTitle}>{copy.settings}</Text><Text style={styles.formSubtitle}>{copy.setGoals}</Text><View style={styles.settingsForm}><LanguageDropdown value={language} onChange={onLanguageChange} copy={copy} /><ThemeToggle isDark={isDark} onChange={onThemeChange} copy={copy} /><Field label={copy.strengthGoal} value={strengthGoal} onChangeText={onStrengthGoalChange} placeholder="3" keyboardType="numeric" copy={copy} /><Field label={copy.cardioGoal} value={cardioGoal} onChangeText={onCardioGoalChange} placeholder="3" keyboardType="numeric" copy={copy} /><Pressable style={styles.secondaryButton} onPress={onOpenExercises}><Text style={styles.secondaryButtonText}>{copy.addExercise}</Text></Pressable><Pressable style={styles.secondaryButton} onPress={onExport}><Text style={styles.secondaryButtonText}>{copy.exportData}</Text></Pressable><Pressable style={styles.deleteButton} onPress={onDeleteAllData}><Text style={styles.deleteButtonText}>{getDeleteDataCopy(language).button}</Text></Pressable></View></>;
}

function ThemeToggle({ isDark, onChange, copy }: { isDark: boolean; onChange: (value: boolean) => void; copy: Copy }) {
  return <View><Text style={styles.fieldLabel}>{copy.theme}</Text><View style={styles.themeToggle}><Pressable style={[styles.themeOption, isDark && styles.themeOptionActive]} onPress={() => onChange(true)}><Text style={[styles.themeOptionText, isDark && styles.themeOptionTextActive]}>{copy.dark}</Text></Pressable><Pressable style={[styles.themeOption, !isDark && styles.themeOptionActive]} onPress={() => onChange(false)}><Text style={[styles.themeOptionText, !isDark && styles.themeOptionTextActive]}>{copy.light}</Text></Pressable></View></View>;
}

function LanguageDropdown({ value, onChange, copy }: { value: Language; onChange: (value: Language) => void; copy: Copy }) {
  const [open, setOpen] = useState(false);
  const options: { key: Language; label: string; flag: string }[] = [['en', 'English (UK)', '🇬🇧'], ['de', 'Deutsch', '🇩🇪'], ['fr', 'Français', '🇫🇷'], ['it', 'Italiano', '🇮🇹'], ['es', 'Español', '🇪🇸']].map(([key, label, flag]) => ({ key: key as Language, label, flag }));
  const selected = options.find((option) => option.key === value);

  return <View><Text style={styles.fieldLabel}>{getLanguageLabel(value)}</Text><View style={styles.dropdownContainer}><Pressable style={styles.dropdownButton} onPress={() => setOpen(!open)}><View style={styles.languageOptionContent}><Text style={styles.languageFlag}>{selected?.flag}</Text><Text style={styles.dropdownText}>{selected?.label}</Text></View><Text style={styles.dropdownArrow}>{open ? '▲' : '▼'}</Text></Pressable>{open && <View style={styles.dropdownMenu}>{options.map((option) => <Pressable key={option.key} style={styles.dropdownOption} onPress={() => { onChange(option.key); setOpen(false); }}><View style={styles.languageOptionContent}><Text style={styles.languageFlag}>{option.flag}</Text><Text style={[styles.dropdownOptionText, option.key === value && styles.dropdownOptionActive]}>{option.label}</Text></View></Pressable>)}</View>}</View></View>;
}

function RecentActivities({ entries, copy, onBack, onOpenSession, onExport }: { entries: Entry[]; copy: Copy; onBack: () => void; onOpenSession: (entry: Entry) => void; onExport: () => void }) {
  const [activeTab, setActiveTab] = useState<WorkoutType>('strength');
  const [grouping, setGrouping] = useState<'week' | 'month' | 'year'>('week');
  const filteredEntries = entries.filter((entry) => entry.type === activeTab).sort((first, second) => Date.parse(second.date) - Date.parse(first.date));
  const groupedEntries = groupEntries(filteredEntries, grouping, languageFromCopy(copy));
  const [openGroupKey, setOpenGroupKey] = useState<string | null>(null);

  useEffect(() => {
    setOpenGroupKey(groupedEntries[0]?.key || null);
  }, [activeTab, grouping]);

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
      <View style={styles.historyTabs}>
        {(['week', 'month', 'year'] as const).map((option) => (
          <Pressable key={option} style={[styles.historyTab, grouping === option && styles.historyTabActive]} onPress={() => setGrouping(option)}>
            <Text style={[styles.historyTabText, grouping === option && styles.historyTabTextActive]}>{getGroupingLabel(option, languageFromCopy(copy))}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.secondaryButton} onPress={onExport}>
        <Text style={styles.secondaryButtonText}>{copy.exportData}</Text>
      </Pressable>
      {filteredEntries.length > 0 ? groupedEntries.map((group) => (
        <View key={group.key}>
          <Pressable style={styles.groupHeader} onPress={() => setOpenGroupKey(openGroupKey === group.key ? null : group.key)}>
            <Text style={styles.groupHeading}>{group.label}</Text>
            <Text style={styles.groupChevron}>{openGroupKey === group.key ? '▲' : '▼'}</Text>
          </Pressable>
          {openGroupKey === group.key && group.entries.map((entry) => (
            <Pressable key={entry.id} style={styles.sessionRow} onPress={() => onOpenSession(entry)}>
              <View style={[styles.sessionMark, { backgroundColor: entry.accent }]} />
              <View style={styles.sessionCopy}><Text style={styles.sessionTitle}>{getEntryTitle(entry, copy)}</Text><Text style={styles.sessionDetail}>{entry.detail}</Text><Text style={styles.sessionDate}>{formatEntryDate(entry.date, languageFromCopy(copy))}</Text></View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      )) : <Text style={styles.emptyHistory}>{copy.noWorkouts.replace('{type}', activeTab === 'strength' ? copy.strength : copy.cardio)}</Text>}
    </>
  );
}

function SessionDetails({ entry, copy, onBack }: { entry: Entry; copy: Copy; onBack: () => void }) {
  return (
    <>
      <Pressable style={styles.backButton} onPress={onBack} hitSlop={8}><Text style={styles.back}>{copy.back}</Text></Pressable>
      <View style={[styles.detailsAccent, { backgroundColor: entry.accent }]} />
      <Text style={styles.formTitle}>{getEntryTitle(entry, copy)}</Text>
      <Text style={styles.formSubtitle}>{entry.detail}</Text>
      <Text style={styles.sessionDate}>{formatEntryDate(entry.date, languageFromCopy(copy))}</Text>
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

function DurationInput({ hours, minutes, seconds, onChange }: { hours: string; minutes: string; seconds: string; onChange: (hours: string, minutes: string, seconds: string) => void }) {
  const sanitize = (value: string, max: number) => {
    const digits = value.replace(/\D/g, '').slice(0, 2);
    if (!digits) return '';
    return String(Math.min(max, Number.parseInt(digits, 10)));
  };

  return <View style={styles.durationInput}>
    <TextInput style={styles.durationField} value={hours} onChangeText={(value) => onChange(sanitize(value, 24), minutes, seconds)} placeholder="HH" placeholderTextColor="#82909A" keyboardType="numeric" maxLength={2} selectTextOnFocus />
    <Text style={styles.durationSeparator}>:</Text>
    <TextInput style={styles.durationField} value={minutes} onChangeText={(value) => onChange(hours, sanitize(value, 59), seconds)} placeholder="MM" placeholderTextColor="#82909A" keyboardType="numeric" maxLength={2} selectTextOnFocus />
    <Text style={styles.durationSeparator}>:</Text>
    <TextInput style={styles.durationField} value={seconds} onChangeText={(value) => onChange(hours, minutes, sanitize(value, 59))} placeholder="SS" placeholderTextColor="#82909A" keyboardType="numeric" maxLength={2} selectTextOnFocus />
  </View>;
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

function ExerciseDropdown({ value, onChange, copy, options, onEmptySelect }: { value: string; onChange: (value: string) => void; copy: Copy; options: string[]; onEmptySelect: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <Pressable style={styles.dropdownButton} onPress={() => options.length === 0 ? onEmptySelect() : setOpen(!open)}>
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

function ExerciseSelector({ presets, language, customExercises, onAddCustomExercise, onSelect, copy, onBack }: { presets: string[]; language: Language; customExercises: CustomExercise[]; onAddCustomExercise: (custom: CustomExercise) => void; onSelect: (preset: string) => void; copy: Copy; onBack: () => void }) {
  const [search, setSearch] = useState('');
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateFailed, setTranslateFailed] = useState(false);
  const mergedGroups = mergeExerciseGroups(customExercises);
  const filteredGroups = mergedGroups.map((group) => ({ ...group, exercises: group.exercises[language].filter((item) => item.toLowerCase().includes(search.toLowerCase())) })).filter((group) => group.exercises.length > 0);
  const selectedExercises = filteredGroups.flatMap((group) => group.exercises).filter((item) => presets.includes(item));
  const unselectedGroups = filteredGroups.map((group) => ({ ...group, exercises: group.exercises.filter((item) => !presets.includes(item)) })).filter((group) => group.exercises.length > 0);
  const trimmedSearch = search.trim();
  const hasNoMatches = trimmedSearch.length > 0 && filteredGroups.length === 0;

  const confirmAddExercise = async () => {
    if (!trimmedSearch || !categoryKey) return;
    setIsTranslating(true);
    const { translations, hadFailure } = await translateToAllLanguages(trimmedSearch, language);
    setIsTranslating(false);
    setTranslateFailed(hadFailure);
    onAddCustomExercise({ categoryKey, translations });
    onSelect(translations[language]);
    setSearch('');
    setCategoryKey(null);
  };

  return <><Pressable style={styles.backButton} onPress={onBack} hitSlop={8}><Text style={styles.back}>{copy.back}</Text></Pressable><Text style={styles.formTitle}>{copy.addExercise}</Text><Text style={styles.formSubtitle}>{copy.strengthSubtitle}</Text><View style={styles.exerciseList}><TextInput style={styles.presetSearch} value={search} onChangeText={(value) => { setSearch(value); setCategoryKey(null); setTranslateFailed(false); }} placeholder={copy.selectExercise} placeholderTextColor="#82909A" autoFocus />{selectedExercises.map((item) => <Pressable key={item} style={[styles.dropdownOption, styles.dropdownOptionSelected]} onPress={() => onSelect(item)}><Text style={[styles.dropdownOptionText, styles.dropdownOptionSelectedText]}>{item}</Text><Text style={styles.dropdownCheck}>✓</Text></Pressable>)}{unselectedGroups.map((group) => <View key={group.categories[language]}><Text style={styles.presetCategory}>{group.categories[language]}</Text>{group.exercises.map((item) => <Pressable key={item} style={styles.dropdownOption} onPress={() => onSelect(item)}><Text style={styles.dropdownOptionText}>{item}</Text></Pressable>)}</View>)}{hasNoMatches && <View style={styles.pendingExercises}><Text style={styles.pendingTitle}>{copy.addNewExercise.replace('{name}', trimmedSearch)}</Text><Text style={styles.fieldLabel}>{copy.chooseCategory}</Text>{exerciseGroups.map((group) => <Pressable key={group.categories.en} style={[styles.dropdownOption, categoryKey === group.categories.en && styles.dropdownOptionSelected]} onPress={() => setCategoryKey(group.categories.en)}><Text style={[styles.dropdownOptionText, categoryKey === group.categories.en && styles.dropdownOptionSelectedText]}>{group.categories[language]}</Text></Pressable>)}<Pressable style={[styles.secondaryButton, (!categoryKey || isTranslating) && styles.stopButtonDisabled]} onPress={confirmAddExercise} disabled={!categoryKey || isTranslating}><Text style={styles.secondaryButtonText}>{isTranslating ? copy.translatingExercise : copy.confirmAdd}</Text></Pressable>{translateFailed && <Text style={styles.sensorDetail}>{copy.translateExerciseFailed}</Text>}</View>}</View></>;
}

function formatRecordingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return hours > 0 ? `${hours.toString().padStart(2, '0')}:${minutes}:${remainingSeconds}` : `${minutes}:${remainingSeconds}`;
}

function formatHealthMetricsSummary(metrics: LiveHealthMetrics, copy: Copy) {
  const items: string[] = [];
  if (metrics.heartRate != null) items.push(`${copy.heartRate}: ${metrics.heartRate} bpm`);
  if (metrics.steps != null) items.push(`${copy.steps}: ${metrics.steps}`);
  if (metrics.speedKmh != null) items.push(`${copy.speed}: ${metrics.speedKmh} km/h`);
  if (metrics.calories != null) items.push(`${copy.calories}: ${metrics.calories} kcal`);
  return items;
}

function getGoalPercentage(completed: number, goal: string) {
  const target = Number.parseInt(goal, 10);
  if (!Number.isFinite(target) || target <= 0) return 0;
  return Math.round((completed / target) * 100);
}

function languageFromCopy(copy: Copy): Language {
  const language = (Object.keys(translations) as Language[]).find((key) => translations[key] === copy);
  return language || 'en';
}

function groupEntries(entries: Entry[], grouping: 'week' | 'month' | 'year', language: Language) {
  const groups = new Map<string, Entry[]>();
  entries.forEach((entry) => {
    const date = new Date(entry.date);
    const key = grouping === 'year' ? `${date.getFullYear()}` : grouping === 'month' ? `${date.getFullYear()}-${date.getMonth()}` : getWeekStart(date).toISOString();
    groups.set(key, [...(groups.get(key) || []), entry]);
  });
  return Array.from(groups, ([key, groupEntries]) => ({ key, entries: groupEntries, label: formatGroupLabel(new Date(groupEntries[0].date), grouping, language) }));
}

function getWeekStart(date: Date) {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function formatGroupLabel(date: Date, grouping: 'week' | 'month' | 'year', language: Language) {
  if (grouping === 'year') return String(date.getFullYear());
  if (grouping === 'month') return new Intl.DateTimeFormat({ en: 'en-GB', de: 'de-DE', fr: 'fr-FR', it: 'it-IT', es: 'es-ES' }[language], { month: 'long', year: 'numeric' }).format(date);
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return `${formatEntryDate(weekStart.toISOString(), language)} - ${formatEntryDate(weekEnd.toISOString(), language)}`;
}

function getGroupingLabel(grouping: 'week' | 'month' | 'year', language: Language) {
  return { en: { week: 'Week', month: 'Month', year: 'Year' }, de: { week: 'Woche', month: 'Monat', year: 'Jahr' }, fr: { week: 'Semaine', month: 'Mois', year: 'Année' }, it: { week: 'Settimana', month: 'Mese', year: 'Anno' }, es: { week: 'Semana', month: 'Mes', year: 'Año' } }[language][grouping];
}

function getGoalReachedMessage(language: Language) {
  return { en: 'You are a machine', de: 'Du bist eine Maschine', fr: 'Vous êtes une machine', it: 'Sei una macchina', es: 'Eres una máquina' }[language];
}

function ExportModal({ visible, entries, copy, exporting, onClose, onExport }: { visible: boolean; entries: Entry[]; copy: Copy; exporting: boolean; onClose: () => void; onExport: (format: ExportFormat, range: DateRange) => void }) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [preset, setPreset] = useState<RangePreset>('all');
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const language = languageFromCopy(copy);
  const range = rangeForPreset(preset, customStart, customEnd);
  const count = range ? filterEntriesByRange(entries, range).length : 0;
  const rangePresets: { key: RangePreset; label: string }[] = [{ key: 'all', label: copy.rangeAll }, { key: 'week', label: copy.rangeWeek }, { key: 'month', label: copy.rangeMonth }, { key: 'year', label: copy.rangeYear }, { key: 'custom', label: copy.rangeCustom }];

  const handlePickerChange = (event: DateTimePickerEvent, value?: Date) => {
    setActivePicker(null);
    if (event.type !== 'set' || !value) return;
    if (activePicker === 'start') setCustomStart(value);
    if (activePicker === 'end') setCustomEnd(value);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{copy.exportTitle}</Text>
          <Text style={styles.modalSubtitle}>{copy.exportSubtitle}</Text>
          <Text style={styles.fieldLabel}>{copy.chooseFormat}</Text>
          <View style={styles.historyTabs}>
            {([['csv', copy.csvFormat], ['pdf', copy.pdfFormat]] as [ExportFormat, string][]).map(([key, label]) => (
              <Pressable key={key} style={[styles.historyTab, format === key && styles.historyTabActive]} onPress={() => setFormat(key)}>
                <Text style={[styles.historyTabText, format === key && styles.historyTabTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.historyTabs}>
            {rangePresets.map((option) => (
              <Pressable key={option.key} style={[styles.historyTab, preset === option.key && styles.historyTabActive]} onPress={() => setPreset(option.key)}>
                <Text style={[styles.historyTabText, preset === option.key && styles.historyTabTextActive]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
          {preset === 'custom' && (
            <View style={styles.fieldRow}>
              <Pressable style={styles.dateField} onPress={() => setActivePicker('start')}>
                <Text style={styles.fieldLabel}>{copy.rangeFrom}</Text>
                <Text style={styles.dateFieldValue}>{customStart ? formatEntryDate(customStart.toISOString(), language) : '—'}</Text>
              </Pressable>
              <Pressable style={styles.dateField} onPress={() => setActivePicker('end')}>
                <Text style={styles.fieldLabel}>{copy.rangeTo}</Text>
                <Text style={styles.dateFieldValue}>{customEnd ? formatEntryDate(customEnd.toISOString(), language) : '—'}</Text>
              </Pressable>
            </View>
          )}
          <Text style={styles.exportCount}>{copy.entriesInExport.replace('{count}', String(count))}</Text>
          <Pressable style={[styles.primaryButton, (count === 0 || exporting) && styles.primaryButtonDisabled]} disabled={count === 0 || exporting} onPress={() => range && onExport(format, range)}>
            <Text style={styles.primaryButtonText}>{copy.exportData}</Text>
          </Pressable>
          <Pressable style={styles.modalCancel} onPress={onClose} hitSlop={8}>
            <Text style={styles.modalCancelText}>{getDeleteDataCopy(language).cancel}</Text>
          </Pressable>
        </View>
      </View>
      {activePicker && <DateTimePicker value={(activePicker === 'start' ? customStart : customEnd) || new Date()} maximumDate={new Date()} mode="date" display="default" onChange={handlePickerChange} />}
    </Modal>
  );
}

function getDeleteDataCopy(language: Language) {
  return {
    en: { button: 'Delete all data', title: 'Delete all data?', message: 'All saved activities, exercises, goals, and form data will be permanently lost.', cancel: 'Cancel', confirm: 'Delete' },
    de: { button: 'Alle Daten löschen', title: 'Alle Daten löschen?', message: 'Alle gespeicherten Aktivitäten, Übungen, Ziele und Formulardaten gehen dauerhaft verloren.', cancel: 'Abbrechen', confirm: 'Löschen' },
    fr: { button: 'Supprimer toutes les données', title: 'Supprimer toutes les données ?', message: 'Toutes les activités, tous les exercices, objectifs et formulaires enregistrés seront définitivement perdus.', cancel: 'Annuler', confirm: 'Supprimer' },
    it: { button: 'Elimina tutti i dati', title: 'Eliminare tutti i dati?', message: 'Tutte le attività, gli esercizi, gli obiettivi e i dati dei moduli salvati andranno persi definitivamente.', cancel: 'Annulla', confirm: 'Elimina' },
    es: { button: 'Eliminar todos los datos', title: '¿Eliminar todos los datos?', message: 'Todas las actividades, ejercicios, objetivos y datos de formularios guardados se perderán permanentemente.', cancel: 'Cancelar', confirm: 'Eliminar' },
  }[language];
}

function translateExerciseName(name: string, fromLanguage: Language, toLanguage: Language, groups: ExerciseGroup[] = exerciseGroups) {
  for (const group of groups) {
    const sourceIndex = group.exercises[fromLanguage].indexOf(name);
    if (sourceIndex !== -1) return group.exercises[toLanguage][sourceIndex];
  }
  return name;
}

function formatDate(language: Language) {
  const locale = { en: 'en-GB', de: 'de-DE', fr: 'fr-FR', it: 'it-IT', es: 'es-ES' }[language];
  return new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();
}

function getMotivationalMessage(language: Language) {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
  const dayOfYear = Math.floor((Date.now() - startOfYear) / 86400000);
  return motivationalMessages[language][dayOfYear % motivationalMessages[language].length];
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
  presetPicker: { zIndex: 4, elevation: 4 }, exerciseList: { backgroundColor: '#151D24', borderRadius: 12, borderWidth: 1, borderColor: '#2A3740', overflow: 'hidden', elevation: 10 }, presetSearch: { backgroundColor: '#1B272E', color: '#F2F5F1', minHeight: 48, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#2A3740' }, presetCategory: { color: '#9BE15D', fontSize: 12, fontWeight: '800', paddingHorizontal: 15, paddingTop: 12, paddingBottom: 4 }, dropdownOptionSelected: { backgroundColor: '#24332B', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, dropdownOptionSelectedText: { color: '#F2F5F1', fontWeight: '800' }, dropdownCheck: { color: '#9BE15D', fontSize: 16, fontWeight: '800' }, durationInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, durationField: { minWidth: 72, minHeight: 58, borderRadius: 14, borderWidth: 2, borderColor: '#42534A', backgroundColor: '#24332B', color: '#F2F5F1', fontSize: 26, fontWeight: '800', textAlign: 'center', paddingHorizontal: 8 }, durationSeparator: { color: '#9BE15D', fontSize: 28, fontWeight: '800' }, deleteButton: { backgroundColor: '#5B2027', borderRadius: 12, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C94F5B' }, deleteButtonText: { color: '#FFD9DC', fontSize: 15, fontWeight: '800' },
  settingsForm: { gap: 18 }, themeToggle: { flexDirection: 'row', gap: 4, backgroundColor: '#1B272E', borderRadius: 12, padding: 4 }, themeOption: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9 }, themeOptionActive: { backgroundColor: '#2A3740' }, themeOptionText: { color: '#AAB7B0', fontSize: 14, fontWeight: '700' }, themeOptionTextActive: { color: '#F2F5F1', fontWeight: '800' },
  secondaryButton: { backgroundColor: '#2A211E', borderRadius: 12, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, secondaryButtonText: { color: '#FF8A70', fontSize: 15, fontWeight: '800' }, pendingExercises: { backgroundColor: '#151D24', borderRadius: 16, padding: 16, marginTop: 2 }, pendingTitle: { color: '#F2F5F1', fontSize: 15, fontWeight: '800', marginBottom: 12 }, pendingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#2A3740' }, pendingIndex: { color: '#FF6B4A', fontSize: 15, fontWeight: '800', width: 28 },
  detailsAccent: { width: 48, height: 8, borderRadius: 4, marginBottom: 22 }, detailsList: { backgroundColor: '#151D24', borderRadius: 16, padding: 18, marginTop: 4 }, detailsHeading: { color: '#F2F5F1', fontSize: 16, fontWeight: '800', marginBottom: 12 }, detailsRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 9, borderTopWidth: 1, borderTopColor: '#2A3740' }, detailsBullet: { color: '#FF6B4A', fontSize: 18, lineHeight: 20, marginRight: 10 }, detailsText: { flex: 1, color: '#AAB7B0', fontSize: 15, lineHeight: 21 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, zIndex: 20 }, headerDate: { marginTop: 3 }, eyebrow: { color: '#82909A', fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 }, title: { color: '#F2F5F1', fontSize: 38, fontWeight: '800', lineHeight: 42 }, avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#24332B', alignItems: 'center', justifyContent: 'center', marginTop: 3 }, hamburger: { width: 20, gap: 4 }, hamburgerLine: { height: 2, width: 20, borderRadius: 1, backgroundColor: '#9BE15D' }, avatarText: { color: '#9BE15D', fontSize: 18, fontWeight: '800' }, menuDropdown: { position: 'absolute', top: 60, right: 0, width: 170, backgroundColor: '#151D24', borderRadius: 14, borderWidth: 1, borderColor: '#2A3740', overflow: 'visible', zIndex: 30, elevation: 12, shadowColor: '#000000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, menuLanguage: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#2A3740' }, menuItem: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#2A3740' }, menuItemText: { color: '#F2F5F1', fontSize: 15, fontWeight: '700' },
  progressCard: { backgroundColor: '#151D24', borderRadius: 20, padding: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }, progressCopy: { flex: 1 }, cardLabel: { color: '#9BE15D', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 12 }, progressTitle: { color: '#F2F5F1', fontSize: 22, fontWeight: '800', marginBottom: 6 }, progressDetail: { color: '#AAB7B0', fontSize: 14 }, progressRings: { flexDirection: 'row', gap: 10, marginLeft: 12 }, progressCircleGroup: { alignItems: 'center' }, progressRing: { width: 62, height: 62, borderRadius: 31, borderWidth: 6, alignItems: 'center', justifyContent: 'center' }, progressNumber: { color: '#F2F5F1', fontSize: 14, fontWeight: '800' }, progressCircleLabel: { color: '#AAB7B0', fontSize: 10, fontWeight: '700', marginTop: 5 },
  sectionHeader: { marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { color: '#F2F5F1', fontSize: 20, fontWeight: '800' }, sectionLink: { color: '#FF6B4A', fontSize: 13, fontWeight: '800' }, actionRow: { flexDirection: 'row', gap: 12, marginBottom: 30 }, actionCard: { flex: 1, borderRadius: 16, padding: 18, minHeight: 126 }, strengthAction: { backgroundColor: '#38231F' }, cardioAction: { backgroundColor: '#20352B' }, actionIcon: { color: '#F2F5F1', fontSize: 25, fontWeight: '400', marginBottom: 14 }, actionTitle: { color: '#F2F5F1', fontSize: 17, fontWeight: '800', marginBottom: 5 }, actionDetail: { color: '#AAB7B0', fontSize: 13 },
  sessionRow: { backgroundColor: '#151D24', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 }, sessionMark: { width: 10, height: 42, borderRadius: 5, marginRight: 14 }, sessionCopy: { flex: 1 }, sessionTitle: { color: '#F2F5F1', fontSize: 16, fontWeight: '700', marginBottom: 5 }, sessionDetail: { color: '#82909A', fontSize: 13 }, sessionDate: { color: '#71808A', fontSize: 12, marginTop: 5 }, groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, groupHeading: { color: '#9BE15D', fontSize: 14, fontWeight: '800', marginTop: 8, marginBottom: 10, textTransform: 'uppercase' }, groupChevron: { color: '#9BE15D', fontSize: 12, marginRight: 4 }, timeDialRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' }, timeDial: { minWidth: 92, minHeight: 142, paddingVertical: 18, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 46, borderWidth: 2, borderColor: '#42534A', backgroundColor: '#24332B', shadowColor: '#000000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, dialValue: { color: '#F2F5F1', fontSize: 34, fontWeight: '800', minHeight: 42 }, dialLabel: { color: '#9BE15D', fontSize: 12, fontWeight: '800', marginTop: 8 }, chevron: { color: '#71808A', fontSize: 28, fontWeight: '300' },
  navBar: { borderTopWidth: 1, borderTopColor: '#2A3740', backgroundColor: '#10171D', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, paddingBottom: 12 }, navButton: { alignItems: 'center', flex: 1 }, navIcon: { color: '#4B5962', fontSize: 19, lineHeight: 22, marginBottom: 3 }, navIconActive: { color: '#9BE15D' }, navDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4B5962', marginBottom: 6 }, navDotActive: { backgroundColor: '#9BE15D', width: 18 }, navText: { color: '#82909A', fontSize: 11, fontWeight: '700' }, navTextActive: { color: '#9BE15D' }, languageOptionContent: { flexDirection: 'row', alignItems: 'center', gap: 10 }, languageFlag: { fontSize: 20 },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginBottom: 16 }, back: { color: '#FF6B4A', fontSize: 16, fontWeight: '700' }, formTitle: { color: '#F2F5F1', fontSize: 32, fontWeight: '800', marginBottom: 8 }, formSubtitle: { color: '#82909A', fontSize: 15, marginBottom: 28 }, form: { gap: 18 }, fieldRow: { flexDirection: 'row', gap: 12 }, field: { flex: 1 }, fieldLabel: { color: '#AAB7B0', fontSize: 13, fontWeight: '700', marginBottom: 8 }, input: { backgroundColor: '#151D24', borderRadius: 12, minHeight: 52, paddingHorizontal: 15, color: '#F2F5F1', fontSize: 16, borderWidth: 1, borderColor: '#2A3740' }, modalBackdrop: { flex: 1, backgroundColor: 'rgba(4, 8, 10, 0.72)', justifyContent: 'center', padding: 24 }, modalCard: { backgroundColor: '#10171D', borderRadius: 20, borderWidth: 1, borderColor: '#2A3740', padding: 22 }, modalTitle: { color: '#F2F5F1', fontSize: 22, fontWeight: '800', marginBottom: 6 }, modalSubtitle: { color: '#82909A', fontSize: 14, marginBottom: 18 }, dateField: { flex: 1, backgroundColor: '#151D24', borderRadius: 12, borderWidth: 1, borderColor: '#2A3740', minHeight: 52, paddingHorizontal: 15, paddingVertical: 10, justifyContent: 'center' }, dateFieldValue: { color: '#F2F5F1', fontSize: 15, fontWeight: '700' }, exportCount: { color: '#9BE15D', fontSize: 13, fontWeight: '800', textAlign: 'center', marginTop: 16, marginBottom: 12 }, primaryButtonDisabled: { opacity: 0.45 }, modalCancel: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: 4 }, modalCancelText: { color: '#FF6B4A', fontSize: 15, fontWeight: '700' }, historyTabs: { flexDirection: 'row', backgroundColor: '#1B272E', borderRadius: 12, padding: 4, marginBottom: 20 }, historyTab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 9 }, historyTabActive: { backgroundColor: '#2A3740' }, historyTabText: { color: '#AAB7B0', fontSize: 14, fontWeight: '700' }, historyTabTextActive: { color: '#F2F5F1', fontWeight: '800' }, emptyHistory: { color: '#82909A', fontSize: 15, textAlign: 'center', marginTop: 24 }, dropdownContainer: { zIndex: 10, elevation: 10 }, dropdownButton: { backgroundColor: '#151D24', borderRadius: 12, minHeight: 52, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#2A3740' }, dropdownText: { color: '#F2F5F1', fontSize: 16 }, dropdownPlaceholder: { color: '#82909A' }, dropdownArrow: { color: '#9BE15D', fontSize: 12 }, dropdownMenu: { position: 'absolute', top: 58, left: 0, right: 0, backgroundColor: '#151D24', borderRadius: 12, borderWidth: 1, borderColor: '#2A3740', overflow: 'hidden', elevation: 10, shadowColor: '#000000', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, dropdownOption: { paddingHorizontal: 15, paddingVertical: 14 }, dropdownOptionText: { color: '#AAB7B0', fontSize: 15 }, dropdownOptionActive: { color: '#9BE15D', fontWeight: '800' }, recordingCard: { backgroundColor: '#151D24', borderRadius: 16, padding: 18, alignItems: 'center' }, recordingTime: { color: '#F2F5F1', fontSize: 32, fontWeight: '800', letterSpacing: 1 }, recordingStatus: { color: '#AAB7B0', fontSize: 13, marginTop: 4, marginBottom: 16 }, recordingActions: { flexDirection: 'row', gap: 10 }, recordButton: { backgroundColor: '#FF6B4A', borderRadius: 10, minWidth: 110, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, recordButtonDisabled: { opacity: 0.45 }, recordButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' }, stopButton: { backgroundColor: '#DCE7DF', borderRadius: 10, minWidth: 110, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, stopButtonDisabled: { opacity: 0.45 }, stopButtonText: { color: '#0B1014', fontSize: 15, fontWeight: '800' }, sensorCard: { backgroundColor: '#20352B', borderRadius: 16, padding: 18, marginTop: 8 }, sensorTitle: { color: '#9BE15D', fontSize: 16, fontWeight: '800', marginBottom: 8 }, sensorDetail: { color: '#AAB7B0', fontSize: 13, lineHeight: 19, marginBottom: 18 }, sensorGrid: { flexDirection: 'row', gap: 8 }, metric: { flex: 1, backgroundColor: '#151D24', borderRadius: 10, padding: 10 }, metricLabel: { color: '#82909A', fontSize: 11, marginBottom: 5 }, metricValue: { color: '#F2F5F1', fontSize: 14, fontWeight: '800' }, primaryButton: { zIndex: 0, elevation: 0, backgroundColor: '#FF6B4A', borderRadius: 14, minHeight: 56, alignItems: 'center', justifyContent: 'center', marginTop: 28, marginBottom: 20 }, primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});

const lightOverrides = StyleSheet.create({
    safeArea: { backgroundColor: '#F7F5F0' },
    header: { backgroundColor: '#F7F5F0' },
    eyebrow: { color: '#7B817A' },
    title: { color: '#1D2824' },
    avatar: { backgroundColor: '#D5E2D8' },
    hamburgerLine: { backgroundColor: '#315B4C' },
    menuDropdown: { backgroundColor: '#FFFFFF', borderColor: '#E1E4DD', shadowColor: '#1D2824' },
    exerciseList: { backgroundColor: '#FFFFFF', borderColor: '#E1E4DD' },
    durationField: { borderColor: '#B8CDBE', backgroundColor: '#E7EEE9', color: '#1D2824' },
    durationSeparator: { color: '#315B4C' },
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
    sessionDate: { color: '#8A928B' },
    groupChevron: { color: '#315B4C' },
    dialSwipeHint: { color: '#315B4C' },
    dialValue: { color: '#1D2824' },
    dialLabel: { color: '#7B817A' },
    timeDial: { borderColor: '#B8CDBE', backgroundColor: '#E7EEE9' },
    groupHeading: { color: '#315B4C' },
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
    dropdownOptionSelected: { backgroundColor: '#E7EEE9' },
    dropdownOptionSelectedText: { color: '#1D2824' },
    dropdownCheck: { color: '#315B4C' },
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
    modalCard: { backgroundColor: '#FFFFFF', borderColor: '#E1E4DD' },
    modalTitle: { color: '#1D2824' },
    modalSubtitle: { color: '#7B817A' },
    dateField: { backgroundColor: '#FFFFFF', borderColor: '#E1E4DD' },
    dateFieldValue: { color: '#1D2824' },
    exportCount: { color: '#315B4C' },
    modalCancelText: { color: '#D96C4F' },
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