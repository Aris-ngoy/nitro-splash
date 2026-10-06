# The overlay and the replica share one manifest frame

The library performs the handoff. The app runs the animation afterward. That handoff is invisible only when the overlay and the replica draw the same picture, so the manifest is that picture for both: background, optional dark background, logo width and height, and an optional brand (width, height, and distance from the bottom). The overlay draws the brand when the manifest has one, and it draws the logo at that width and height rather than as a square. The handoff runs once, after the replica has laid out and those pictures have loaded, and only then does the app's animation start. On Android the replica grows to the overlay's rectangle unless the app says that system bar is translucent. A separate dark logo image is out of this picture; only the background changes in dark mode.

## Considered options

- A JavaScript hook that copies the bootsplash helper while the overlay keeps a square logo and no brand. Rejected because the replica would not match the overlay, so the handoff would flash.
- Removing the overlay as soon as the app says it is ready. Rejected because the logo can still be decoding, and one frame would show the background with no logo.
