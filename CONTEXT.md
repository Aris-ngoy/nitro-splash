# Splash

How an app covers its first frame, then gets out of the way once the real interface is ready.

## Language

**Launch screen**:
The still picture the operating system draws before the app can run code. A solid background and a static image.
_Avoid_: splash, storyboard, GIF splash

**Overlay**:
The native full-screen view the library places over the app after the launch screen, until the app removes it.
_Avoid_: splash screen

**Replica**:
The JavaScript view that shows the manifest's picture and is already on screen at the handoff.
_Avoid_: splash component, fake splash, placeholder

**Handoff**:
The moment the overlay is removed with no animation, after the replica has laid out and the pictures it shares with the manifest have loaded. The app may delay that moment, then runs its own animation.
_Avoid_: hide animation, reveal, exit

**Manifest**:
The description of the one picture shared by the launch screen, the overlay, and the replica. A background, an optional dark background, a logo frame (width and height), and an optional brand frame (width, height, and distance from the bottom).
_Avoid_: config, splash options
