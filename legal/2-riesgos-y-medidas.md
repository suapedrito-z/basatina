# Análisis de riesgos y medidas de seguridad · Comunidad de avisos

> **Por qué.** El RGPD pide pensar antes qué puede salir mal con los datos y poner medidas (art. 24, 25 y 32). Esto es eso, en sencillo.
> **¿Hace falta una «evaluación de impacto» (EIPD) formal?** Con este diseño, creemos que **no**: no hay datos sensibles, ni perfiles, ni seguimiento de personas, ni vigilancia, y los avisos son anónimos. La EIPD haría falta si algún día se añadieran fotos de personas, la ubicación en tiempo real de los usuarios o cuentas con perfil. **Si cambia el diseño, revisar esto.**

## Privacidad desde el diseño (lo más importante)
1. **Sin cuentas.** No hay nombre, correo ni contraseña de los usuarios. Lo que no se recoge no se puede perder.
2. **Código de colaborador al azar.** Lo genera el móvil (`crypto.getRandomValues`) y se guarda en el móvil. No sale de ningún dato del teléfono.
3. **La ubicación es la del suceso, no la de la persona.** La persona marca el punto en el mapa. Aunque use «mi ubicación» para centrarlo, solo se envía el punto marcado, redondeado a 4 decimales (~10 m).
4. **Texto corto** (300 caracteres) y **sin fotos** en la primera fase.
5. **Caducidad automática** y borrado total a los 30 días.
6. **El código no se publica nunca**: el público ve solo tipo, texto, punto y hora.

## Riesgos y medidas

| # | Qué puede pasar | Probabilidad / gravedad | Medida |
|---|---|---|---|
| R1 | Alguien escribe el nombre o la matrícula de otra persona (p. ej., «el del coche 1234 ABC ha puesto veneno») | Media / Alta | Los avisos de **veneno** y **accidente** pasan siempre por revisión. Filtro automático que manda a revisión los textos con matrículas, teléfonos, correos o palabras como «ha sido», «culpa», nombres propios después de «el/la». Botón 🚩 Denunciar. Normas que lo prohíben. |
| R2 | Avisos falsos o bromas que asustan a la gente | Media / Media | Revisión de los tipos sensibles. «Ya no está» de varias personas lo quita solo. Límite de avisos por código (p. ej., 5 al día). Bloqueo del código. |
| R3 | Insultos, contenido ilegal u ofensivo | Baja / Media | Filtro de palabras → a revisión. Denuncia. Retirada en menos de 24 h. |
| R4 | Alguien saca la base de datos entera | Baja / Media | Reglas de seguridad de Firestore: el público **solo puede leer** avisos publicados y solo los campos públicos; **solo puede crear** avisos con el formato correcto; **no puede** leer códigos, denuncias ni pendientes. Los administradores entran con Firebase Authentication (usuario y contraseña segura, con verificación en dos pasos en la cuenta de Google). |
| R5 | Se pierde el control de la cuenta de Google/Firebase | Baja / Alta | Verificación en dos pasos en las cuentas de Pedro y Sonia. Nadie más tiene acceso. |
| R6 | Un menor de 14 años envía avisos | Media / Baja | Casilla obligatoria «Tengo 14 años o más». No se piden datos que identifiquen. |
| R7 | Se identifica a quien avisa por la hora y el sitio (p. ej., en un pueblo pequeño) | Baja / Baja | No se publica quién lo envía. El código no es público. Se puede mostrar la hora redondeada («hace 2 h»). |
| R8 | Spam masivo con bots | Baja / Media | Límite por código y por tiempo en las reglas. Firebase App Check (comprueba que la petición viene de la app de verdad) si hiciera falta. |

## Medidas técnicas (resumen para Firebase)
- Base de datos en **europe-southwest1 (Madrid)**.
- Colecciones separadas: `avisos` (lo público), `avisos_priv` (código y estado, solo administradores), `denuncias`, `bloqueados`.
- **Reglas de seguridad** que no dejen leer nada privado (se prepararán con la función).
- Borrado automático: una tarea programada (GitHub Actions, gratis) borra cada noche lo caducado hace más de 30 días.
- HTTPS en todo.

## Brechas de seguridad (si pasa algo)
1. Cortar el problema (cambiar contraseñas, cerrar escritura en las reglas).
2. Apuntar qué ha pasado, qué datos, a cuántas personas y qué se ha hecho (aunque no sea grave).
3. Si puede haber riesgo para las personas: **avisar a la AEPD en 72 horas** desde que se sabe (sede.aepd.gob.es → «Notificación de brechas de datos personales»).
4. Si el riesgo es alto: avisar también a los afectados (en la app, con un aviso).
