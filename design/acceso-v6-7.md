# Diseño de acceso V6.7

**Herramienta:** generación de imágenes integrada (image_gen), edición del concepto aprobado para obtener el fondo. No se usó CLI ni una clave de API del usuario.

**Arte final:** assets/auth-altar.png. El logo original se integra por separado desde assets/burgershot-muertos.webp. Los textos, controles, velas, pétalos, flores de carga y papel picado son HTML/CSS/JavaScript; no están dibujados dentro del fondo.

## Prompt del fondo

Use case: precise-object-edit / background extraction.
The provided image is the approved design concept for a Burger Shot login and loading page. Create the production BACKGROUND ART asset from its nocturnal Día de Muertos / Halloween altar environment, faithfully matching the illustration style, palette, candles, marigolds and atmosphere. Output ONE uninterrupted widescreen background image, preferably 1920x1080 proportions. Remove EVERY interface element: no panels, no borders, no white margin, no logo, no typography, no form, no buttons, no loader, no headings or labels. Do not reproduce the two-panel presentation.

Preserve the illustrated nocturnal altar atmosphere from the upper panel: deep near-black purple sky, warm amber candlelight, dense rich orange cempasúchil blossoms, a decorated sugar skull and a small glowing carved pumpkin along the lower left foreground, a few warm lantern lights, very subtle distant silhouettes of palms and the nighttime restaurant environment. Beautiful detailed atmospheric digital illustration, not a generic flat vector.
Compose the altar decoration mostly in the leftmost 50% and bottom 20% of the frame. Keep the upper-left quadrant and middle-right 45% dark, calm and clear so the real HTML heading, brand and login card can be overlaid legibly. On the lower right, a small warm lantern and a little marigold decoration can sit near the bottom edge. NO papel picado across the top, no airborne petals, no visible candle flame tips: those will be separate live animated CSS layers. Keep the candle wax bodies and soft surrounding glow, with candle wicks visible so CSS flames can be added. Do not bake browser UI or branding into the artwork. No text anywhere, no watermark, no people, no gore. This file is a reusable decorative landscape backdrop, consistent with the approved concept.

## Integración

El fondo conserva su composición al escalarse con cover. Las llamas se colocan en los puntos de las mechas según el recorte. En móvil se apilan marca y formulario, con campos de 16 px. La carga usa el mismo ambiente y el archivo original del logo, con un aro de flores que gira.
