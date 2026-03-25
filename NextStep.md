# Project Handoff: 3D Topology CAD Editor

## 🚨 Current State & Immediate Crisis
We are building a professional-grade 3D pipe topology editor in React Three Fiber (R3F) for manipulating industrial Piping Component File (PCF) data.

**The Current Failure:** The UI layers, toolbar, and icons have been successfully rendered, but **none of the interactive canvas tools are functioning correctly**. When a user clicks an icon (like "Connect", "Break", "Insert Support"), the canvas modes fail to intercept clicks properly, raycasting does not correctly translate to actions, or state synchronization is silently failing.

Your immediate mission is to **make the existing tools functional** and then **expand the feature set** to make this a true CAD experience.

---

## 📐 Architecture Context (The Dual-State Contract)
This is the most critical rule of the application. Do not violate it.

1. **React Context (`AppContext.jsx`)**: The ultimate source of truth (`stage2Data`). This is what gets exported to PCF files. Mutations here trigger heavy React re-renders.
2. **Zustand Store (`useStore.js`)**: The fast, transient 3D canvas state (`dataTable`, `canvasMode`, `multiSelectedIds`, `hiddenElementIds`).
3. **The Rule**: Every geometric mutation (Break, Connect, Gap Fix) must be calculated purely (e.g., in `GapFixEngine.js`), then synchronously dispatched to **both** stores. If you update `useStore` but not `AppContext`, the 3D view changes but the exported file is wrong. If you update `AppContext` but not `useStore`, the 3D view lags or desyncs.

---

## 🛠️ Required Fixes & Elaborate Technical Requirements

### 1. Fix the Core Tool Interactions
The toolbar sets a `canvasMode` in Zustand (`'VIEW' | 'CONNECT' | 'BREAK' | 'INSERT_SUPPORT' | 'MEASURE' | 'MARQUEE_SELECT' | 'MARQUEE_ZOOM'`).

However, clicks on the `InstancedPipes`, `ImmutableComponents`, or `EndpointSnapLayer` are currently dropping events, failing to capture `e.point`, or failing to trigger the corresponding dispatch.

**Your Task:**
- **Audit `CanvasTab.jsx`**: Check the `onPointerDown`, `onPointerMove`, and `onPointerUp` handlers on all meshes. Ensure `e.stopPropagation()` is used correctly so background planes don't swallow clicks meant for pipes.
- **Fix the Raycaster**: Ensure tools that require world coordinates (Measure, Break, Insert) correctly extract `e.point` from the R3F event and map it to the math functions in `GapFixEngine.js`.
- **Global Snap Layer**: The `EndpointSnapLayer.jsx` currently renders spheres at endpoints (`ep1`, `ep2`) and midpoints. Ensure that when a user clicks in *any* editing mode, if they click a snap sphere, the coordinate is strictly inherited from that sphere's `userData.snapPos`, overriding the raw raycast `e.point`.

### 2. UI Layout & Logging Standardization
- **The Layout:** The UI currently features a `CanvasToolbar` on the top right, a `SideInspector` on the left, a `SceneHealthHUD` top-center, and a `LogDrawer` at the bottom.
- **The LogDrawer (▼ 3D TOPO LOG):** Ensure every single action (Select, Connect, Break, Delete, Hide, Error) dispatches an `ADD_LOG` event to `AppContext`. The logs must strictly follow the format:
  - `type`: `ERROR`, `WARNING`, `INFO`, `APPLIED/FIX` (Colored accordingly: Red, Yellow, Slate, Green `#00ff88`).
  - `stage`: E.g., `[CONNECT]`, `[GAP_FIX_6MM]`, `[BREAK]`, `[SYS]`. Fixed width, monospace.
  - `message`: Clear, engineering-focused descriptions (e.g., `Inserted Pipe between Row 4 & 5 (20.0mm gap).`).
- **Feedback:** If a user clicks "Fix 6mm" and no gaps are found, the system *must* log `INFO | [GAP_FIX_6MM] | No gaps ≤ 6mm found.` so the user knows the button actually worked.

### 3. Feature Enhancements (What you must build next)

#### A. The "Connect" Bridge
When using the "Connect" tool to join two endpoints:
- Do not just snap the coordinates together if the distance is > 0.
- Synthesize a **new** `PIPE` element bridging `targetA` and `targetB`.
- The new pipe must inherit the attributes of the source element.
- The `pipelineRef` of the new pipe must be: `${sourceElement.pipelineRef}_3DTopoBridge`.

#### B. Smart Suffix Tracking (Lineage)
Engineers need to know which elements were created by the AI Editor versus the original survey file.
- **Insert Support:** When a support is added, its `pipelineRef` must be `${sourcePipe.pipelineRef}_3DTopoSupport`.
- **Fix 25mm Gap:** When the auto-fixer inserts a pipe, its `pipelineRef` must be `${upstreamElement.pipelineRef}_3DTopoBridge_25mmfix`.
- **Break Pipe:** When a pipe is split into two, `rowA` gets suffix `_1`, and `rowB` gets suffix `_2`.

#### C. Visual Upgrades
- **Toggle Spool Color (CA Heatmap):** The `CanvasToolbar` currently has a dropdown to color by `CA1...CA10`. Ensure `InstancedPipes`, `DraggableComponents`, and `ImmutableComponents` correctly read `colorByCA` from `useStore` and apply a deterministic hash-based hex color. *Requirement: Add a floating legend showing the unique CA values present on screen and their corresponding colors.*
- **Gap Radar:** When enabled, gaps should render with a prominent pulsing or semi-transparent red/orange sphere so they are easily spotted from a zoomed-out view. Ensure `depthTest={false}` is applied to the gap text and spheres so they render *through* pipes.

### 4. Code Quality & Performance
- **Zero-Trust Coordinates:** Always `parseFloat()` before doing math.
- **DOM Event Leaks:** Ensure `window.addEventListener` or `gl.domElement.addEventListener` inside `useEffect` blocks always return a cleanup function. We are seeing WebGL context drops because of memory bloat.
- **O(n²) Traversal Limits:** If you build Spool detection or Gap detection, hard-cap the iterations at `100,000` to prevent infinite loops from crashing the browser tab.

---

## 🎯 Definition of Done for Your Run
1. All toolbar buttons actively change modes without errors.
2. Clicking a pipe in 'Break' mode successfully splits it, updates the Table, and logs it.
3. Dragging an EP in 'Connect' mode successfully draws a new bridging pipe and logs it.
4. The `LogDrawer` correctly expands, colors, and formats all engine feedback.
5. The dual-state contract remains completely intact.

## 🚀 Advanced Feature Roadmap (Future Enhancements)
Once the core CAD tools and logging are stabilized, consider implementing these advanced features to elevate the application to industry-leading standards:

### 1. Advanced Topological Validation & Auto-Correction
- **Slope & Gravity Detection:** Automatically highlight pipes that violate minimum slope requirements (e.g., 1:100 fall for drainage lines) using a color-coded heatmap layer.
- **Clash Detection:** Implement an efficient spatial hash or Octree to detect intersecting geometries (e.g., pipes passing through steel structural members or other pipes) and flag them with a "Clash" severity in the LogDrawer.
- **Flange Face-to-Face Validation:** Automatically detect missing gaskets or bolts between connected flanges, or flag when two flanges of differing ratings/sizes are incorrectly mated.

### 2. High-Precision Editing Tools
- **Parametric Pipe Bending:** Instead of just breaking pipes, allow users to select an intersection point (e.g., a 90-degree corner) and automatically generate a `BEND` or `ELBOW` component with the correct radius based on the pipe's bore size.
- **Multi-Element Move/Rotate:** Enhance the `DraggableComponents` to allow moving an entire selected spool (a connected run of pipes and fittings) as a single rigid body, snapping it to new connection points.
- **Ortho-Routing Mode:** When inserting new bridging pipes, force the routing to follow orthogonal axes (X, Y, Z) to generate clean, constructible pipe runs instead of diagonal point-to-point lines.

### 3. UI/UX & Visualization Upgrades
- **Section Box / Clipping Planes:** Allow users to slice through complex 3D models using interactive clipping planes (similar to Navisworks) to inspect dense interior piping without hiding individual elements.
- **BOM (Bill of Materials) Generation:** Add a panel that dynamically calculates and exports the total length of pipes by size, and counts of valves, flanges, and supports currently visible in the scene.
- **Annotation & Redlining:** Implement a layer that lets engineers drop 3D text notes, arrows, or warning spheres into the model that persist into the exported PCF or project file for team review.

### 4. Performance & Export Capabilities
- **Geometry Instancing Upgrades:** While pipes are instanced, complex fittings (Valves, Tees) are rendered individually. Migrate all repetitive components to `InstancedMesh` for models exceeding 50,000 components.
- **PCF Export Fidelity:** Ensure that every geometric edit, split, and connection faithfully translates back into valid PCF syntax, preserving ISOGEN attributes (SKEY, Spool identifiers, Item Codes) so the file remains usable in AVEVA or SmartPlant.
