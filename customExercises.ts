import type { Language } from './motivationalMessages';
import { exerciseGroups, type ExerciseGroup } from './exerciseGroups';

export type CustomExercise = { categoryKey: string; translations: Record<Language, string> };

const LIBRE_TRANSLATE_URL = 'https://libretranslate.com/translate';
const LANGUAGES: Language[] = ['en', 'de', 'fr', 'it', 'es'];

async function translateText(text: string, source: Language, target: Language): Promise<string> {
  const response = await fetch(LIBRE_TRANSLATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source, target, format: 'text' }),
  });
  if (!response.ok) throw new Error(`Translation failed with status ${response.status}`);
  const data = await response.json();
  if (typeof data.translatedText !== 'string') throw new Error('Unexpected translation response');
  return data.translatedText;
}

// Falls back to the original text for any language whose translation call fails.
export async function translateToAllLanguages(text: string, fromLanguage: Language): Promise<{ translations: Record<Language, string>; hadFailure: boolean }> {
  const translations = { [fromLanguage]: text } as Record<Language, string>;
  let hadFailure = false;
  await Promise.all(LANGUAGES.filter((language) => language !== fromLanguage).map(async (language) => {
    try {
      translations[language] = await translateText(text, fromLanguage, language);
    } catch {
      translations[language] = text;
      hadFailure = true;
    }
  }));
  return { translations, hadFailure };
}

export function mergeExerciseGroups(customExercises: CustomExercise[]): ExerciseGroup[] {
  return exerciseGroups.map((group) => {
    const additions = customExercises.filter((custom) => custom.categoryKey === group.categories.en);
    if (additions.length === 0) return group;
    return {
      categories: group.categories,
      exercises: LANGUAGES.reduce((acc, language) => {
        acc[language] = [...group.exercises[language], ...additions.map((custom) => custom.translations[language])];
        return acc;
      }, {} as Record<Language, string[]>),
    };
  });
}
