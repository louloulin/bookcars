import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    ADDRESS: 'Adresse',
    BUSINESS_HOURS: 'Horaires d\'ouverture',
    PICK_POINT: 'Cliquer sur la carte pour placer le point de prise en charge',
    SEARCH_ADDRESS: 'Rechercher une adresse ou un lieu',
    SEARCH: 'Rechercher',
    MAP_NOT_CONFIGURED: 'La carte n\'est pas configurée. Saisissez les coordonnées manuellement.',
    NO_RESULT: 'Aucun résultat',
  },
  en: {
    ADDRESS: 'Address',
    BUSINESS_HOURS: 'Opening hours',
    PICK_POINT: 'Click on the map to place the pick-up point',
    SEARCH_ADDRESS: 'Search for an address or a place',
    SEARCH: 'Search',
    MAP_NOT_CONFIGURED: 'The map is not configured, enter the coordinates manually.',
    NO_RESULT: 'No result',
  },
  es: {
    ADDRESS: 'Dirección',
    BUSINESS_HOURS: 'Horario de apertura',
    PICK_POINT: 'Haga clic en el mapa para colocar el punto de recogida',
    SEARCH_ADDRESS: 'Buscar una dirección o un lugar',
    SEARCH: 'Buscar',
    MAP_NOT_CONFIGURED: 'El mapa no está configurado, introduzca las coordenadas manualmente.',
    NO_RESULT: 'Sin resultado',
  },
  de: {
    ADDRESS: 'Adresse',
    BUSINESS_HOURS: 'Öffnungszeiten',
    PICK_POINT: 'Klicken Sie auf die Karte, um den Abholpunkt zu setzen',
    SEARCH_ADDRESS: 'Adresse oder Ort suchen',
    SEARCH: 'Suchen',
    MAP_NOT_CONFIGURED: 'Die Karte ist nicht konfiguriert, geben Sie die Koordinaten manuell ein.',
    NO_RESULT: 'Kein Ergebnis',
  },
  pt: {
    ADDRESS: 'Endereço',
    BUSINESS_HOURS: 'Horário de funcionamento',
    PICK_POINT: 'Clique no mapa para posicionar o ponto de levantamento',
    SEARCH_ADDRESS: 'Procurar um endereço ou local',
    SEARCH: 'Procurar',
    MAP_NOT_CONFIGURED: 'O mapa não está configurado, introduza as coordenadas manualmente.',
    NO_RESULT: 'Sem resultado',
  },
  it: {
    ADDRESS: 'Indirizzo',
    BUSINESS_HOURS: 'Orari di apertura',
    PICK_POINT: 'Fai clic sulla mappa per posizionare il punto di ritiro',
    SEARCH_ADDRESS: 'Cerca un indirizzo o un luogo',
    SEARCH: 'Cerca',
    MAP_NOT_CONFIGURED: 'La mappa non è configurata, inserisci le coordinate manualmente.',
    NO_RESULT: 'Nessun risultato',
  },
  zh: {
    ADDRESS: '地址',
    BUSINESS_HOURS: '营业时间',
    PICK_POINT: '点击地图放置取车点',
    SEARCH_ADDRESS: '搜索地址或地点',
    SEARCH: '搜索',
    MAP_NOT_CONFIGURED: '地图未配置，请手动填写坐标。',
    NO_RESULT: '未找到结果',
  },
  ja: {
    ADDRESS: '住所',
    BUSINESS_HOURS: '営業時間',
    PICK_POINT: '地図をクリックして受取場所を設定',
    SEARCH_ADDRESS: '住所や地名で検索',
    SEARCH: '検索',
    MAP_NOT_CONFIGURED: '地図が設定されていません。座標を手動で入力してください。',
    NO_RESULT: '結果なし',
  },
})

langHelper.setLanguage(strings)
export { strings }
