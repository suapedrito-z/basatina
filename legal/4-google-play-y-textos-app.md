# Google Play y textos que irán dentro de la app

## A. Lo que exige Google Play a las apps con contenido de los usuarios
Google Play llama a esto «contenido generado por usuarios» (UGC). Si falta algo de esta lista, **rechazan la actualización**. La comunidad se programará con todo esto:

| Requisito de Google | Cómo lo cumple BasatiNA |
|---|---|
| Aceptar unas condiciones antes de publicar | Casilla obligatoria «He leído y acepto las Normas de la comunidad» antes del primer aviso. |
| Condiciones que definan lo que está prohibido | `docs/normas-comunidad.html`, punto 4. |
| Moderación continua | Revisión diaria por los administradores (documento 3) + filtro automático. |
| Botón para **denunciar contenido** dentro de la app | 🚩 «Denunciar» en cada aviso, bien visible. |
| Botón para **bloquear usuarios** dentro de la app | 🙈 «Ocultar avisos de este colaborador» en cada aviso, separado del de denunciar (Google pide que sean dos funciones distintas y claras). |
| Actuar sobre las denuncias | Revisión en 24 h y bloqueo de códigos reincidentes. |

**Consejo:** cuando se suba la versión con la comunidad, en las notas para el revisor de Google poned dónde están las dos funciones: «Comunidad → cualquier aviso → 🚩 Denunciar / 🙈 Ocultar avisos de este colaborador».

## B. Formulario «Seguridad de los datos» de Google Play Console
Hay que **actualizarlo** cuando salga la comunidad (Play Console → Contenido de la app → Seguridad de los datos):

- **¿Recoge o comparte datos?** Sí, recoge.
- **Ubicación → Ubicación aproximada:** Sí (el punto del aviso, redondeado a ~10 m). *Recogida*, no compartida. Finalidad: **Funcionalidad de la app**. **Opcional** (solo si envías un aviso).
- **Mensajes → Otro contenido generado por el usuario:** Sí (texto del aviso). Recogida. Finalidad: Funcionalidad de la app. Opcional.
- **Identificadores de dispositivo u otros:** Sí (código de colaborador aleatorio). Recogida. Finalidad: **Funcionalidad de la app** y **Prevención de fraude, seguridad y cumplimiento**. Opcional.
- **Fotos y vídeos:** Sí (solo las fotos que se envían para publicar). Recogida. Funcionalidad. Opcional.
- **¿Datos cifrados en tránsito?** Sí.
- **¿Se puede pedir que se borren?** Sí (correo a participa@).
- **Enlace a la política de privacidad:** https://basatina.es/privacidad.html

## C. Textos para la pantalla de enviar aviso (primera capa de información)
La ley pide informar **en el momento** de recoger los datos, de forma breve, con un enlace al resto. Este texto va justo encima del botón «Enviar»:

> ℹ️ **Tu aviso es anónimo.** Se guarda en Google Firebase (Madrid) para revisarlo y publicarlo. Lo verá cualquiera que use BasatiNA (sin saber quién lo envía). Desaparece solo y se borra del todo a los 30 días. Puedes pedir que lo borremos cuando quieras. [Más información](privacidad.html#comunidad)

**Casillas obligatorias (las dos):**
- ☐ Tengo **14 años o más**.
- ☐ He leído y acepto las [Normas de la comunidad](normas-comunidad.html). Mi aviso no incluye nombres, matrículas ni datos de otras personas.

**Aviso fijo en rojo en la pantalla de enviar:**
> 🚨 Si hay heridos o peligro, **llama primero al 112**. Esto no es un servicio de emergencias.

## D. Cosas que tenéis que hacer vosotros (yo no puedo)
1. **Crear el proyecto de Firebase** con vuestra cuenta de Google y elegir la región **europe-southwest1 (Madrid)** para Firestore. *(La región no se puede cambiar después.)* Os guío paso a paso cuando os pongáis.
2. **Aceptar las condiciones de tratamiento de datos de Firebase/Google Cloud** en la consola (Configuración del proyecto → Privacidad). Es el «contrato de encargado» que exige el RGPD (art. 28).
3. Activar la **verificación en dos pasos** en vuestras cuentas de Google.
4. Revisar que Cloudinary y Web3Forms tengan sus condiciones de protección de datos (DPA) aceptadas, por las fotos y el buzón.
5. **Confirmar quién es el responsable** (ver la nota de abajo).

## E. Notas que conviene confirmar
- **Responsable del tratamiento.** He puesto a **Pedro Iglesias Goñi**, porque la marca y el dominio no son una empresa: el RGPD exige poner el nombre de una persona o entidad. Si queréis que figure también Sonia (como **corresponsables**), hay que añadir su nombre completo en `docs/privacidad.html`, `docs/aviso-legal.html` y en el documento 1.
- **NIF y domicilio en el aviso legal.** La ley de servicios de internet (LSSI, art. 10) los pide a quien presta servicios como actividad económica. Al ser un proyecto sin ánimo de lucro y sin ingresos, es discutible que os obligue, y por eso no los he puesto (protege vuestra intimidad). Si algún día hay ingresos, publicidad o una asociación, habría que añadirlos.
- No soy abogado. Esto está preparado con cuidado y siguiendo la normativa y las guías de la AEPD, pero si queréis tranquilidad total, la **AEPD atiende consultas gratis** (aepd.es → Atención a la ciudadanía) y su herramienta gratuita **Facilita RGPD** os puede servir para comprobarlo.
