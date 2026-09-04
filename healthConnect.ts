import { Platform, Linking } from 'react-native';

export type LiveHealthMetrics = { heartRate?: number; steps?: number; speedKmh?: number; calories?: number };

// react-native-health-connect is Android-only and requires a custom dev client (not Expo Go).
type HealthConnectModule = typeof import('react-native-health-connect');

let cachedModule: HealthConnectModule | null | undefined;

function getModule(): HealthConnectModule | null {
  if (Platform.OS !== 'android') return null;
  if (cachedModule === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      cachedModule = require('react-native-health-connect') as HealthConnectModule;
    } catch {
      cachedModule = null;
    }
  }
  return cachedModule;
}

export async function isHealthConnectAvailable(): Promise<boolean> {
  const module = getModule();
  if (!module) return false;
  try {
    const status = await module.getSdkStatus();
    return status === module.SdkAvailabilityStatus.SDK_AVAILABLE;
  } catch {
    return false;
  }
}

export async function requestHealthPermissions(): Promise<boolean> {
  const module = getModule();
  if (!module) return false;
  try {
    await module.initialize();
    const granted = await module.requestPermission([
      { accessType: 'read', recordType: 'HeartRate' },
      { accessType: 'read', recordType: 'Steps' },
      { accessType: 'read', recordType: 'Distance' },
      { accessType: 'read', recordType: 'TotalCaloriesBurned' },
    ]);
    return granted.length > 0;
  } catch {
    return false;
  }
}

// Health Connect has no streaming API, so "live" data is only as fresh as the watch's last sync into it.
export async function pollLiveMetrics(sinceDate: Date): Promise<LiveHealthMetrics> {
  const module = getModule();
  if (!module) return {};
  const timeRangeFilter = { operator: 'between' as const, startTime: sinceDate.toISOString(), endTime: new Date().toISOString() };
  try {
    const [heartRateResult, stepsResult, distanceResult, caloriesResult] = await Promise.all([
      module.readRecords('HeartRate', { timeRangeFilter }),
      module.readRecords('Steps', { timeRangeFilter }),
      module.readRecords('Distance', { timeRangeFilter }),
      module.readRecords('TotalCaloriesBurned', { timeRangeFilter }),
    ]);

    const heartRateSamples = heartRateResult.records.flatMap((record) => record.samples || []);
    const latestHeartRate = heartRateSamples.length > 0 ? Math.round(heartRateSamples[heartRateSamples.length - 1].beatsPerMinute) : undefined;

    const totalSteps = stepsResult.records.reduce((sum, record) => sum + (record.count || 0), 0);

    const totalDistanceMeters = distanceResult.records.reduce((sum, record) => sum + (record.distance?.inMeters || 0), 0);
    const elapsedHours = Math.max((Date.now() - sinceDate.getTime()) / 3600000, 1 / 3600);
    const speedKmh = totalDistanceMeters > 0 ? (totalDistanceMeters / 1000) / elapsedHours : undefined;

    const totalCalories = caloriesResult.records.reduce((sum, record) => sum + (record.energy?.inKilocalories || 0), 0);

    return {
      heartRate: latestHeartRate,
      steps: totalSteps > 0 ? totalSteps : undefined,
      speedKmh: speedKmh ? Math.round(speedKmh * 10) / 10 : undefined,
      calories: totalCalories > 0 ? Math.round(totalCalories) : undefined,
    };
  } catch {
    return {};
  }
}

export function openHealthConnectInstallPage() {
  Linking.openURL('market://details?id=com.google.android.apps.healthdata').catch(() =>
    Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata')
  );
}
