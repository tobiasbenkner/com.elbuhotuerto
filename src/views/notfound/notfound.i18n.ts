import type { FlattenTranslation } from "../../lib/i18n";

export const translations = {
  navigationLabel: {
    es: "Página no encontrada",
    "es-ar": "Página no encontrada",
    en: "Page not found",
    de: "Seite nicht gefunden",
  },
  seo: {
    title: {
      es: "Página no encontrada | El Búho Tuerto",
      "es-ar": "Página no encontrada | El Búho Tuerto",
      en: "Page not found | El Búho Tuerto",
      de: "Seite nicht gefunden | El Búho Tuerto",
    },
    description: {
      es: "La página que buscas no existe o ha cambiado de dirección.",
      "es-ar": "La página que buscás no existe o cambió de dirección.",
      en: "The page you are looking for does not exist or has moved.",
      de: "Die gesuchte Seite gibt es nicht oder sie ist umgezogen.",
    },
  },
  title: {
    es: "Página no encontrada",
    "es-ar": "Página no encontrada",
    en: "Page not found",
    de: "Seite nicht gefunden",
  },
  subtitle: {
    es: "Error 404",
    "es-ar": "Error 404",
    en: "Error 404",
    de: "Fehler 404",
  },
  text: {
    es: "La página que buscas no existe o ha cambiado de dirección. Pero la parrilla sigue encendida.",
    "es-ar":
      "La página que buscás no existe o cambió de dirección. Pero la parrilla sigue encendida.",
    en: "The page you are looking for does not exist or has moved. The grill is still on, though.",
    de: "Die gesuchte Seite gibt es nicht oder sie ist umgezogen. Der Grill brennt aber weiter.",
  },
  home_cta: {
    es: "Ir al inicio",
    "es-ar": "Ir al inicio",
    en: "Go to homepage",
    de: "Zur Startseite",
  },
  menu_cta: {
    es: "Ver la carta",
    "es-ar": "Ver la carta",
    en: "See the menu",
    de: "Zur Speisekarte",
  },
};

export type NotfoundTranslations = FlattenTranslation<typeof translations>;
