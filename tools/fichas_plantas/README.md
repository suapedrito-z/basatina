# Fichas de flora de Navarra (árboles → arbustos → flores)

- Las fichas se escriben en `arboles_fichas.py`, `arbustos_fichas.py` y `flores_fichas.py` (lista `ARBOLES`, `ARBUSTOS`, `FLORES`), con la función `F(...)` de `arboles_fichas.py`.
- `python3 tools/fichas_plantas/build.py` genera `web/fichas-plantas-datos.js` (lo lee la pantalla «Fichas de flora», `web/fichas-arboles.js`), `docs/fichas-flora-fases.json` y `docs/fichas-flora-estado.md`, y verifica.
- `clasificacion.py`: géneros revisados, taxones del inventario que no son árbol (con su fase) y estado de cada fase.
- Normas: textos propios (Arbolapp es CC BY-NC-ND: no copiar literal), solo dibujo esquemático de la hoja, sin fotos ni mapas, cada ficha con fuentes https, nada sin verificar.
- `cfh`: nombres exactos del inventario `web/flora-inventario-datos.js` (Catálogo Florístico Histórico de Navarra, CC BY 4.0, doi:10.15468/nf54bd).
