# Thomas-bailey-exhibition
An interactive visual portfolio exploring my work in media, sport and creative design.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Home page: opening title card, introduction, background, selected work and the project index. |
| `work.html` | The exhibition: seven full-screen scenes that reveal one another as you scroll. |
| `portfolio-backup.html` | The earlier version of the exhibition, kept as a backup. Nothing links to it. |

## Supporting files

| File | What it does |
| --- | --- |
| `styles.css` | All colours, fonts, spacing and layout for both pages. The colours and sizes are named at the top of the file. |
| `home.js` | Scroll motion on the home page. |
| `work.js` | Scene-to-scene transitions, the scene counter and the previous/next buttons in the exhibition. |
| `favicon.svg` | The TB mark shown in the browser tab. |

## Editing tips

- **Change wording:** open `index.html` or `work.html` and edit the text between the tags.
- **Swap an image:** upload the new image, then change the matching `src="..."` in the HTML.
- **Change a colour:** edit the values under "Design tokens" at the top of `styles.css`.
- **Add a scene to the exhibition:** copy one `<section class="scene ...">` block in `work.html`, then add a matching silhouette and symbol position in `work.js`.

Visitors can switch the motion off with the "Reduce motion" button. The site also respects the reduced-motion setting on their device.
