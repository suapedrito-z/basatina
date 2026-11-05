# Prueba de fuentes de datos de energía (se ejecuta en GitHub Actions, que tiene internet).
# Escribe lo que encuentra en tools/energia_info.txt
import json, re, urllib.request, urllib.parse
OUT = []
def log(*a):
    s = ' '.join(str(x) for x in a); print(s); OUT.append(s)
def get(u, data=None, hdr=None):
    h = {'User-Agent': 'Mozilla/5.0 BasatiNA', 'Accept': '*/*'}
    h.update(hdr or {})
    r = urllib.request.Request(u, data=data, headers=h)
    with urllib.request.urlopen(r, timeout=60) as f:
        return f.status, f.read()

REE = 'https://apidatos.ree.es/es/datos/'
tests = [
    ('ccaa navarra id 14 dia', 'generacion/estructura-generacion?start_date=2026-11-01T00:00&end_date=2026-11-04T23:59&time_trunc=day&geo_trunc=electric_system&geo_limit=ccaa&geo_ids=14'),
    ('ccaa navarra id 14 hora', 'generacion/estructura-generacion?start_date=2026-11-04T00:00&end_date=2026-11-04T23:59&time_trunc=hour&geo_trunc=electric_system&geo_limit=ccaa&geo_ids=14'),
    ('ccaa navarra id 14 mes', 'generacion/estructura-generacion?start_date=2025-01-01T00:00&end_date=2026-10-31T23:59&time_trunc=month&geo_trunc=electric_system&geo_limit=ccaa&geo_ids=14'),
    ('potencia instalada mes', 'generacion/potencia-instalada?start_date=2025-01-01T00:00&end_date=2026-10-31T23:59&time_trunc=month&geo_trunc=electric_system&geo_limit=ccaa&geo_ids=14'),
    ('evolucion renovable hora', 'generacion/evolucion-renovable-no-renovable?start_date=2026-11-04T00:00&end_date=2026-11-04T23:59&time_trunc=hour&geo_trunc=electric_system&geo_limit=ccaa&geo_ids=14'),
    ('demanda hora navarra', 'demanda/evolucion?start_date=2026-11-04T00:00&end_date=2026-11-04T23:59&time_trunc=hour&geo_trunc=electric_system&geo_limit=ccaa&geo_ids=14'),
    ('peninsular hora estructura', 'generacion/estructura-generacion?start_date=2026-11-04T00:00&end_date=2026-11-04T23:59&time_trunc=hour&geo_trunc=electric_system&geo_limit=peninsular&geo_ids=8741'),
    ('balance navarra dia', 'balance/balance-electrico?start_date=2026-11-01T00:00&end_date=2026-11-04T23:59&time_trunc=day&geo_trunc=electric_system&geo_limit=ccaa&geo_ids=14'),
]
for name, path in tests:
    log('\n=====', name, path)
    try:
        st, b = get(REE + path)
        j = json.loads(b)
        log('status', st, 'bytes', len(b))
        for inc in j.get('included', [])[:20]:
            a = inc.get('attributes', {})
            vals = a.get('values', [])
            log(' -', inc.get('type'), '|', a.get('title'), '| n', len(vals), '|', vals[:3], '|', vals[-1:] if vals else '')
    except Exception as e:
        log('ERROR', repr(e)[:300])
        try:
            log(e.read()[:400])
        except Exception:
            pass

# Overpass: centrales eléctricas en Navarra
log('\n===== OVERPASS power=plant/generator Navarra')
q = '''[out:json][timeout:120];area["name"="Navarra"]["admin_level"="4"]->.a;
(nwr["power"="plant"](area.a););out center tags;'''
for srv in ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']:
    try:
        st, b = get(srv, data=urllib.parse.urlencode({'data': q}).encode())
        j = json.loads(b)
        els = j.get('elements', [])
        log('server', srv, 'plantas', len(els))
        from collections import Counter
        log(Counter(e['tags'].get('plant:source', '?') for e in els))
        for e in els[:400]:
            t = e['tags']
            c = e.get('center') or {'lat': e.get('lat'), 'lon': e.get('lon')}
            log(' *', t.get('plant:source'), '|', t.get('name'), '|', t.get('plant:output:electricity'), '|', t.get('operator'), '|', round(c['lat'] or 0, 4), round(c['lon'] or 0, 4), '|', t.get('generator:count') or t.get('plant:generator_count') or '')
        break
    except Exception as e:
        log('ERROR overpass', srv, repr(e)[:200])

# AEE: lista de parques eólicos de Navarra
log('\n===== AEE Navarra')
for u in ['https://aeeolica.org/sobre-la-eolica/mapa-de-parques-eolicos-en-espana/navarra/',
          'https://aeeolica.org/en/about-wind-energy/map-of-wind-farms-in-spain/navarra/']:
    try:
        st, b = get(u)
        t = b.decode('utf8', 'ignore')
        links = sorted(set(re.findall(r'href="(https://aeeolica\.org/[^"]*/navarra/[^"]+)"', t)))
        log('url', u, 'status', st, 'len', len(t), 'enlaces', len(links))
        for l in links[:200]:
            log('  ', l)
        if links:
            st, b = get(links[0])
            tt = re.sub(r'<[^>]+>', ' ', b.decode('utf8', 'ignore'))
            tt = re.sub(r'\s+', ' ', tt)
            i = tt.find('Comunidad')
            log('EJEMPLO', tt[i - 50:i + 600])
        break
    except Exception as e:
        log('ERROR AEE', u, repr(e)[:200])

# IDENA: capas de energía
log('\n===== IDENA capas energía')
try:
    st, b = get('https://idena.navarra.es/ogc/wms?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0')
    t = b.decode('utf8', 'ignore')
    names = re.findall(r'<Name>([^<]+)</Name>\s*<Title>([^<]+)</Title>', t)
    for n, ti in names:
        if re.search(r'energ|eolic|aerogen|hidroel|fotovol|solar|renovab|electr|central|minicent|parque', n + ti, re.I):
            log('  ', n, '|', ti)
except Exception as e:
    log('ERROR IDENA', repr(e)[:200])

open('tools/energia_info.txt', 'w').write('\n'.join(str(x) for x in OUT))
