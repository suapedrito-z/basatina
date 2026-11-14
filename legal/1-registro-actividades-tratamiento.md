# Registro de actividades de tratamiento (RAT) · BasatiNA

> **Qué es y por qué lo tenemos.** El artículo 30 del RGPD obliga a apuntar qué datos personales tratamos, para qué y cómo los protegemos. Quien tiene menos de 250 trabajadores se libra **salvo** que el tratamiento no sea ocasional, y la comunidad de avisos es continua, así que lo llevamos.
> No se manda a ningún sitio: se guarda y se enseña a la Agencia Española de Protección de Datos (AEPD) solo si lo pide.
> **Revisarlo** cada vez que la app empiece a recoger algo nuevo y, como mínimo, una vez al año.

**Responsable:** Pedro Iglesias Goñi (Son&Pe Technology Systems) · participa@sonpe-technology.es · Navarra (España)
**Delegado de protección de datos:** no hay (no es obligatorio para este proyecto).
**Última revisión:** 14 de noviembre de 2026

---

## Tratamiento 1 · Comunidad de avisos

| Campo | Contenido |
|---|---|
| Finalidad | Recibir, moderar y publicar avisos de la gente (árboles caídos, desprendimientos, lluvia intensa, cebos envenenados, accidentes…); gestionar confirmaciones, denuncias y bloqueos; evitar abusos; informar al autor del estado de su aviso. |
| Base jurídica | Consentimiento al enviar (art. 6.1.a RGPD). Moderación, antiabuso y registro de denuncias: interés legítimo (art. 6.1.f) y cumplimiento del Reglamento de Servicios Digitales (arts. 16 y 17). |
| Personas afectadas | Usuarios de 14 años o más que envían, confirman o denuncian avisos. |
| Datos | Tipo de aviso, texto libre (máx. 300 caracteres), coordenadas del suceso, fecha/hora, código de colaborador aleatorio (seudónimo generado en el móvil). **No** se piden nombre, correo, teléfono ni la ubicación de la persona. |
| Datos especiales | Ninguno a propósito. Si en un texto aparecen datos de terceros o especiales, se borran en la moderación. |
| Destinatarios | Público en general (solo el aviso publicado, sin el código). Encargado: Google Ireland Ltd. (Firebase / Cloud Firestore). |
| Transferencias internacionales | Datos alojados en la región europe-southwest1 (Madrid). Google puede acceder desde fuera de la UE para dar soporte; cubierto por las Cláusulas Contractuales Tipo y el Marco de Privacidad de Datos UE‑EE. UU. incluidos en sus condiciones de tratamiento. |
| Plazos | Visible: 6 h – 7 días según el tipo. Borrado total: 30 días tras caducar. Denuncias y decisiones de moderación: 6 meses. Códigos bloqueados: 12 meses. |
| Seguridad | Ver documento 2. |

## Tratamiento 2 · Fotos de la gente

| Campo | Contenido |
|---|---|
| Finalidad | Recibir, revisar y publicar fotos enviadas por los usuarios en la app, la web y redes sociales. |
| Base jurídica | Consentimiento (casillas del formulario, versión `FO_VER`). |
| Personas afectadas | Usuarios de 14 años o más (o con permiso de su madre, padre o tutor). |
| Datos | Foto (sin metadatos), lugar, alias, comentario, correo (opcional), sitio aproximado (opcional). |
| Destinatarios | Público (foto publicada con alias). Encargados: Cloudinary Ltd. (imágenes) y Web3Forms (envío del aviso por correo). |
| Transferencias internacionales | Posibles (EE. UU.). Revisar que ambos proveedores tengan Cláusulas Contractuales Tipo o el Marco de Privacidad de Datos en sus condiciones. |
| Plazos | Mientras esté publicada o hasta que se pida borrarla. Las no publicadas se borran tras revisarlas. |

## Tratamiento 3 · Buzón de sugerencias

| Campo | Contenido |
|---|---|
| Finalidad | Recibir sugerencias, errores y peticiones (incluidas las de derechos y las de contenido ilegal). |
| Base jurídica | Consentimiento. |
| Datos | Tipo de mensaje y texto libre. Anónimo, salvo que la persona escriba algo que la identifique. |
| Destinatarios | Encargado: Web3Forms → buzón participa@sonpe-technology.es (OVH, Zimbra, UE). |
| Plazos | Se borran una vez atendidos (como máximo, 6 meses). |

## Tratamiento 4 · Peticiones de derechos y de retirada de contenidos

| Campo | Contenido |
|---|---|
| Finalidad | Atender peticiones de acceso, rectificación, supresión, oposición, limitación; avisos de contenido ilegal y reclamaciones por moderación. |
| Base jurídica | Obligación legal (art. 6.1.c RGPD; arts. 15‑22 RGPD; arts. 16‑17 Reglamento de Servicios Digitales). |
| Datos | Los que dé la persona (normalmente su correo, su código de colaborador y lo que pide). |
| Plazos | 3 años desde la respuesta (lo que se puede reclamar ante la AEPD). Guardar en una carpeta aparte del correo. |

---

### Lo que NO tratamos (para que conste)
Diario, diario de dolores, calendario, notas, sitios secretos, ajustes y ubicación: se quedan **solo en el móvil** de cada persona y nunca llegan a nosotros.
