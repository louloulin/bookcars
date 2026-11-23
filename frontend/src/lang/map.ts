import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    SELECT_PICK_UP_LOCATION: 'Choisir ce lieu',
    SELECT_DROP_OFF_LOCATION: 'Choisir comme lieu de restitution',
    MAP_UNAVAILABLE: 'La carte est temporairement indisponible.',
    ADDRESS: 'Adresse',
    BUSINESS_HOURS: 'Horaires d\'ouverture',
    DISTANCE: 'Distance',
  },
  en: {
    SELECT_PICK_UP_LOCATION: 'Select Location',
    SELECT_DROP_OFF_LOCATION: 'Set as Drop-off Location',
    MAP_UNAVAILABLE: 'The map is temporarily unavailable.',
    ADDRESS: 'Address',
    BUSINESS_HOURS: 'Opening hours',
    DISTANCE: 'Distance',
  },
  es: {
    SELECT_PICK_UP_LOCATION: 'Seleccionar ubicación',
    SELECT_DROP_OFF_LOCATION: 'Establecer como ubicación de entrega',
    MAP_UNAVAILABLE: 'El mapa no está disponible temporalmente.',
    ADDRESS: 'Dirección',
    BUSINESS_HOURS: 'Horario de apertura',
    DISTANCE: 'Distancia',
  },
  de: {
    SELECT_PICK_UP_LOCATION: 'Standort auswählen',
    SELECT_DROP_OFF_LOCATION: 'Als Rückgabeort festlegen',
    MAP_UNAVAILABLE: 'Die Karte ist vorübergehend nicht verfügbar.',
    ADDRESS: 'Adresse',
    BUSINESS_HOURS: 'Öffnungszeiten',
    DISTANCE: 'Entfernung',
  },
  pt: {
    SELECT_PICK_UP_LOCATION: 'Selecionar local',
    SELECT_DROP_OFF_LOCATION: 'Definir como local de devolução',
    MAP_UNAVAILABLE: 'O mapa está temporariamente indisponível.',
    ADDRESS: 'Endereço',
    BUSINESS_HOURS: 'Horário de funcionamento',
    DISTANCE: 'Distância',
  },
  it: {
    SELECT_PICK_UP_LOCATION: 'Seleziona sede',
    SELECT_DROP_OFF_LOCATION: 'Imposta come sede di riconsegna',
    MAP_UNAVAILABLE: 'La mappa è temporaneamente non disponibile.',
    ADDRESS: 'Indirizzo',
    BUSINESS_HOURS: 'Orari di apertura',
    DISTANCE: 'Distanza',
  },
  zh: {
    SELECT_PICK_UP_LOCATION: '选择地点',
    SELECT_DROP_OFF_LOCATION: '设为还车地点',
    MAP_UNAVAILABLE: '地图暂时无法加载。',
    ADDRESS: '地址',
    BUSINESS_HOURS: '营业时间',
    DISTANCE: '距离',
  },
  ja: {
    SELECT_PICK_UP_LOCATION: '場所を選択',
    SELECT_DROP_OFF_LOCATION: '返却場所として設定',
    MAP_UNAVAILABLE: '地図は一時的に利用できません。',
    ADDRESS: '住所',
    BUSINESS_HOURS: '営業時間',
    DISTANCE: '距離',
  },
})

langHelper.setLanguage(strings)
export { strings }
