# -*- coding: utf-8 -*-
# Géneros que contienen árboles en Navarra (se revisan TODOS sus taxones del inventario).
TREE_GENERA = set('''Abies Acer Aesculus Ailanthus Alnus Amelanchier Arbutus Betula Buxus Carpinus Castanea Cedrus Celtis
Cercis Chamaecyparis Cornus Corylus Cotoneaster Crataegus Cupressus Elaeagnus Erica Eucalyptus Euonymus Fagus Ficus
Frangula Fraxinus Ilex Juglans Juniperus Larix Laurus Ligustrum Liriodendron Magnolia Malus Mespilus Morus Olea Padus
Paulownia Phillyrea Picea Pinus Pistacia Platanus Populus Prunus Pyrus Quercus Rhamnus Robinia Salix Sambucus
Sequoiadendron Sophora Sorbus Tamarix Taxus Tilia Ulmus Viburnum Viscum'''.split())

A = 'Fase de arbustos: '
NO_ARBOL = {
 'Buxus sempervirens L.': A + 'boj.',
 'Cornus mas L.': A + 'cornejo macho.',
 'Cornus sanguinea L.': A + 'cornejo.',
 'Cotoneaster integerrimus Kom.': A + 'durillo dulce.',
 'Cotoneaster tomentosus (Ait.) Lindl.': A + 'cotoneaster tomentoso.',
 'Erica arborea L.': A + 'brezo blanco (arbusto alto; rara vez arbolillo).',
 'Erica ciliaris L.': A + 'brezo.', 'Erica cinerea L.': A + 'brezo.', 'Erica lusitanica Rudolphi': A + 'brezo.',
 'Erica multiflora L.': A + 'brezo.', 'Erica scoparia L.': A + 'brezo de escobas.', 'Erica tetralix L.': A + 'brezo de turbera.',
 'Erica vagans L.': A + 'brezo.',
 'Euonymus europaeus L.': A + 'bonetero.',
 'Frangula alnus Mill.': A + 'arraclán.',
 'Juniperus oxycedrus subsp. badia (H. Gay) Debeaux': A + 'enebro de la miera.',
 'Juniperus oxycedrus subsp. macrocarpa (Sibth. & Sm.) Ball': A + 'enebro de la miera.',
 'Juniperus oxycedrus subsp. oxycedrus': A + 'enebro de la miera.',
 'Juniperus sabina L.': A + 'sabina rastrera.',
 'Ligustrum ovalifolium Hassk.': A + 'aligustre de jardín.', 'Ligustrum vulgare L.': A + 'aligustre.',
 'Phillyrea angustifolia L.': A + 'labiérnago blanco.',
 'Pistacia lentiscus L.': A + 'lentisco.', 'Pistacia terebinthus L.': A + 'cornicabra.',
 'Prunus chamaecerasus Jacq.': A + 'cerezo enano.',
 'Prunus domestica var. spinosa (L.) Kuntze': A + 'endrino (Prunus spinosa).',
 'Prunus padus Brandis': A + 'cerezo aliso (en Navarra, de porte arbustivo; 3 citas).',
 'Quercus coccifera L.': A + 'coscoja.',
 'Rhamnus alaternus L.': A + 'aladierno.', 'Rhamnus alpina L.': A + 'aliso negro de montaña.',
 'Rhamnus cathartica L.': A + 'espino cerval.', 'Rhamnus lycioides Pall.': A + 'espino negro.',
 'Rhamnus pumila Turra': A + 'arraclán enano.', 'Rhamnus saxatilis Host': A + 'espino de tintes.',
 'Salix aurita L.': A + 'sauce orejudo.', 'Salix cinerea L.': A + 'sauce.', 'Salix elaeagnos Scop.': A + 'sarga.',
 'Salix pentandra L.': A + 'sauce laurel (1 cita).', 'Salix purpurea L.': A + 'sarga negra.',
 'Salix pyrenaica Gouan': A + 'sauce pirenaico.', 'Salix repens L.': A + 'sauce rastrero.', 'Salix retusa Hook.': A + 'sauce enano.',
 'Salix triandra L.': A + 'sarga.', 'Salix triandra subsp. discolor (Koch) Arcangeli': A + 'sarga.', 'Salix viminalis L.': A + 'mimbrera.',
 'Sambucus ebulus L.': 'Fase de flores/herbáceas: yezgo (planta herbácea).',
 'Sambucus racemosa L.': A + 'saúco rojo.',
 'Sorbus amelanchier (L.) Crantz': A + 'guillomo (Amelanchier ovalis).',
 'Sorbus chamaemespilus Nyman': A + 'mostajo enano.',
 'Sorbus cydonia (L.) Crantz': A + 'membrillero (Cydonia oblonga), cultivado.',
 'Tamarix africana Poir.': A + 'taray.', 'Tamarix canariensis Willd.': A + 'taray.', 'Tamarix gallica L.': A + 'taray.',
 'Viburnum lantana L.': A + 'lantana.', 'Viburnum opulus L.': A + 'mundillo.', 'Viburnum tinus L.': A + 'durillo.',
 'Viscum album L.': 'No es árbol: muérdago, planta semiparásita (fase de arbustos).',
 'Alnus elliptica Req.': 'Excluido: 1 cita histórica dudosa de un aliso de Córcega; sin presencia conocida en Navarra.',
 'Alnus incana (L.) Moench': 'Excluido: 1 cita histórica; aliso gris sin poblaciones conocidas en Navarra.',
 'Crataegus media Sarg.': 'Excluido: híbrido de majuelos (3 citas); se menciona en la ficha del majuelo.',
 'Pyrus pyraster (L.) Boreau': 'Mencionado en la ficha del peral silvestre (6 citas); taxonomía discutida.',
 'Pyrus sanguinea Pursh': 'Pendiente de revisión: nombre ambiguo en el catálogo (57 citas); no se asigna a ninguna especie para no dar información sin verificar.',
 'Quercus incana W.Bartram': 'Pendiente de revisión: nombre ambiguo en el catálogo (55 citas); probablemente encina o roble pubescente, sin poder confirmarlo.',
 'Quercus andegavensis Hy': 'Híbrido de robles; no lleva ficha propia.', 'Quercus cerrioides Willk. & Costa': 'Híbrido quejigo × roble pubescente; no lleva ficha propia.',
 'Quercus coutinhoi Samp.': 'Híbrido de robles; no lleva ficha propia.', 'Quercus firmurensis Hy': 'Híbrido de robles; no lleva ficha propia.',
 'Quercus neomairei A.Camus': 'Híbrido de robles; no lleva ficha propia.', 'Quercus rosacea Bechst.': 'Híbrido de robles; no lleva ficha propia.',
 'Quercus senneniana A.Camus': 'Híbrido de robles; no lleva ficha propia.',
 'Salix pendulina Wender.': 'Híbrido de sauces (3 citas); no lleva ficha propia.', 'Salix rubens Schrank': 'Híbrido de sauces (2 citas); no lleva ficha propia.',
 'Sorbus L.': 'Cita solo de género, sin especie.', 'Sorbus erubescens A.Kern.': 'Híbrido de serbales (2 citas).',
 'Sorbus semipinnata Borbás': 'Híbrido de serbales (1 cita).', 'Sorbus sudetica (Tausch) Bluff, Nees & Schauer': 'Híbrido de serbales (1 cita).',
}

FASES = {
 'arboles': {'estado': 'completa', 'texto': 'Fase 1 completa: árboles autóctonos, naturalizados y cultivados u ornamentales documentados en Navarra.'},
 'arbustos': {'estado': 'pendiente', 'texto': 'Fase 2 en preparación: los arbustos se irán añadiendo por tandas, cada uno con sus fuentes.'},
 'flores': {'estado': 'pendiente', 'texto': 'Fase 3 pendiente: empezará cuando termine la de arbustos.'},
}
