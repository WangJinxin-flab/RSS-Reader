import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import zh from './locales/zh.json'
import en from './locales/en.json'
import ar from './locales/ar.json'
import fr from './locales/fr.json'
import ru from './locales/ru.json'
import es from './locales/es.json'

// Get persisted language from localStorage (settingsStore uses 'settings-storage' key)
const getPersistedLanguage = (): string => {
  try {
    const raw = localStorage.getItem('settings-storage')
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed?.state?.language || 'zh'
    }
  } catch {
    // ignore
  }
  return 'zh'
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
      ar: { translation: ar },
      fr: { translation: fr },
      ru: { translation: ru },
      es: { translation: es },
    },
    lng: getPersistedLanguage(),
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
