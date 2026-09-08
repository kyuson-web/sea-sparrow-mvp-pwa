# Sea Sparrow Modeling Spec (condensed)

Units: 1 unit = 1 meter. Axes: +Y up, +Z forward (bow), +X starboard.
Ship root pivot at waterline center. Turret pivot at base; gun pitch = child node.
Sockets (empties, forward +Z): Socket_MainGun_A, Socket_VLS_01, Socket_VLS_02,
Socket_CIWS_A, Socket_Decoy_L/R, Socket_Radar_01.

Poly budget (tris): player 25-40k, escort 10-20k, small enemy 6-12k,
cruiser 25-45k, boss 80-120k. LOD1 ~50%, LOD2 ~20%.
Textures: hero 2048, others 1024-2048, trim sheet 2048-4096; KTX2 for release.
Materials per ship <= 4: M_Hull, M_Deck/M_Weapon, M_Glass, M_Emissive.

Naming: FACTION_CATEGORY_NAME_VARIANT_LOD  (SS_/EN_/ENV_/WPN_/FX_)
Export: glTF Binary (.glb), modifiers applied, empties included, no lights/cameras.
Checklist: scale, axes, pivots, naming, budget, UV overlap, material count, sockets, gun direction, loads in Three.js.