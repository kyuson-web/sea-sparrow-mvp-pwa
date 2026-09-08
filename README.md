# Sea Sparrow — Full 3D Naval Combat (MVP)

Near-future 3D naval combat prototype. Greybox ships, chase camera, ballistic guns,
homing missiles, simple enemy AI, HUD + minimap. Built with Three.js (WebGL2).

## Run (no build)
    cd SeaSparrow_MVP
    python3 -m http.server 8080      # or: npx serve
    open http://localhost:8080

## Run (vite, optional)
    npm install
    npm run dev

Three.js is loaded from CDN via importmap. For offline use, `npm install three`
and point the importmap in index.html to ./node_modules/three/build/three.module.js.

## Controls
    W / S          throttle ahead / astern
    A / D          rudder
    Mouse          gun aim (raycast on sea)
    Left click / Space   fire main gun
    Tab            cycle target lock
    F              fire homing missile at locked target
    R              restart after mission end

## Structure
    index.html          entry + HUD markup + importmap
    css/style.css       HUD / overlay styling
    src/utils.js        math helpers + wave height field
    src/world.js        ocean, sky, lights, fog
    src/ships.js        greybox ship builder + Ship physics class
    src/combat.js       shells, missiles, particles, explosions
    src/hud.js          HUD + minimap
    src/main.js         game loop, input, AI, win/lose
    docs/               art bible, modeling spec, mvp plan, manifest
    assets/images/      textures, icons, splash, concept art
    assets/models/      future glTF slot (see README inside)
    assets/audio/       future sfx slot (see README inside)

## Images
Placeholder PNGs are generated procedurally by the packer.
Replace them with the design-session concept art using the same filenames:
    concept_sea_sparrow.png, concept_enemy_pact.png,
    icon_512.png, ocean_tile.png, splash_1920x1080.png