/* =====================================================================
   IDIOMA · HIZKUNTZA
   Si en Ajustes se elige euskera, este archivo traduce lo que sale en pantalla
   cambiando cada texto por su versión en euskera (diccionario EU) en cuanto aparece.
   Los nombres propios (pueblos, ríos, embalses, especies) se dejan como están.
   ===================================================================== */
(function () {
  let L = 'es';
  try { L = localStorage.getItem('lang') || 'es'; } catch (e) {}
  window.LANG = L;
  window.LOC = 'es-ES';   // números y fechas con formato español; los nombres de meses y días se traducen abajo
  document.documentElement.lang = L;

  // ---------- diccionario: texto en castellano → texto en euskera ----------
  const EU = {
    // menú y títulos
    'Inicio · Navarra': 'Hasiera · Nafarroa', 'Datos': 'Datuak', 'Tiempo': 'Eguraldia', 'Naturaleza': 'Natura', 'Tierra': 'Lurra',
    'App': 'Aplikazioa', 'Actualizar': 'Eguneratu', 'Caudal de los ríos': 'Ibaien emaria', 'Datos históricos': 'Datu historikoak',
    'Mapa de riadas (elige caudal)': 'Uholde-mapa (aukeratu emaria)', 'Mapa de riadas': 'Uholde-mapa', 'Previsiones': 'Iragarpenak',
    'Simulador de los próximos días': 'Hurrengo egunetako simulagailua', 'El tiempo': 'Eguraldia', 'Histórico del clima': 'Klimaren historikoa',
    'Salir al monte: rutas, cuevas, baño…': 'Mendira irten: ibilbideak, kobazuloak, bainua…', 'Salir al monte': 'Mendira irten',
    'Pesca: tramos y normas': 'Arrantza: tarteak eta arauak', 'Caza: calendario de la temporada': 'Ehiza: denboraldiko egutegia',
    'Setas, frutos, fauna y vegetación': 'Perretxikoak, fruituak, fauna eta landaredia', 'Terremotos, fallas y placas': 'Lurrikarak, failak eta plakak',
    'Terremotos y fallas': 'Lurrikarak eta failak', 'Ajustes y avisos': 'Ezarpenak eta abisuak', 'Acerca de': 'Honi buruz',
    'Actualizar datos ahora': 'Eguneratu datuak orain', 'Buscar nueva versión de la app': 'Bilatu aplikazioaren bertsio berria',
    'Zona técnica': 'Eremu teknikoa', 'Mapa del Arga (ahora)': 'Argaren mapa (orain)', 'Modo científico': 'Modu zientifikoa',
    'Conexión SAIH Ebro': 'SAIH Ebro konexioa', 'Información técnica': 'Informazio teknikoa', 'Cambiar PIN': 'Aldatu PINa',
    'Salir de la zona técnica': 'Irten eremu teknikotik', 'Pesca en Navarra': 'Arrantza Nafarroan', 'Caza en Navarra': 'Ehiza Nafarroan',
    'Naturaleza de Navarra': 'Nafarroako natura', 'Esquema (juego)': 'Eskema (jokoa)', 'Río entero': 'Ibai osoa',
    // avisos generales
    '⚠️ ANTE EL RIESGO, HAZ CASO SIEMPRE A LOS AVISOS OFICIALES.': '⚠️ ARRISKUA DAGOENEAN, EGIN KASU BETI ABISU OFIZIALEI.',
    'Los datos de esta app pueden variar respecto a los de la fuente original.': 'Aplikazio honetako datuak jatorrizko iturrikoen desberdinak izan daitezke.',
    'Los datos de esta app pueden variar respecto a los de la fuente original. (CHE, SOS Navarra 112)': 'Aplikazio honetako datuak jatorrizko iturrikoen desberdinak izan daitezke. (CHE, SOS Navarra 112)',
    'Los datos de esta app pueden variar respecto a los de la fuente original. (CHE, SOS Navarra 112, Ayuntamiento).': 'Aplikazio honetako datuak jatorrizko iturrikoen desberdinak izan daitezke. (CHE, SOS Navarra 112, Udala).',
    'Los datos de esta app pueden variar respecto a los de la fuente original. El simulador es un modelo sencillo. Avisos oficiales: CHE, SOS Navarra 112, AEMET y tu Ayuntamiento.': 'Aplikazio honetako datuak jatorrizko iturrikoen desberdinak izan daitezke. Simulagailua eredu sinplea da. Abisu ofizialak: CHE, SOS Navarra 112, AEMET eta zure udala.',
    'Importante': 'Garrantzitsua', 'Antes de salir': 'Irten aurretik',
    'Mira el tiempo y los avisos, lleva agua y ropa de abrigo, avisa de tu ruta y no salgas de los caminos señalizados. Respeta las propiedades, el ganado y las normas de los espacios protegidos. En caso de emergencia, llama al 112. Datos: Gobierno de Navarra · IDENA (CC BY 4.0).': 'Begiratu eguraldia eta abisuak, eraman ura eta arropa beroa, esan nora zoazen eta ez irten bide seinaleztatuetatik. Errespetatu jabetzak, abereak eta babestutako guneetako arauak. Larrialdietan, deitu 112ra. Datuak: Nafarroako Gobernua · IDENA (CC BY 4.0).',
    'Una app para seguir el río Arga y el tiempo en Navarra: caudales en directo, el embalse de Eugui, previsión de lluvia y un simulador de riadas para aprender cómo se comporta el río.': 'Arga ibaia eta Nafarroako eguraldia jarraitzeko aplikazioa: emariak zuzenean, Eugiko urtegia, euri-iragarpena eta uholde-simulagailu bat ibaiak nola jokatzen duen ikasteko.',
    // riadas y río
    'Caudal elegido (Burlada/Pamplona)': 'Aukeratutako emaria (Burlata/Iruña)', 'Caudal previsto (Burlada/Pamplona)': 'Aurreikusitako emaria (Burlata/Iruña)',
    'Normal': 'Normala', 'normal': 'normala', 'Alerta típica': 'Ohiko alerta', 'Reproducir riada 2021': 'Erreproduzitu 2021eko uholdea',
    'Reproducir la riada': 'Erreproduzitu uholdea', 'Cuadrícula': 'Lauki-sareta', 'Ver plano': 'Ikusi planoa', 'Zonas afectadas': 'Kaltetutako guneak',
    'Qué es esto': 'Zer da hau', 'estimaciones': 'kalkulu hurbilduak', 'Hora': 'Ordua', 'Caudal': 'Emaria', 'Nivel': 'Maila',
    'Lluvia en la cuenca': 'Euria arroan', 'mm en 24 h': 'mm 24 orduan', 'Suelo': 'Lurzorua', 'húmedo': 'hezea',
    'Nieve fundiéndose en el Pirineo': 'Elurra urtzen Pirinioetan', 'Embalse de Eugui laminando': 'Eugiko urtegia uholdea arintzen',
    'Empezar temporal': 'Hasi ekaitza', '¡Dar aviso! Retirar coches': 'Abisua eman! Kendu autoak', 'Reiniciar': 'Berrabiarazi',
    'Cómo se juega': 'Nola jokatzen da', 'Qué hay debajo': 'Zer dago azpian', 'Usar terreno de ejemplo': 'Erabili adibideko lurra',
    'Cargar MDT (.asc)': 'Kargatu MDT (.asc)', 'Caudal Q': 'Emaria Q', 'Umbral de cauce (celdas que drenan)': 'Ibilguaren atalasea (drainatzen duten gelaxkak)',
    'Ancho del cauce B': 'Ibilguaren zabalera B', 'Rugosidad Manning n': 'Manning zimurtasuna n', 'Pendiente S': 'Malda S', 'Caudal base': 'Oinarrizko emaria',
    'Superficie inundada': 'Urpean dagoen azalera', 'Profundidad máxima fuera del cauce': 'Ibilgutik kanpoko sakonera handiena', 'Punto tocado': 'Ukitutako puntua',
    'toca el mapa': 'ukitu mapa', 'Datos reales': 'Benetako datuak', 'Abrir el mapa de riadas': 'Ireki uholde-mapa', 'Ver en el mapa': 'Ikusi mapan',
    'Emergencia 01': 'Larrialdia 01', 'Emergencia 02': 'Larrialdia 02', 'Emergencia 1': 'Larrialdia 1', 'Alerta': 'Alerta',
    'menos de 150 m³/s': '150 m³/s baino gutxiago', 'más de 350': '350 baino gehiago', 'Caudal ahora en Pamplona': 'Emaria orain Iruñean',
    '¿Y si lloviera más?': 'Eta euri gehiago egingo balu?', 'Ver la previsión en el mapa': 'Ikusi iragarpena mapan',
    'Fases de alerta del Ayuntamiento de Pamplona': 'Iruñeko Udalaren alerta-faseak', 'Río Arga (de arriba abajo)': 'Arga ibaia (goitik behera)',
    'Toca una estación para ver su gráfica de las últimas horas.': 'Ukitu estazio bat azken orduetako grafikoa ikusteko.',
    'últimas horas (SAIH Ebro)': 'azken orduak (SAIH Ebro)', 'Sin datos del embalse ahora.': 'Ez dago urtegiaren daturik orain.',
    'El Ebro en Navarra': 'Ebro Nafarroan', 'Afluentes': 'Ibaiadarrak', 'Ríos': 'Ibaiak', 'Arga': 'Arga',
    'Llueve… vigila el caudal y decide cuándo avisar.': 'Euria ari du… zaindu emaria eta erabaki noiz abisatu.',
    'Ajusta la lluvia y pulsa “Empezar temporal”.': 'Doitu euria eta sakatu “Hasi ekaitza”.',
    '¡El agua ha llegado al aparcamiento sin aviso!': 'Ura aparkalekura iritsi da abisurik gabe!', 'Aviso dado a las': 'Abisua ordu honetan emana:',
    'h: coches retirados.': 'h: autoak kenduta.', 'Calado en cauce (Manning) sobre el nivel base': 'Ibilguko sakonera (Manning) oinarrizko mailaren gainetik',
    'Previsión con la lluvia de los próximos 3 días': 'Iragarpena hurrengo 3 egunetako euriarekin', 'Previsión desde el caudal real': 'Iragarpena benetako emaritik abiatuta',
    'Ver en el mapa con el caudal real': 'Ikusi mapan benetako emariarekin', 'Todavía no hay datos de previsión.': 'Oraindik ez dago iragarpen-daturik.',
    'Todavía no hay previsión cargada.': 'Oraindik ez da iragarpenik kargatu.', 'Descargando la previsión de Open‑Meteo…': 'Open‑Meteoren iragarpena deskargatzen…',
    'La previsión no está disponible en esta vista.': 'Iragarpena ez dago erabilgarri ikuspegi honetan.',
    'No se puede leer la previsión ahora mismo (prueba más tarde).': 'Ezin da iragarpena irakurri oraintxe (saiatu geroago).',
    'Respuesta rara de Open‑Meteo.': 'Open‑Meteoren erantzun arraroa.', 'Medidos en Burlada. En Huarte el Arga llegó a 177 m³/s y 3,38 m de altura, con daños.': 'Burlatan neurtuak. Uharten Arga 177 m³/s-ra eta 3,38 m-ko altuerara iritsi zen, kalteekin.',
    'Elige tú el caudal, o el de una riada antigua, y mira hasta dónde llegaría el agua.': 'Aukeratu zuk emaria, edo uholde zahar batena, eta begiratu ura noraino iritsiko litzatekeen.',
    'Alerta máxima: se pidió retirar coches de los Corralillos, Club Natación, Rochapea, San Jorge, Aranzadi y Txantrea.': 'Alerta gorena: autoak kentzeko eskatu zen Corralillos, Club Natación, Arrotxapea, Donibane, Aranzadi eta Txantreatik.',
    'Mitad del caudal de diciembre. Desbordamientos leves en Villava, la Magdalena, Club Natación y zonas verdes de la Rochapea.': 'Abenduko emariaren erdia. Gainezka txikiak Atarrabian, Magdalenan, Club Natación-en eta Arrotxapeako berdeguneetan.',
    'Construido entre 1968 y 1973 · cuenca de 69 km² · 21,4 hm³ · abastece a la Comarca de Pamplona y también lamina avenidas.': '1968 eta 1973 artean eraikia · 69 km²-ko arroa · 21,4 hm³ · Iruñerria hornitzen du eta uholdeak ere arintzen ditu.',
    'En la comarca de Pamplona la mancha de agua se calcula con las alturas reales del terreno': 'Iruñerrian ur-orbana lurraren benetako altuerekin kalkulatzen da',
    'En Puente la Reina no hay estación del SAIH: las más cercanas son Etxauri (aguas arriba) y Funes (al final).': 'Gares-en ez dago SAIH estaziorik: hurbilenak Etxauri (ibaian gora) eta Funes (amaieran) dira.',
    'Diciembre 2021 · 608 m³/s': '2021eko abendua · 608 m³/s', 'Junio 2013 · 492 m³/s': '2013ko ekaina · 492 m³/s',
    'Enero 2022 · ~300 m³/s': '2022ko urtarrila · ~300 m³/s', 'Febrero 2024 · previsión ~400 m³/s': '2024ko otsaila · iragarpena ~400 m³/s',
    'Dic. 2021 (608)': '2021 abe. (608)', 'Feb. 2024': '2024 ots.',
    // tiempo
    'Ahora': 'Orain', 'hoy': 'gaur', 'Hoy': 'Gaur', 'Mañana': 'Bihar', 'Humedad': 'Hezetasuna', 'Sensación': 'Sentsazioa', 'Viento': 'Haizea',
    'Viento (rachas)': 'Haizea (bolada)', 'Máx / mín hoy': 'Gaurko max. / min.', 'Próximas 24 horas': 'Hurrengo 24 orduak', 'Próximos 7 días': 'Hurrengo 7 egunak',
    'Prevista resto del día': 'Egunaren gainerakorako aurreikusia', 'Lluvia hoy (caída)': 'Gaurko euria (erorita)', 'Lluvia total': 'Euria guztira',
    'Lluvia': 'Euria', 'Mínima': 'Minimoa', 'Máxima': 'Maximoa', 'Claro': 'Argia', 'Oscuro': 'Iluna', 'Sol': 'Eguzkia', 'Aspecto': 'Itxura',
    'Calidad del aire': 'Airearen kalitatea', 'Aire, polen, UV, sol y luna': 'Airea, polena, UV, eguzkia eta ilargia', 'índice europeo': 'Europako indizea',
    'Índice UV máx. hoy': 'UV indize max. gaur', 'salida – puesta': 'irteera – sartzea', 'Avisos de AEMET en Navarra': 'AEMETen abisuak Nafarroan',
    'Sin avisos meteorológicos activos en Navarra.': 'Ez dago eguraldi-abisu aktiborik Nafarroan.', 'amarillo': 'horia', 'naranja': 'laranja',
    'aviso de alerta': 'alerta-abisua', 'aviso de peligro': 'arrisku-abisua', 'Temperatura media': 'Batez besteko tenperatura',
    'Temp. media del año pasado': 'Iazko batez besteko tenp.', 'Lluvia, mismo periodo del año pasado': 'Euria, iazko aldi berean', 'días de lluvia': 'euri-egun',
    'Barras: lluvia · líneas: máxima y mínima': 'Barrak: euria · lerroak: maximoa eta minimoa', 'Línea: temperatura · barras: lluvia (mm por hora)': 'Lerroa: tenperatura · barrak: euria (mm orduko)',
    'Día a día': 'Egunez egun', 'Mes a mes': 'Hilabetez hilabete', 'Este año': 'Aurten', '12 meses': '12 hilabete', 'Semana': 'Astea', 'Mes': 'Hilabetea',
    'semana': 'astea', 'mes': 'hilabetea', 'año': 'urtea', 'Hoy ▾': 'Gaur ▾',
    'Fuente: Open‑Meteo (modelos de AEMET, ECMWF y otros), se actualiza al abrir esta pantalla.': 'Iturria: Open‑Meteo (AEMET, ECMWF eta beste eredu batzuk); pantaila hau irekitzean eguneratzen da.',
    'Fuentes: Meteoalarm/AEMET (avisos) y Open‑Meteo / Copernicus CAMS (aire y polen).': 'Iturriak: Meteoalarm/AEMET (abisuak) eta Open‑Meteo / Copernicus CAMS (airea eta polena).',
    'Datos de Open‑Meteo (reanálisis ERA5 y modelos), no de una estación concreta: sirven para comparar, pero pueden diferir unos grados o milímetros de lo medido en el pueblo.': 'Open‑Meteoren datuak (ERA5 berranalisia eta ereduak), ez estazio jakin batenak: alderatzeko balio dute, baina herrian neurtutakotik gradu edo milimetro batzuk alda daitezke.',
    'Mapa base: © Instituto Geográfico Nacional · Tiempo: Open‑Meteo · Ríos: SAIH Ebro.': 'Oinarri-mapa: © Instituto Geográfico Nacional · Eguraldia: Open‑Meteo · Ibaiak: SAIH Ebro.',
    'No se pudo cargar el tiempo ahora.': 'Ezin izan da eguraldia kargatu orain.', 'No se pudo cargar el tiempo ahora. Prueba en un rato.': 'Ezin izan da eguraldia kargatu orain. Saiatu pixka bat barru.',
    'No se pudo cargar el histórico ahora.': 'Ezin izan da historikoa kargatu orain.', 'No se pudo leer la calidad del aire ahora.': 'Ezin izan da airearen kalitatea irakurri orain.',
    'No se pudieron leer los avisos ahora. Consulta aemet.es → Avisos.': 'Ezin izan dira abisuak irakurri orain. Begiratu aemet.es → Avisos.',
    'Cargando el tiempo previsto aquí…': 'Hemengo eguraldi-iragarpena kargatzen…', 'Tiempo aquí': 'Eguraldia hemen', 'sin datos ahora': 'daturik ez orain',
    'Mapa base no disponible ahora': 'Oinarri-mapa ez dago erabilgarri orain', 'Cargando mapa base…': 'Oinarri-mapa kargatzen…',
    // estados generales
    'Cargando…': 'Kargatzen…', 'Calculando…': 'Kalkulatzen…', 'Actualizando datos…': 'Datuak eguneratzen…', 'Buscando actualizaciones…': 'Eguneraketak bilatzen…',
    'Ya tienes la última versión': 'Azken bertsioa duzu jada', 'Caudales, previsión y tiempo actualizados': 'Emariak, iragarpena eta eguraldia eguneratuta',
    'Datos al día (la previsión se renueva sola cada 3 horas)': 'Datuak egunean (iragarpena bakarrik berritzen da 3 orduro)', 'En directo': 'Zuzenean',
    'Actualizado a las': 'Eguneratua ordu honetan:', 'Actualizada': 'Eguneratua', 'Sin resultados.': 'Emaitzarik ez.', 'Cancelar': 'Utzi', 'Entrar': 'Sartu',
    'Compartir datos': 'Partekatu datuak', 'Compartir resultado': 'Partekatu emaitza', 'Leyendo archivo…': 'Fitxategia irakurtzen…',
    'Conectando con el SAIH Ebro…': 'SAIH Ebrorekin konektatzen…', 'Leyendo las fichas de cada estación…': 'Estazio bakoitzaren fitxak irakurtzen…',
    'Datos en tiempo real del SAIH Ebro': 'SAIH Ebroren denbora errealeko datuak', 'No se pudo comprobar ahora (¿sin internet?)': 'Ezin izan da egiaztatu orain (internetik gabe?)',
    'No se pudo leer la gráfica de esta estación.': 'Ezin izan da estazio honen grafikoa irakurri.', 'Consultando el mapa oficial…': 'Mapa ofiziala kontsultatzen…',
    'Nada que mostrar con este filtro.': 'Ez dago ezer erakusteko iragazki honekin.', 'Todas': 'Guztiak', 'Todo': 'Dena', 'Tipo': 'Mota', 'Zona': 'Eremua',
    'Notas': 'Oharrak', 'Datos guardados del': 'Datu gordeak, data:', 'Hay una versión nueva de la app (': 'Aplikazioaren bertsio berria dago (',
    'Pantalla actualizada (': 'Pantaila eguneratuta (', 'Esta sección funciona en la app': 'Atal honek aplikazioan funtzionatzen du', 'Como el móvil': 'Mugikorra bezala',
    // ajustes y acerca de
    'Avisos en el móvil': 'Abisuak mugikorrean', 'Tamaño de letra': 'Letra-tamaina', 'Probar un aviso': 'Probatu abisu bat', 'Probar esta dirección': 'Probatu helbide hau',
    'La app mira el SAIH cada 15 minutos, aunque esté cerrada, y te avisa si el Arga en Burlada': 'Aplikazioak SAIH 15 minuturo begiratzen du, itxita egon arren, eta abisatzen dizu Arga Burlatan',
    'Pasa de': 'Gainditzen du:', 'Sube más de': 'Gehiago igotzen da:', 'en la última hora': 'azken orduan',
    'Disponible con la app actualizada (versión 6 o más).': 'Aplikazio eguneratuarekin erabilgarri (6. bertsioa edo berriagoa).',
    'Repítelo para confirmar': 'Errepikatu berresteko', 'No coinciden. Empieza otra vez': 'Ez datoz bat. Hasi berriro', 'Tienen que ser de 4 a 8 cifras': '4 eta 8 zifra artean izan behar dira',
    'PIN incorrecto': 'PIN okerra', 'PIN guardado · zona técnica abierta': 'PINa gordeta · eremu teknikoa irekita', 'Zona técnica cerrada': 'Eremu teknikoa itxita',
    'Zona técnica abierta (en el menú)': 'Eremu teknikoa irekita (menuan)', '¿Qué es?': 'Zer da?', 'Fuentes de datos': 'Datu-iturriak', 'Creado por': 'Sortzailea',
    'Foto: Puente de la Rabia, Zubiri': 'Argazkia: Arrabioko zubia, Zubiri',
    '• Caudales, niveles y embalses: SAIH Ebro (Confederación Hidrográfica del Ebro).': '• Emariak, mailak eta urtegiak: SAIH Ebro (Ebroko Konfederazio Hidrografikoa).',
    '• Tiempo, previsión e histórico: Open‑Meteo (AEMET, ECMWF, ERA5).': '• Eguraldia, iragarpena eta historikoa: Open‑Meteo (AEMET, ECMWF, ERA5).',
    '• Ortofotos, mapas y modelo del terreno: Instituto Geográfico Nacional (PNOA, MDT25), CNIG.': '• Ortoargazkiak, mapak eta lurraren eredua: Instituto Geográfico Nacional (PNOA, MDT25), CNIG.',
    '• Riadas históricas: CHE, Ayuntamiento de Pamplona y prensa local.': '• Uholde historikoak: CHE, Iruñeko Udala eta tokiko prentsa.',
    '• Avisos meteorológicos: AEMET a través de Meteoalarm (EUMETNET).': '• Eguraldi-abisuak: AEMET, Meteoalarm bidez (EUMETNET).',
    '• Calidad del aire y polen: Copernicus CAMS, vía Open‑Meteo.': '• Airearen kalitatea eta polena: Copernicus CAMS, Open‑Meteo bidez.',
    '• Rutas, pesca, caza, cuevas, fuentes, miradores y patrimonio: Gobierno de Navarra · IDENA (CC BY 4.0).': '• Ibilbideak, arrantza, ehiza, kobazuloak, iturriak, begiratokiak eta ondarea: Nafarroako Gobernua · IDENA (CC BY 4.0).',
    '• Terremotos: EMSC (Centro Sismológico Euromediterráneo), con datos de la Red Sísmica Nacional del IGN.': '• Lurrikarak: EMSC (Euromediterraneoko Zentro Sismologikoa), IGNren Sare Sismiko Nazionalaren datuekin.',
    '• Fallas activas: base de datos QAFI del IGME‑CSIC.': '• Faila aktiboak: IGME‑CSICen QAFI datu-basea.',
    '• Dibujo de los ríos y término de Petilla de Aragón: © colaboradores de OpenStreetMap (ODbL).': '• Ibaien marrazkia eta Petilla de Aragongo udal-mugarteak: © OpenStreetMap-en laguntzaileak (ODbL).',
    '• Licencias: los datos del IGN, IDENA y Open‑Meteo se usan bajo CC BY 4.0; los mapas y capas se muestran sin modificar salvo el cálculo de zonas inundables, que es obra derivada del MDT del IGN. App sin ánimo de lucro.': '• Lizentziak: IGN, IDENA eta Open‑Meteoren datuak CC BY 4.0 lizentziarekin erabiltzen dira; mapak eta geruzak aldatu gabe erakusten dira, uholde-guneen kalkulua izan ezik, IGNren MDTtik eratorritako lana baita. Irabazi-asmorik gabeko aplikazioa.',
    'Toca una ruta (línea) o un punto para ver su ficha, su perfil y el tiempo previsto allí.': 'Ukitu ibilbide bat (lerroa) edo puntu bat haren fitxa, profila eta hango eguraldi-iragarpena ikusteko.',
    'francés': 'frantsesa', 'aragonés': 'aragoiarra', 'Entrada en Navarra': 'Nafarroako sarrera', 'Salida de Navarra': 'Nafarroako irteera',
    'Prueba de conexión con el SAIH Ebro': 'SAIH Ebrorekiko konexio-proba', 'Explorar SAIH 4.0': 'Arakatu SAIH 4.0',
    // monte
    'Buscar ruta, cueva, mirador, pueblo…': 'Bilatu ibilbidea, kobazuloa, begiratokia, herria…', 'Sin capa oficial': 'Geruza ofizialik gabe',
    'Rutas recomendadas': 'Gomendatutako ibilbideak', 'GR (grandes recorridos)': 'GR (ibilbide luzeak)', 'Vías verdes': 'Bide berdeak',
    'Camino de Santiago': 'Done Jakue bidea', 'Cuevas visitables': 'Bisitatzeko kobazuloak', 'Cascadas y nacederos': 'Ur-jauziak eta iturburuak',
    'Miradores': 'Begiratokiak', 'Zonas de baño': 'Bainu-guneak', 'Áreas recreativas': 'Aisialdi-guneak', 'Patrimonio (BIC)': 'Ondarea (KIO)',
    'Todas las cuevas y simas': 'Kobazulo eta leize guztiak', 'Fuentes públicas': 'Iturri publikoak', 'Manantiales': 'Iturburuak',
    'Todos los senderos señalizados (PR, SL)': 'Seinaleztatutako bidezidor guztiak (PR, SL)', 'Probabilidad de incendio': 'Sute-probabilitatea',
    'Incendios 2019‑2023': 'Suteak 2019‑2023', 'Zonas de uso del fuego': 'Sua erabiltzeko guneak', 'Puntos de agua contra incendios': 'Suteen aurkako ur-puntuak',
    'Toca un punto o una ruta para ver su ficha y el tiempo previsto allí.': 'Ukitu puntu edo ibilbide bat haren fitxa eta hango eguraldi-iragarpena ikusteko.',
    'Aquí no hay nada en esta capa (acércate más para consultar).': 'Hemen ez dago ezer geruza honetan (hurbildu gehiago kontsultatzeko).',
    'Aquí no hay nada en esta capa (o acércate más para consultar).': 'Hemen ez dago ezer geruza honetan (edo hurbildu gehiago kontsultatzeko).',
    'Fuente: Gobierno de Navarra · IDENA.': 'Iturria: Nafarroako Gobernua · IDENA.', 'Más información': 'Informazio gehiago', 'Ruta GPX': 'GPX ibilbidea', 'Ficha PDF': 'PDF fitxa',
    'Tramo': 'Tartea', 'Nombre': 'Izena', 'Descripción': 'Deskribapena', 'Altitud (m)': 'Altitudea (m)', 'Municipio': 'Udalerria', 'Paraje': 'Lekua',
    'Longitud (m)': 'Luzera (m)', 'Profundidad (m)': 'Sakonera (m)', 'Salida': 'Irteera', 'Llegada': 'Helmuga', 'Barbacoa': 'Barbakoa', 'Equipamiento': 'Ekipamendua',
    'Aparcamiento': 'Aparkalekua', 'Vegetación': 'Landaredia', 'Paisaje': 'Paisaia', 'Punto': 'Puntua', 'Localidad': 'Herria', 'Agua potable': 'Edateko ura',
    'Cuenca': 'Arroa', 'Código': 'Kodea', 'situación aproximada': 'gutxi gorabeherako kokapena',
    'La mayoría de simas y cuevas no son visitables: entrar sin equipo ni experiencia es muy peligroso.': 'Leize eta kobazulo gehienak ezin dira bisitatu: ekiporik eta esperientziarik gabe sartzea oso arriskutsua da.',
    'Zona de baño con control sanitario del Gobierno de Navarra durante la temporada de baño (verano). Mira la ficha para la calidad del agua.': 'Nafarroako Gobernuaren osasun-kontrola duen bainu-gunea bainu-denboraldian (udan). Begiratu fitxa uraren kalitatea jakiteko.',
    'Perfil de la ruta': 'Ibilbidearen profila', 'Calculando el perfil de la ruta…': 'Ibilbidearen profila kalkulatzen…', 'Distancia': 'Distantzia',
    'Tiempo (MIDE)': 'Denbora (MIDE)', 'Circular': 'Zirkularra', 'Lineal': 'Lineala', 'Subida': 'Igoera', 'Bajada': 'Jaitsiera',
    'Altitud máx.': 'Altitude max.', 'Altitud mín.': 'Altitude min.', 'Pendiente máx.': 'Malda max.', 'altitud': 'altitudea', 'pendiente': 'malda',
    'Fácil': 'Erraza', 'Moderada': 'Ertaina', 'Exigente': 'Zorrotza', 'Muy exigente': 'Oso zorrotza',
    'Desliza el dedo por la gráfica para ver cada punto en el mapa. Colores: 🟢 <8 % · 🟡 8‑15 % · 🟠 15‑25 % · 🔴 >25 %': 'Irristatu hatza grafikoan puntu bakoitza mapan ikusteko. Koloreak: 🟢 <8 % · 🟡 8‑15 % · 🟠 15‑25 % · 🔴 >25 %',
    'Tiempo orientativo sin paradas para una persona en forma. Alturas: del GPX de la ruta. La dificultad solo mira distancia y desnivel, no el terreno.': 'Gutxi gorabeherako denbora, geldialdirik gabe, sasoian dagoen pertsona batentzat. Altuerak: ibilbidearen GPXtik. Zailtasunak distantzia eta desnibela bakarrik hartzen ditu kontuan, ez lurra.',
    'Tiempo orientativo sin paradas para una persona en forma. Alturas: modelo del terreno. La dificultad solo mira distancia y desnivel, no el terreno.': 'Gutxi gorabeherako denbora, geldialdirik gabe, sasoian dagoen pertsona batentzat. Altuerak: lurraren eredua. Zailtasunak distantzia eta desnibela bakarrik hartzen ditu kontuan, ez lurra.',
    'No se pudo bajar el GPX para el perfil ahora. Prueba más tarde o ábrelo con el botón «Ruta GPX».': 'Ezin izan da profilerako GPXa jaitsi orain. Saiatu geroago edo ireki «GPX ibilbidea» botoiarekin.',
    'Este GPX no trae alturas y no se pudieron consultar ahora.': 'GPX honek ez du altuerarik eta ezin izan dira kontsultatu orain.',
    'En los espacios naturales protegidos (Bardenas, Irati, Urbasa-Andía, Señorío de Bertiz, foces…) sigue los caminos señalizados y no arranques plantas.': 'Babestutako natura-guneetan (Bardeak, Irati, Urbasa-Andia, Bertizko Jaurerria, arroilak…) ibili bide seinaleztatuetatik eta ez atera landarerik.',
    // pesca
    'Ir a un río…': 'Joan ibai batera…', 'Todos los tramos': 'Tarte guztiak', 'Hoy se puede pescar': 'Gaur arrantza daiteke', 'Hoy no se puede pescar': 'Gaur ezin da arrantzan egin',
    'Pesca libre (captura y suelta)': 'Arrantza librea (harrapatu eta askatu)', 'Vedado permanente': 'Debeku iraunkorra', 'Vedado temporal': 'Aldi baterako debekua',
    'Escenario deportivo': 'Kirol-eszenatokia', 'Extractiva / coto': 'Erauzketa / barrutia', 'Todos los días': 'Egun guztietan', 'domingo y festivos': 'igande eta jaiegunetan',
    'sábado y domingo y festivos': 'larunbat, igande eta jaiegunetan', 'jueves y domingo y festivos': 'ostegun, igande eta jaiegunetan',
    'jueves, sábado y domingo y festivos': 'ostegun, larunbat, igande eta jaiegunetan', 'Abiertas ese día': 'Egun horretan irekita', '¿Se puede hoy?': 'Gaur daiteke?',
    'Arrastra para moverte, pellizca para acercar y toca un tramo para ver sus normas.': 'Arrastatu mugitzeko, egin atximur hurbiltzeko eta ukitu tarte bat haren arauak ikusteko.',
    'Antes de pescar, comprueba la orden foral de vedas en pesca.navarra.es.': 'Arrantzan hasi aurretik, egiaztatu debekuen foru-agindua pesca.navarra.es webgunean.',
    'Información orientativa a partir de los datos oficiales del Gobierno de Navarra (IDENA, licencia CC BY 4.0) para la temporada actual. La normativa puede cambiar: antes de pescar consulta la orden foral de vedas vigente y los avisos en pesca.navarra.es. Necesitas licencia de pesca de Navarra y, donde se indica, permiso diario.': 'Gutxi gorabeherako informazioa, Nafarroako Gobernuaren datu ofizialetan oinarrituta (IDENA, CC BY 4.0 lizentzia), oraingo denboraldirako. Araudia alda daiteke: arrantzan hasi aurretik, kontsultatu indarrean dagoen debekuen foru-agindua eta pesca.navarra.es-eko abisuak. Nafarroako arrantza-lizentzia behar duzu eta, adierazten den lekuetan, eguneko baimena.',
    'de la orden de vedas': 'debeku-aginduarena', 'Orden Foral 195E/2026 (BON nº 134, 10/07/2026)': '195E/2026 Foru Agindua (NAO 134. zk., 2026/07/10)',
    'Datos oficiales del Gobierno de Navarra (IDENA) del': 'Nafarroako Gobernuaren datu ofizialak (IDENA), data:',
    // caza
    'Ir a un coto…': 'Joan barruti batera…', 'Temporada de caza 2026-2027': '2026-2027 ehiza-denboraldia', 'Mapa: puestos, monterías y reservas': 'Mapa: postuak, mendi-ehizak eta erreserbak',
    'Caza mayor': 'Ehiza larria', 'Caza menor': 'Ehiza xehea', 'Se puede cazar': 'Ehizatu daiteke', 'Caza prohibida': 'Ehiza debekatuta',
    'Abiertos hoy': 'Gaur irekita', 'Cerrados / vedados': 'Itxita / debekatuta', 'Hoy no es día hábil (salvo festivo)': 'Gaur ez da egun baliodunik (jaieguna ez bada)',
    '¿Qué se puede cazar el día…': 'Zer ehiza daiteke egun honetan…', 'Temporada general': 'Denboraldi orokorra', 'Temporada': 'Denboraldia', 'Vigencia': 'Indarraldia',
    'Calendario': 'Egutegia', 'Días': 'Egunak', 'Mejor momento': 'Unerik onena', 'En temporada': 'Denboraldian', 'Coto': 'Barrutia', 'Privada': 'Pribatua',
    'Batidas y monterías': 'Uxaldiak eta mendi-ehizak', 'Aguardo y rececho': 'Zelatan eta isilka', 'Al salto': 'Saltoan', 'Al salto y desde puestos': 'Saltoan eta postuetatik',
    'Con escopeta': 'Eskopetarekin', 'Con galgos': 'Lebreleekin', 'Solo con perros de rastro': 'Arrasto-txakurrekin bakarrik', 'En zonas arboladas': 'Zuhaiztietan',
    'Solo en las zonas designadas': 'Izendatutako guneetan bakarrik', 'En batida (con el jabalí)': 'Uxaldian (basurdearekin)', 'Desde puestos palomeros autorizados': 'Baimendutako uso-postuetatik',
    'Pasa: puestos y chozas palomeras autorizados': 'Pasa: baimendutako uso-postuak eta etxolak', 'Aguardos y esperas nocturnas (arma de fuego o arco)': 'Gaueko zelatak eta itxaronaldiak (su-arma edo arkua)',
    'Batidas y monterías (arma de fuego); con arco también rececho': 'Uxaldiak eta mendi-ehizak (su-arma); arkuarekin isilka ere bai',
    'Zona de reserva del coto: en ella no se caza.': 'Barrutiaren erreserba-gunea: bertan ez da ehizatzen.', 'Cupos y precintos del plan del coto.': 'Barrutiaren planeko kupoak eta zigiluak.',
    'Cupos y precintos del plan.': 'Planeko kupoak eta zigiluak.', 'Según el plan de ordenación del coto.': 'Barrutiaren antolamendu-planaren arabera.', 'Según plan y muestreos.': 'Planaren eta laginketen arabera.',
    'Solo en puestos o chozas autorizados.': 'Baimendutako postu edo etxoletan bakarrik.', 'Desde puestos autorizados, todos los días.': 'Baimendutako postuetatik, egunero.',
    'Condiciones de suelta.': 'Askatzeko baldintzak.', 'También junto a la codorniz en la media veda.': 'Galeperrarekin batera ere bai, debeku erdian.',
    'Arrastra, pellizca y toca un puesto o zona para ver su ficha.': 'Arrastatu, egin atximur eta ukitu postu edo gune bat haren fitxa ikusteko.',
    'Cargando las capas de caza…': 'Ehiza-geruzak kargatzen…', 'Las capas de caza llegarán con la próxima actualización.': 'Ehiza-geruzak hurrengo eguneraketarekin iritsiko dira.',
    'Capas de los Planes de Ordenación Cinegética de cada coto (© Gobierno de Navarra · IDENA, CC BY 4.0).': 'Barruti bakoitzeko Ehiza Antolatzeko Planen geruzak (© Nafarroako Gobernua · IDENA, CC BY 4.0).',
    'Datos del Plan de Ordenación Cinegética del coto (IDENA,': 'Barrutiaren Ehiza Antolatzeko Planaren datuak (IDENA,',
    'Resumen orientativo de la orden de vedas. Para cazar hace falta licencia de Navarra, seguro, permiso del coto y respetar su Plan de Ordenación Cinegética (cupos, días asignados y zonas), que puede ser más restrictivo. Los festivos locales y los «días de fortuna» por frío cambian el calendario. Consulta siempre el texto oficial en el BON y a tu coto. Teléfono de caza del Gobierno de Navarra: 848 426 259.': 'Debeku-aginduaren gutxi gorabeherako laburpena. Ehizatzeko Nafarroako lizentzia, asegurua eta barrutiaren baimena behar dira, eta haren Ehiza Antolatzeko Plana (kupoak, egun esleituak eta guneak) errespetatu, murriztaileagoa izan baitaiteke. Tokiko jaiegunek eta hotzagatiko «zorte-egunek» egutegia aldatzen dute. Kontsultatu beti NAOko testu ofiziala eta zure barrutia. Nafarroako Gobernuaren ehiza-telefonoa: 848 426 259.',
    // natura
    'Setas': 'Perretxikoak', 'Frutos del monte': 'Mendiko fruituak', 'Frutales': 'Fruta-arbolak', 'Fauna': 'Fauna', 'Recolección': 'Bilketa',
    'Árboles por zonas': 'Zuhaitzak eremuka', 'Cómo reconocer los árboles': 'Zuhaitzak nola ezagutu', 'Buena época para verlo ahora': 'Garai ona orain ikusteko',
    'Se puede ver todo el año.': 'Urte osoan ikus daiteke.', 'Nada en temporada este mes con este filtro.': 'Ezer ez denboraldian hilabete honetan iragazki honekin.',
    'Y en qué zonas de Navarra los encontrarás.': 'Eta Nafarroako zein eremutan aurkituko dituzun.', 'Setas: seguridad y normas': 'Perretxikoak: segurtasuna eta arauak',
    'Nunca comas una seta que no conozcas al 100 %.': 'Ez jan inoiz % 100ean ezagutzen ez duzun perretxikorik.',
    'Varias amanitas son mortales y se confunden con especies comestibles. Ante la duda, consulta a una asociación micológica o a tu farmacéutico.': 'Hainbat amanita hilgarriak dira eta jangarriekin nahasten dira. Zalantzarik baduzu, galdetu elkarte mikologiko bati edo zure farmazialariari.',
    'Toca una zona del mapa para ver sus árboles, o mira la lista de especies más abajo.': 'Ukitu mapako eremu bat bertako zuhaitzak ikusteko, edo begiratu beheko espezie-zerrenda.',
    'Mapa orientativo por grandes zonas: dentro de cada una hay mucha variedad según la altitud, la orientación y el suelo.': 'Eremu handien araberako gutxi gorabeherako mapa: bakoitzaren barruan aniztasun handia dago altitudearen, orientazioaren eta lurzoruaren arabera.',
    '• Las fechas son orientativas: dependen de la lluvia, la temperatura y la altitud de cada año.': '• Datak gutxi gorabeherakoak dira: urte bakoitzeko euriaren, tenperaturaren eta altitudearen araberakoak.',
    'parques micológicos': 'parke mikologikoak', 'unos 3 kg por persona y día': '3 kg inguru pertsonako eta eguneko',
    '• Fuera de zonas reguladas, el límite general en Navarra es de': '• Arautu gabeko guneetan, Nafarroako muga orokorra hau da:', '• En los': '•',
    // terremotos
    'Magnitud mínima': 'Gutxieneko magnitudea', 'Fallas': 'Failak', 'fallas': 'failak', '24 h': '24 h', 'Los últimos': 'Azkenak',
    'Falla activa ·': 'Faila aktiboa ·', 'Falla activa': 'Faila aktiboa', 'Falla posiblemente activa (en estudio) ·': 'Ziurrenik aktiboa den faila (aztergai) ·',
    'Falla posiblemente activa (en estudio)': 'Ziurrenik aktiboa den faila (aztergai)', 'Falla reciente (mapa neotectónico)': 'Faila berria (mapa neotektonikoa)',
    'tamaño = magnitud': 'tamaina = magnitudea', 'antes': 'lehenago', 'Fecha y hora': 'Data eta ordua', 'Magnitud': 'Magnitudea', 'Profundidad': 'Sakonera',
    'Distancia a Pamplona': 'Iruñerako distantzia', 'Ficha en el EMSC': 'EMSCko fitxa', 'Zona geológica': 'Eremu geologikoa', 'Código QAFI': 'QAFI kodea',
    'Estudiada por': 'Nork aztertua', 'No hay terremotos con estos filtros.': 'Ez dago lurrikararik iragazki hauekin.', '¿Dónde están las placas?': 'Non daude plakak?',
    'Últimos 30 días en directo': 'Azken 30 egunak zuzenean', 'No se pudieron cargar los últimos días; se muestra el histórico': 'Ezin izan dira azken egunak kargatu; historikoa erakusten da',
    'Cargando los últimos días…': 'Azken egunak kargatzen…', '≥ 3 (se puede notar)': '≥ 3 (nabaritu daiteke)', 'Pirineos': 'Pirinioak', 'España': 'Espainia', 'Francia': 'Frantzia',
    'Solo lo registran los sismógrafos.': 'Sismografoek bakarrik erregistratzen dute.', 'Casi nunca se nota; quizá alguien muy cerca y en reposo.': 'Ia inoiz ez da nabaritzen; agian oso hurbil eta geldi dagoen norbaitek.',
    'Se puede notar cerca del epicentro, como el paso de un camión.': 'Epizentrotik hurbil nabaritu daiteke, kamioi bat pasatzean bezala.',
    'Se nota en una zona amplia; puede mover objetos y asustar, daños raros.': 'Eremu zabal batean nabaritzen da; objektuak mugi ditzake eta beldurra eman, kalteak arraroak dira.',
    'Se nota con fuerza; puede causar daños leves cerca del epicentro.': 'Indarrez nabaritzen da; kalte arinak eragin ditzake epizentrotik hurbil.',
    'Falla con pruebas de movimiento en el Cuaternario (los últimos 2,6 millones de años).': 'Kuaternarioan (azken 2,6 milioi urteetan) mugitu izanaren frogak dituen faila.',
    'Los geólogos aún discuten si se ha movido en el Cuaternario. Muchos de los terremotos de Navarra se agrupan cerca de este tipo de fallas.': 'Geologoek oraindik eztabaidatzen dute Kuaternarioan mugitu den. Nafarroako lurrikara asko mota honetako failetatik hurbil biltzen dira.',
    'Falla del antiguo Mapa Neotectónico de España: se movió en tiempos geológicos recientes (Plioceno‑Cuaternario).': 'Espainiako Mapa Neotektoniko zaharreko faila: duela gutxiko garai geologikoetan mugitu zen (PlioZeno‑Kuaternarioa).',
    'Datos: EMSC (Centro Sismológico Euromediterráneo), que reúne los de la Red Sísmica Nacional del IGN y redes vecinas · Fallas: base de datos QAFI del IGME‑CSIC.': 'Datuak: EMSC (Euromediterraneoko Zentro Sismologikoa), IGNren Sare Sismiko Nazionalarenak eta inguruko sareenak biltzen dituena · Failak: IGME‑CSICen QAFI datu-basea.',
    'Los terremotos no se pueden predecir. Los datos son provisionales y se revisan después. Si notas uno fuerte: protégete bajo una mesa o junto a un muro de carga, lejos de ventanas, y al salir no uses el ascensor. Emergencias: 112.': 'Lurrikarak ezin dira aurreikusi. Datuak behin-behinekoak dira eta gero berrikusten dira. Indartsu bat nabaritzen baduzu: babestu mahai baten azpian edo karga-horma baten ondoan, leihoetatik urrun, eta irtetean ez erabili igogailua. Larrialdiak: 112.',
    // caudal / SAIH
    'Fuente: SAIH Ebro (Confederación Hidrográfica del Ebro), datos cada 15 minutos y provisionales. Los avisos amarillo/naranja/rojo son los umbrales oficiales del SAIH cuando existen.': 'Iturria: SAIH Ebro (Ebroko Konfederazio Hidrografikoa), 15 minuturo eta behin-behineko datuak. Abisu hori/laranja/gorriak SAIHren atalase ofizialak dira, daudenean.',
    'el móvil lee los datos del SAIH Ebro desde tu conexión.': 'mugikorrak SAIH Ebroren datuak zure konexiotik irakurtzen ditu.',
    'Lluvia prevista: Open‑Meteo, media de 6 puntos de la cuenca (Quinto Real, Eugui, Zubiri, Ultzama, Juslapeña y Pamplona), actualizada cada 3 horas (en la app, la descarga el propio móvil). En la app, el caudal de ahora se toma solo del SAIH Ebro (Burlada); en la web lo pones tú. El modelo es sencillo.': 'Aurreikusitako euria: Open‑Meteo, arroko 6 punturen batez bestekoa (Quinto Real, Eugi, Zubiri, Ultzama, Txulapain eta Iruña), 3 orduro eguneratua (aplikazioan mugikorrak berak deskargatzen du). Aplikazioan, oraingo emaria SAIH Ebrotik (Burlata) bakarrik hartzen da; webean zuk jartzen duzu. Eredua sinplea da.',
    // caza: especies y normas
    'Jabalí': 'Basurdea', 'Corzo': 'Orkatza', 'Ciervo': 'Oreina', 'Gamo': 'Adarzabala', 'Zorro': 'Azeria', 'Paloma torcaz': 'Pagausoa',
    'Paloma torcaz y zurita': 'Pagausoa eta txoloma', 'Zorzales': 'Birigarroak', 'Zorzales (común, charlo, real, alirrojo)': 'Birigarroak (arrunta, garraztarra, durdula eta birigarro txikia)',
    'Becada (sorda)': 'Oilagorra', 'Perdiz roja': 'Eper gorria', 'Liebre ibérica': 'Erbi iberiarra', 'Liebre europea': 'Europako erbia', 'Conejo': 'Untxia',
    'Faisán': 'Faisaia', 'Codorniz': 'Galeperra', 'Acuáticas (ánade real, cerceta, ánsar, focha, avefría, agachadiza)': 'Uretakoak (basahatea, zertzeta, antzara, kopetazuria, hegabera eta istingorra)',
    'Solo en los puestos del plan del coto; avisar al guarderío con 48 h; la linterna solo justo antes del disparo.': 'Barrutiaren planeko postuetan bakarrik; abisatu basozainei 48 h lehenago; linterna tiro egin aurretik bakarrik.',
    'Avisar con 24 h indicando precinto y zona; cupos del plan.': 'Abisatu 24 h lehenago, zigilua eta gunea adierazita; planeko kupoak.',
    'Machos asignados o no abatidos; resto solo con precintos neutros por daños.': 'Esleitutako arrak edo ehizatu gabeak; gainerakoak kalteengatiko zigilu neutroekin bakarrik.',
    'Plan, precinto y aviso con 24 h.': 'Plana, zigilua eta 24 h lehenagoko abisua.',
    'Zona Sur: al salto en zonas de codorniz o en puesto de vuelo; Zona Norte: al salto fuera de zonas arboladas.': 'Hegoaldea: saltoan galeper-guneetan edo hegaldi-postuan; Iparraldea: saltoan zuhaiztietatik kanpo.',
    'Máx. 10 por cazador y día. Zona Norte: fuera de zonas arboladas.': 'Gehienez 10 ehiztari eta eguneko. Iparraldea: zuhaiztietatik kanpo.',
    'Precinto electrónico; máx. 2 por cazador y día y cupo por coto.': 'Zigilu elektronikoa; gehienez 2 ehiztari eta eguneko, eta kupoa barrutiko.',
    'Solo los días asignados a cada coto (pueden ser cero); hasta las 14:00; máx. 2 por cazador y día.': 'Barruti bakoitzari esleitutako egunetan bakarrik (zero izan daitezke); 14:00ak arte; gehienez 2 ehiztari eta eguneko.',
    'Máx. 2 días por coto; hasta las 14:00; al salto 1 por cazador y día; en batida 1 por cuadrilla.': 'Gehienez 2 egun barrutiko; 14:00ak arte; saltoan 1 ehiztari eta eguneko; uxaldian 1 koadrillako.',
    'Sin escopeta ni palo; 1 por persona o cuadrilla.': 'Eskopetarik eta makilarik gabe; 1 pertsonako edo koadrillako.',
    'Hay además un periodo de verano (15 ago–30 sep) solo en zonas que cumplen el art. 14.': 'Gainera, udako aldi bat dago (abu 15–ira 30), 14. art. betetzen duten guneetan bakarrik.',
    'Hasta 1 h antes de anochecer; perros con cascabel; máx. 3 al día; no en puestos ni balsas; prohibida su venta; se suspende si se declaran días de fortuna por frío.': 'Ilunabarra baino ordubete lehenagora arte; txakurrak zintzarriarekin; gehienez 3 eguneko; ez postuetan ez urmaeletan; debekatuta dago saltzea; hotzagatiko zorte-egunak deklaratzen badira, eten egiten da.',
    'El ánade real tiene además media veda (15 ago–13 sep).': 'Basahateak, gainera, debeku erdia du (abu 15–ira 13).',
    'antes · tamaño = magnitud': 'lehenago · tamaina = magnitudea',
    'Llegan con la app actualizada (versión 6 o más): pulsa «⬆️ Buscar nueva versión de la app» en el menú.': 'Aplikazio eguneratuarekin iristen dira (6. bertsioa edo berriagoa): sakatu menuko «⬆️ Bilatu aplikazioaren bertsio berria».',
    'Acerca de': 'Honi buruz', 'ℹ️ Acerca de': 'ℹ️ Honi buruz', 'ℹ️ Información técnica': 'ℹ️ Informazio teknikoa',
    'Cuidado con las amanitas blancas (láminas siempre blancas = peligro).': 'Kontuz amanita zuriekin (orri beti zuriak = arriskua).',
  };
  // meses y días para las fechas que arma la propia app
  window.EU_MES = ['urt', 'ots', 'mar', 'api', 'mai', 'eka', 'uzt', 'abu', 'ira', 'urr', 'aza', 'abe'];
  window.EU_DOW = ['ig.', 'al.', 'ar.', 'az.', 'og.', 'or.', 'lr.'];
  const MESL = { enero: 'urtarrila', febrero: 'otsaila', marzo: 'martxoa', abril: 'apirila', mayo: 'maiatza', junio: 'ekaina', julio: 'uztaila', agosto: 'abuztua', septiembre: 'iraila', octubre: 'urria', noviembre: 'azaroa', diciembre: 'abendua' };
  for (const k in MESL) EU[k[0].toUpperCase() + k.slice(1)] = MESL[k][0].toUpperCase() + MESL[k].slice(1);
  window.T = s => (L === 'eu' && EU[s]) || s;   // para textos que se dibujan en los mapas
  if (L !== 'eu') return;

  // textos con números o nombres dentro: [patrón, traducción] (lo de dentro también se traduce)
  const RX = [
    [/^Artículo ([\d.]+) de la orden de vedas$/, 'Debeku-aginduaren $1. artikulua'],
    [/^Cargando el tiempo de (\d+) pueblos…$/, '$1 herritako eguraldia kargatzen…'],
    [/^Cargando el tiempo de (.+)…$/, 'Eguraldia kargatzen: $1…'],
    [/^Cargando el histórico de (.+)…$/, 'Historikoa kargatzen: $1…'],
    [/^Conectando con (.+)$/, 'Konektatzen: $1'],
    [/^(\d+) días$/, '$1 egun'], [/^(\d+) años$/, '$1 urte'], [/^1 año$/, 'Urte 1'], [/^(\d+) meses$/, '$1 hilabete'],
    [/^En temporada en (\S+): (\d+)$/, 'Denboraldian ($1): $2'], [/^En temporada en$/, 'Denboraldian:'],
    [/^Fuera de temporada \((\d+)\)$/, 'Denboralditik kanpo ($1)'], [/^Fuera de temporada \($/, 'Denboralditik kanpo ('],
    [/^Los más fuertes \((.+)\)$/, 'Indartsuenak ($1)'], [/^Los más fuertes \($/, 'Indartsuenak ('],
    [/^terremotos \((.+), magnitud ≥ ([\d.,]+)\)\.$/, 'lurrikara ($1, magnitudea ≥ $2).'],
    [/^Terremoto de magnitud ([\d.,]+)$/, '$1 magnitudeko lurrikara'],
    [/^Falla de (.+)$/, '$1 faila'],
    [/^histórico hasta (.+)$/, 'historikoa, data honetara arte: $1'],
    [/^Ver en el mapa \($/, 'Ikusi mapan ('],
    [/^(.+) · histórico hasta (.+)$/, '$1 · historikoa $2 arte'],
    [/^pantalla (\d+)$/, 'pantaila $1'],
    [/^Camino (francés|aragonés) · etapa (\d+): (.+) – (.+)$/, 'Done Jakue bidea ($1) · $2. etapa: $3 – $4'],
    [/^Dibujando las rutas recomendadas: (\d+) de (\d+)…$/, 'Gomendatutako ibilbideak marrazten: $1 / $2…'],
    [/^(.+) · histórico hasta (.+)$/, '$1 · historikoa $2 arte'],
    [/^pantalla (\d+)$/, 'pantaila $1'],
    [/^Hoy, (.+): (\d+) modalidades abiertas$/, 'Gaur, $1: $2 modalitate irekita'],
  ];
  const PRE = /^[^\p{L}\p{N}¿¡«“(]+/u, SUF = /[\s:·…,.]+$/u;
  function tr(s) {
    if (EU[s]) return EU[s];
    const p = (s.match(PRE) || [''])[0], rest = s.slice(p.length);
    if (p && EU[rest]) return p + EU[rest];
    const q = (rest.match(SUF) || [''])[0], core = rest.slice(0, rest.length - q.length);
    if (q && EU[core]) return p + EU[core] + q;
    for (const [re, to] of RX) {
      const m = core.match(re) || rest.match(re);
      if (m) return p + to.replace(/\$(\d)/g, (_, i) => tr(m[+i]) || m[+i]) + (core.match(re) ? q : '');
    }
    return fecha(s);
  }
  // fechas que la app escribe en castellano («4 nov 2026, 14:00», «mié, 4 nov», «miércoles 4»)
  const MES3 = { ene: 'urt', feb: 'ots', mar: 'mar', abr: 'api', may: 'mai', jun: 'eka', jul: 'uzt', ago: 'abu', sep: 'ira', oct: 'urr', nov: 'aza', dic: 'abe' };
  const DIAS = { lunes: 'astelehena', martes: 'asteartea', 'miércoles': 'asteazkena', jueves: 'osteguna', viernes: 'ostirala', 'sábado': 'larunbata', domingo: 'igandea',
    lun: 'al.', mar: 'ar.', 'mié': 'az.', jue: 'og.', vie: 'or.', 'sáb': 'lr.', dom: 'ig.' };
  function fecha(s) {
    if (!/\d/.test(s)) return null;
    let o = s.replace(/(\d{1,2}) (ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b/g, (_, d, m) => d + ' ' + MES3[m]);
    o = o.replace(/(^|[\s,(])(lunes|martes|miércoles|jueves|viernes|sábado|domingo|lun|mar|mié|jue|vie|sáb|dom)(?=[\s,.])/g, (_, a, d) => a + DIAS[d]);
    return o !== s ? o : null;
  }
  window.trEU = tr;
  function doText(n) {
    const v = n.nodeValue, t = v.trim();
    if (!t || t.length > 600 || !/\p{L}{2}/u.test(t)) return;
    const r = tr(t);
    if (r && r !== t) n.nodeValue = v.replace(t, r);
  }
  function doEl(el) {
    if (el.nodeType === 3) { doText(el); return; }
    if (el.nodeType !== 1 || el.nodeName === 'SCRIPT' || el.nodeName === 'STYLE') return;
    for (const a of ['placeholder', 'title']) if (el.hasAttribute && el.hasAttribute(a)) { const r = tr(el.getAttribute(a)); if (r) el.setAttribute(a, r); }
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) { const p = n.parentNode; if (p && p.nodeName !== 'SCRIPT' && p.nodeName !== 'STYLE') doText(n); }
      else for (const a of ['placeholder', 'title']) if (n.hasAttribute(a)) { const r = tr(n.getAttribute(a)); if (r) n.setAttribute(a, r); }
    }
  }
  function start() {
    doEl(document.body);
    new MutationObserver(ms => {
      for (const m of ms) {
        if (m.type === 'characterData') doText(m.target);
        else m.addedNodes.forEach(doEl);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
