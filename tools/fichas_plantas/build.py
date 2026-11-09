#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera web/fichas-plantas-datos.js y docs/fichas-flora-estado.md a partir de las fichas
de tools/fichas_plantas/*_fichas.py y comprueba que la fase de árboles está completa.

Uso:  python3 tools/fichas_plantas/build.py          (genera y verifica)
      python3 tools/fichas_plantas/build.py --check  (solo verifica; falla si hay errores)
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import arboles_fichas as AR  # noqa: E402
try:
    import arbustos_fichas as AB  # noqa: E402
except ImportError:
    AB = None
try:
    import flores_fichas as FL  # noqa: E402
except ImportError:
    FL = None
from clasificacion import TREE_GENERA, NO_ARBOL, FASES  # noqa: E402

CFH = ('Catálogo Florístico Histórico de Navarra (Gobierno de Navarra, GBIF)', 'https://doi.org/10.15468/nf54bd')
ARBOLAPP = ('Arbolapp (CSIC/FECYT, CC BY-NC-ND 4.0)', 'https://www.arbolapp.es/especies/ficha/%s/')
ORIGEN = {'autoctona': 'Autóctona', 'introducida': 'Introducida (naturalizada o asilvestrada)', 'cultivada': 'Cultivada u ornamental'}
DIBUJO = {'lobulada': 'hoja lobulada', 'dentada': 'hoja simple de borde dentado', 'entera': 'hoja simple de borde liso',
          'lanceolada': 'hoja estrecha y alargada', 'cordada': 'hoja acorazonada', 'palmeada': 'hoja palmeada',
          'pinnada': 'hoja compuesta pinnada', 'palmaticompuesta': 'hoja compuesta palmeada', 'acicula': 'agujas en grupo',
          'aguja': 'agujas sueltas', 'escama': 'hojas en escama', 'espinosa': 'hoja de borde espinoso'}
REQ = ['nombre', 'cientifico', 'familia', 'origenClave', 'dibujo', 'caduca', 'porte', 'hoja', 'flores', 'floracion',
       'fruto', 'habitat', 'reconocer', 'parecidas']


def inventario():
    s = open(os.path.join(ROOT, 'web', 'flora-inventario-datos.js'), encoding='utf-8').read()
    d = json.loads(s[s.index('{'):s.rindex('}') + 1])
    lista = next(v for v in d.values() if isinstance(v, list))
    return {t['nombre']: t['citas'] for t in lista}


def eusk_aa(slug):
    p = os.path.join(HERE, 'arbolapp_nombres.json')
    if not os.path.exists(p):
        return None, None
    d = json.load(open(p, encoding='utf-8')).get(slug)
    return (d or {}).get('eusk'), (d or {}).get('cast')


def ficha(f, cat, inv):
    citas = sum(inv.get(n, 0) for n in f['cfh'])
    nav = []
    if f['cfh']:
        nombres = ', '.join(f['cfh'])
        nav.append('El Catálogo Florístico Histórico de Navarra recoge %d cita%s (%s). Son registros históricos de herbario y bibliografía, no un censo actual.'
                   % (citas, '' if citas == 1 else 's', nombres))
    else:
        nav.append('No figura en el Catálogo Florístico Histórico de Navarra (que recoge sobre todo flora silvestre); se incluye por estar plantado en Navarra.')
    if f.get('navarraExtra'):
        nav.append(f['navarraExtra'])
    eu, cast = (eusk_aa(f['slug']) if f.get('arbolapp') else (None, None))
    otros = f.get('otros') or ''
    fuentes = []
    if f.get('arbolapp'):
        fuentes.append([ARBOLAPP[0], ARBOLAPP[1] % f['slug']])
    fuentes += [list(x) for x in f.get('fuentesExtra', [])]
    if f['cfh']:
        fuentes.append(list(CFH))
    return dict(id=f['slug'], categoria=cat, nombre=f['nombre'], cientifico=f['cientifico'], familia=f['familia'],
                origen=ORIGEN[f['origenClave']], origenClave=f['origenClave'], caduca=f['caduca'], otros=otros,
                eusk=f.get('eusk') or eu or '', dibujo=f['dibujo'], dibujoTxt=DIBUJO.get(f['dibujo'], f['dibujo']),
                reconocer=f['reconocer'], porte=f['porte'], hoja=f['hoja'], flores=f['flores'], floracion=f['floracion'],
                fruto=f['fruto'], habitat=f['habitat'], navarra=' '.join(nav), parecidas=f['parecidas'],
                citasCFH=citas, nombresCFH=f['cfh'], fuentes=fuentes)


def verificar(fichas, inv):
    err, avisos = [], []
    ids = set()
    for f in fichas:
        if f['id'] in ids:
            err.append('Ficha duplicada: %s' % f['id'])
        ids.add(f['id'])
        for k in REQ:
            if not str(f.get(k) or '').strip():
                err.append('%s: falta el campo %s' % (f['id'], k))
        if f['dibujo'] not in DIBUJO:
            err.append('%s: tipo de dibujo desconocido %s' % (f['id'], f['dibujo']))
        if not f['fuentes'] or any(not str(u).startswith('https://') for _, u in f['fuentes']):
            err.append('%s: fuentes ausentes o sin https' % f['id'])
        for n in f['nombresCFH']:
            if n not in inv:
                err.append('%s: el nombre %r no está en el inventario' % (f['id'], n))
        if re.search(r'\b(foto|fotograf|mapa)\b', ' '.join(str(f.get(k, '')) for k in REQ), re.I):
            avisos.append('%s: menciona fotos o mapas' % f['id'])
    cubiertos = {n for f in fichas if f['categoria'] == 'arboles' for n in f['nombresCFH']}
    pendientes = []
    for n, c in sorted(inv.items()):
        if n.split()[0] in TREE_GENERA and n not in cubiertos:
            if n in NO_ARBOL:
                continue
            pendientes.append('%s (%d citas)' % (n, c))
    for n in pendientes:
        err.append('Taxón de género arbóreo sin ficha ni clasificación: %s' % n)
    for n in NO_ARBOL:
        if n not in inv:
            err.append('Clasificación de un nombre que no está en el inventario: %s' % n)
    return err, avisos


def main():
    inv = inventario()
    fichas = [ficha(f, 'arboles', inv) for f in AR.ARBOLES]
    if AB:
        fichas += [ficha(f, 'arbustos', inv) for f in AB.ARBUSTOS]
    if FL:
        fichas += [ficha(f, 'flores', inv) for f in FL.FLORES]
    err, avisos = verificar(fichas, inv)
    n = {c: sum(1 for f in fichas if f['categoria'] == c) for c in ('arboles', 'arbustos', 'flores')}
    fases = json.loads(json.dumps(FASES))
    for c in fases:
        fases[c]['fichas'] = n[c]
    fases['arbustos']['pendientesDesdeArboles'] = sorted(k for k, v in NO_ARBOL.items() if 'arbustos' in v)
    data = dict(version=1, nota='Textos redactados para BasatiNA a partir de las fuentes citadas en cada ficha. Los dibujos son esquemas del tipo de hoja, no ilustraciones de la especie. Sin fotografías ni mapas.',
                fases={c: dict(estado=v['estado'], texto=v['texto']) for c, v in fases.items()}, fichas=fichas)
    if '--check' not in sys.argv:
        js = '// Generado por tools/fichas_plantas/build.py. No editar a mano.\nwindow.BNA_FICHAS_PLANTAS=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
        open(os.path.join(ROOT, 'web', 'fichas-plantas-datos.js'), 'w', encoding='utf-8').write(js)
        os.makedirs(os.path.join(ROOT, 'docs'), exist_ok=True)
        json.dump(fases, open(os.path.join(ROOT, 'docs', 'fichas-flora-fases.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        md = ['# Estado de las fichas de flora', '', 'Generado por `tools/fichas_plantas/build.py`.', '']
        for c, v in fases.items():
            md.append('- **%s**: %s — %d fichas. %s' % (c, v['estado'], n[c], v['texto']))
        md += ['', '## Verificación de la fase de árboles', '']
        md.append('Resultado: **%s**' % ('CORRECTA' if not err else 'CON ERRORES (%d)' % len(err)))
        md += ['', 'Se comprueba que cada taxón del inventario (Catálogo Florístico Histórico de Navarra) de un género con árboles tiene ficha de árbol o una clasificación justificada, que ninguna ficha tiene campos vacíos y que todas tienen fuentes.', '']
        md += ['- ' + e for e in err] + ['- Aviso: ' + a for a in avisos]
        md += ['', '## Taxones del inventario no tratados como árbol', '', '| Nombre en el inventario | Citas | Decisión |', '|---|---:|---|']
        for k, v in sorted(NO_ARBOL.items()):
            md.append('| %s | %d | %s |' % (k, inv.get(k, 0), v))
        md += ['', '## Fichas de árboles', '', '| Nombre | Científico | Origen | Citas en el catálogo |', '|---|---|---|---:|']
        for f in sorted((f for f in fichas if f['categoria'] == 'arboles'), key=lambda f: f['nombre']):
            md.append('| %s | %s | %s | %d |' % (f['nombre'], f['cientifico'], f['origen'], f['citasCFH']))
        open(os.path.join(ROOT, 'docs', 'fichas-flora-estado.md'), 'w', encoding='utf-8').write('\n'.join(md) + '\n')
    print('Fichas: %s' % n)
    for a in avisos:
        print('AVISO:', a)
    for e in err:
        print('ERROR:', e)
    print('Verificación:', 'OK' if not err else 'FALLA')
    sys.exit(1 if err else 0)


if __name__ == '__main__':
    main()
