import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatEntryDate, getActivityLabel, getEntryTitle, localeMap, type Copy, type Entry } from './types';

export type ExportFormat = 'csv' | 'pdf';
export type RangePreset = 'all' | 'week' | 'month' | 'year' | 'custom';
export type DateRange = { start: Date; end: Date };

const DAY_MS = 86400000;

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function rangeForPreset(preset: RangePreset, customStart: Date | null, customEnd: Date | null): DateRange | null {
  const now = new Date();
  if (preset === 'all') return { start: new Date(2000, 0, 1), end: endOfDay(now) };
  if (preset === 'week') return { start: startOfDay(new Date(now.getTime() - 6 * DAY_MS)), end: endOfDay(now) };
  if (preset === 'month') return { start: startOfDay(new Date(now.getTime() - 29 * DAY_MS)), end: endOfDay(now) };
  if (preset === 'year') return { start: startOfDay(new Date(now.getTime() - 364 * DAY_MS)), end: endOfDay(now) };
  if (!customStart || !customEnd) return null;
  const start = startOfDay(customStart);
  const end = endOfDay(customEnd);
  return start.getTime() <= end.getTime() ? { start, end } : null;
}

export function filterEntriesByRange(entries: Entry[], range: DateRange): Entry[] {
  return entries
    .filter((entry) => {
      const time = Date.parse(entry.date);
      return time >= range.start.getTime() && time <= range.end.getTime();
    })
    .sort((first, second) => Date.parse(first.date) - Date.parse(second.date));
}

export function formatRangeLabel(range: DateRange, language: keyof typeof localeMap) {
  const options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };
  const formatter = new Intl.DateTimeFormat(localeMap[language], options);
  return `${formatter.format(range.start)} – ${formatter.format(range.end)}`;
}

function escapeCsv(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function buildCsv(entries: Entry[], copy: Copy): string {
  const header = [copy.exportColumnDate, copy.exportColumnType, copy.exportColumnTitle, copy.exportColumnExercise, copy.exportColumnReps, copy.exportColumnWeight, copy.exportColumnDuration, copy.exportColumnHeartRate, copy.exportColumnSteps, copy.exportColumnSpeed, copy.exportColumnCalories];
  const rows: string[][] = [];
  entries.forEach((entry) => {
    const date = formatEntryDate(entry.date, languageFromCopy(copy));
    const type = entry.type === 'strength' ? copy.strength : copy.cardio;
    const title = getEntryTitle(entry, copy);
    if (entry.type === 'strength') {
      entry.strength.exercises.forEach((exercise) => {
        rows.push([date, type, title, exercise.title, String(exercise.repetitions), String(exercise.weight), '', '', '', '', '']);
      });
    } else {
      const metrics = entry.cardio.metrics;
      const minutes = (entry.cardio.durationSeconds / 60).toFixed(1);
      rows.push([date, type, title, getActivityLabel(entry.cardio.activity, copy), '', '', minutes, metrics.heartRate != null ? String(metrics.heartRate) : '', metrics.steps != null ? String(metrics.steps) : '', metrics.speedKmh != null ? String(metrics.speedKmh) : '', metrics.calories != null ? String(metrics.calories) : '']);
    }
  });
  return [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function buildPdfHtml(entries: Entry[], copy: Copy, rangeLabel: string): string {
  const rows = entries.map((entry) => {
    const date = escapeHtml(formatEntryDate(entry.date, languageFromCopy(copy)));
    const title = escapeHtml(getEntryTitle(entry, copy));
    const details = escapeHtml(entry.items.join(' · '));
    return `<tr><td>${date}</td><td>${title}</td><td>${details}</td></tr>`;
  }).join('\n');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Helvetica, Arial, sans-serif; color: #1D2824; padding: 24px; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  p.range { font-size: 12px; color: #59645E; margin-top: 0; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; background: #F2F5F1; padding: 6px 8px; border-bottom: 2px solid #315B4C; }
  td { padding: 6px 8px; border-bottom: 1px solid #E1E4DD; vertical-align: top; }
</style>
</head>
<body>
  <h1>${escapeHtml(copy.exportTitle)}</h1>
  <p class="range">${escapeHtml(rangeLabel)}</p>
  <table>
    <thead><tr><th>${escapeHtml(copy.dateHeader)}</th><th>${escapeHtml(copy.titleHeader)}</th><th>${escapeHtml(copy.detailsHeader)}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

// languageFromCopy is duplicated here to keep this module independent of App.tsx.
function languageFromCopy(copy: Copy): keyof typeof localeMap {
  const byLanguage: Record<string, keyof typeof localeMap> = { 'English (UK)': 'en', Deutsch: 'de', Français: 'fr', Italiano: 'it', Español: 'es' };
  return byLanguage[copy.language] || 'en';
}

export async function shareExport(format: ExportFormat, entries: Entry[], copy: Copy, rangeLabel: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('unavailable');
  }
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === 'csv') {
    const csv = `﻿${buildCsv(entries, copy)}`;
    const uri = `${FileSystem.cacheDirectory}training-export-${stamp}.csv`;
    await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: copy.exportData, UTI: 'public.comma-separated-values-text' });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html: buildPdfHtml(entries, copy, rangeLabel) });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: copy.exportData, UTI: 'com.adobe.pdf' });
}
