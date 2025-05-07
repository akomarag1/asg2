let canvas, gl;
let a_Position, u_ModelMatrix, u_FragColor, u_GlobalViewProjection, u_GlobalRotation;
let u_LightDirection;

let g_cameraAngleX = 0, g_cameraAngleY = 0;
let isDragging = false, lastMouseX = 0, lastMouseY = 0;
let g_globalRotation = 0, g_cameraZ = 10;
let g_seconds = 0;

let g_headTilt = 0;
let g_tailTilt = 0;

let g_isRunning = false;
let g_runTime   = 0;

function main() {
  canvas = document.getElementById('webgl');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  gl = canvas.getContext('webgl');
  if (!gl) { console.log('Failed to get WebGL context.'); return; }
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.'); return;
  }

  a_Position             = gl.getAttribLocation(gl.program, 'a_Position');
  u_ModelMatrix          = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_FragColor            = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_GlobalViewProjection = gl.getUniformLocation(gl.program, 'u_GlobalViewProjection');
  u_GlobalRotation       = gl.getUniformLocation(gl.program, 'u_GlobalRotation');
  u_LightDirection       = gl.getUniformLocation(gl.program, 'u_LightDirection');

  // lighting
  gl.uniform3f(u_LightDirection, 0.5, 1.0, 0.7);

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0,0,0,1);

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  canvas.onmousedown = e => {
    // toggle run on shift click or right click
    if (e.shiftKey || e.button === 2) {
      g_isRunning = !g_isRunning;
      if (g_isRunning) g_runTime = 0; // restart run cycle
      return;
    }
    isDragging = true;
    lastMouseX = e.clientX; lastMouseY = e.clientY;
  };
  canvas.onmouseup = () => { isDragging = false; };
  canvas.onmousemove = e => {
    if (!isDragging) return;
    let dx = e.clientX - lastMouseX, dy = e.clientY - lastMouseY;
    g_cameraAngleY += dx * 0.5;
    g_cameraAngleX += dy * 0.5;
    g_cameraAngleX = Math.max(-89, Math.min(89, g_cameraAngleX));
    lastMouseX = e.clientX; lastMouseY = e.clientY;
    renderAll();
  };

  // zoom wheel
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    g_cameraZ += e.deltaY * 0.01;
    g_cameraZ = Math.max(3, Math.min(30, g_cameraZ));
    renderAll();
  });

  window.addEventListener('resize', () => {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    renderAll();
  });

  document.getElementById('headSlider').addEventListener('input', e => {
    g_headTilt = parseFloat(e.target.value);
  });
  document.getElementById('tailSlider').addEventListener('input', e => {
    g_tailTilt = parseFloat(e.target.value);
  });

  // kick off animation
  tick();
}

// animation loop
function tick() {
  if (g_isRunning) {
    g_runTime += 0.016;
  }
  g_seconds += 0.016;
  renderAll();
  requestAnimationFrame(tick);
}

function renderAll() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const viewProjMatrix = new Matrix4();
  viewProjMatrix.setPerspective(60, canvas.width/canvas.height, 1, 100);

  // orbit camera
  const viewMatrix = new Matrix4();
  viewMatrix.setLookAt(0,0,g_cameraZ,   0,0,0,   0,1,0);
  viewMatrix.rotate(g_cameraAngleX, 1,0,0);
  viewMatrix.rotate(g_cameraAngleY, 0,1,0);

  viewProjMatrix.multiply(viewMatrix);
  gl.uniformMatrix4fv(u_GlobalViewProjection, false, viewProjMatrix.elements);

  const GLOBAL_SCALE = 1.5;

  const globalRotationMatrix = new Matrix4()
    .scale(GLOBAL_SCALE, GLOBAL_SCALE, GLOBAL_SCALE)
    .rotate(g_globalRotation, 0, 1, 0)
    .translate(0, -1.0, 1.5);

  gl.uniformMatrix4fv(u_GlobalRotation, false, globalRotationMatrix.elements);

  const headBase = new Matrix4(globalRotationMatrix)
    .translate(0, 2.0, 0.4)
    .scale(0.5,0.5,0.5);

  let skullMatrix = new Matrix4(headBase);
  if (g_isRunning) {
    const bob = Math.sin(g_runTime * 15) * 1.1;
    skullMatrix.rotate(bob, 1,0,0);
  } else {
    const sway = Math.sin(g_seconds * 1.5) * 10;
    skullMatrix.rotate(sway, 0,0,1);
  }
  skullMatrix.rotate(g_headTilt, 0,0,1);

  renderHead(skullMatrix, headBase);
}

function renderHead(animatedMatrix, baseMatrix) {
  const baseColor = [0.9,0.65,0.2,1], black = [0.05,0.05,0.05,1], cream = [1.0,0.96,0.85,1];

  // skull
  const skull = new Cube();
  skull.color  = baseColor;
  skull.matrix = new Matrix4(animatedMatrix)
    .translate(-0.45,0,-5.0)
    .scale(1.0,1.0,1.0);
  skull.render();

  // ears
  for (let x of [-0.12,0.78]) {
    const ear = new Cube();
    ear.color  = [0.9,0.59,0.2,1];
    ear.matrix = new Matrix4(skull.matrix)
      .translate(x,0.9,0.3)
      .scale(0.35,0.27,0.2);
    ear.render();
  }

  // eyes & pupils
  for (let x of [0.2,0.6]) {
    const eye = new Cube();
    eye.color  = [0.55,0.3,0.05,1];
    eye.matrix = new Matrix4(skull.matrix)
      .translate(x+0.025,0.6,1.01)
      .scale(0.15,0.1,0.05);
    eye.render();
    const pupil = new Cube();
    pupil.color  = [0,0,0,1];
    pupil.matrix = new Matrix4(skull.matrix)
      .translate(x+0.085,0.66,1.06)
      .scale(0.025,0.04,0.01);
    pupil.render();
  }

  // snout slope
  const snoutSlope = new Cube();
  snoutSlope.color  = baseColor;
  snoutSlope.matrix = new Matrix4(skull.matrix)
    .translate(0.35,0.5,0.9)
    .rotate(37,1,0,0)
    .scale(0.3,0.1,0.3);
  snoutSlope.render();

  // malar stripes
  const tearCoords = [
    {x:0.20,y:0.70,z:1.02,sx:0.12,sy:0.05},
    {x:0.17,y:0.50,z:1.02,sx:0.05,sy:0.2},
    {x:0.2, y:0.3, z:1.02,sx:0.08,sy:0.2},
    {x:0.68,y:0.70,z:1.02,sx:0.12,sy:0.05},
    {x:0.78,y:0.50,z:1.02,sx:0.05,sy:0.2},
    {x:0.72,y:0.3, z:1.02,sx:0.08,sy:0.2}
  ];
  for (let s of tearCoords) {
    const stripe = new Cube();
    stripe.color  = black;
    stripe.matrix = new Matrix4(skull.matrix)
      .translate(s.x,s.y,s.z)
      .scale(s.sx,s.sy,0.05);
    stripe.render();
  }

  // snout block
  const snout = new Cube();
  snout.color  = cream;
  snout.matrix = new Matrix4(skull.matrix)
    .translate(0.3,0.15,0.9)
    .scale(0.4,0.25,0.3);
  snout.render();

  // nose
  const nose = new Cube();
  nose.color  = black;
  nose.matrix = new Matrix4(skull.matrix)
    .translate(0.42,0.27,1.15)
    .scale(0.15,0.1,0.1);
  nose.render();

  // mouth
  const mg = new Matrix4(snout.matrix).translate(0.47,0.2,1);
  let m = new Cube();
  m.color  = black;
  m.matrix = new Matrix4(mg).scale(0.03,0.12,0.01);
  m.render();
  m = new Cube();
  m.color  = black;
  m.matrix = new Matrix4(mg)
    .translate(-0.1,-0.08,0)
    .rotate(25,0,0,1)
    .scale(0.1,0.04,0.01);
  m.render();
  m = new Cube();
  m.color  = black;
  m.matrix = new Matrix4(mg)
    .translate(0.04,-0.05,0)
    .rotate(-25,0,0,1)
    .scale(0.1,0.04,0.01);
  m.render();

  // torso & limbs
  const torsoBaseMatrix = new Matrix4(baseMatrix)
    .translate(0.05,0.1,-6)
    .rotate(90,1,0,0);
  renderTorso(torsoBaseMatrix);
}

function renderTorso(parentMatrix) {
  const baseColor   = [0.9,0.67,0.2,1];
  const torsoMatrix = new Matrix4(parentMatrix);

  // torso tilt up down when running
  if (g_isRunning) {
    const torsoTilt = Math.sin(g_runTime * 10) * 5;
    torsoMatrix.rotate(torsoTilt, 1,0,0);
  }

  // main torso
  const torsoBase = new Cube();
  torsoBase.color  = baseColor;
  torsoBase.matrix = new Matrix4(torsoMatrix)
    .translate(-0.6,-1.5,-0.5)
    .scale(1.2,2.0,1.0);
  torsoBase.render();

  // chest
  const chest = new Cube();
  chest.color  = baseColor;
  chest.matrix = new Matrix4(torsoMatrix)
    .translate(-0.7,0.4,-0.55)
    .scale(1.4,0.6,1.1);
  chest.render();

  // belly
  const belly = new Cube();
  belly.color  = baseColor;
  belly.matrix = new Matrix4(torsoMatrix)
    .translate(-0.5,-2.0,-0.4)
    .scale(1.0,0.5,0.9);
  belly.render();

  // shoulders
  let sL = new Cube(), sR = new Cube();
  sL.color = sR.color = baseColor;
  sL.matrix= new Matrix4(torsoMatrix).translate(-1,0.3,-0.5).scale(0.4,0.6,1);
  sR.matrix= new Matrix4(torsoMatrix).translate( 0.6,0.3,-0.5).scale(0.4,0.6,1);
  sL.render(); sR.render();

  renderFrontLegs(torsoMatrix);
  renderBackLegs(torsoMatrix);
  renderTail(torsoMatrix);
}

function renderFrontLegs(parentMatrix) {
  const darkBrown = [0.25,0.15,0.05,1], baseColor = [0.9,0.68,0.2,1];
  const xOffsets  = [-1.05,0.8], upLen = 0.8, loLen = 0.6;
  const freq      = 10, ua = 40, la = 60;
  const frontPhaseOffset = 0;

  for (let i=0; i<xOffsets.length; i++) {
    const x     = xOffsets[i];
    const phase = g_runTime*freq + (i===0?0:Math.PI) + frontPhaseOffset;
    const upperAng = g_isRunning ? Math.sin(phase)*ua : 0;
    const lowerAng = g_isRunning ? Math.sin(phase + Math.PI/2)*la : 0;

    // leg base
    const legBase = new Matrix4(parentMatrix)
      .translate(x,0.1,0)
      .rotate(-90,1,0,0);

    // upper leg
    const upperM = new Matrix4(legBase)
      .rotate(upperAng,1,0,0)
      .translate(0,-upLen,0)
      .scale(0.25,upLen,0.25);
    const upperLeg = new Cube();
    upperLeg.color  = baseColor;
    upperLeg.matrix = upperM;
    upperLeg.render();

    // lower leg
    const lowerM = new Matrix4(legBase)
      .rotate(upperAng,1,0,0)
      .translate(0,-upLen,0)
      .rotate(lowerAng,1,0,0)
      .translate(0,-loLen,0)
      .scale(0.2,loLen,0.2);
    const lowerLeg = new Cube();
    lowerLeg.color  = baseColor;
    lowerLeg.matrix = lowerM;
    lowerLeg.render();

    // paw
    const pawM = new Matrix4(legBase)
      .rotate(upperAng,1,0,0)
      .translate(0,-upLen,0)
      .rotate(lowerAng,1,0,0)
      .translate(0,-loLen-0.15,-0.05)
      .scale(0.35,0.15,0.4);
    const paw = new Cube();
    paw.color  = darkBrown;
    paw.matrix = pawM;
    paw.render();
  }
}

function renderBackLegs(parentMatrix) {
  const darkBrown = [0.25,0.15,0.05,1], baseColor = [0.9,0.68,0.2,1];
  const xOffsets  = [-0.7,0.7], upLen = 0.8, loLen = 0.6, hipY=-1.2;
  const freq      = 10, ua = 40, la = 60;
  const backPhaseOffset = Math.PI * 0.5;

  for (let i=0; i<xOffsets.length; i++) {
    const x     = xOffsets[i];
    const phase = g_runTime*freq + (i===0?0:Math.PI) + backPhaseOffset;
    const upperAng = g_isRunning ? Math.sin(phase)*ua : 0;
    const lowerAng = g_isRunning ? Math.sin(phase + Math.PI/2)*la : 0;

    // leg base
    const legBase = new Matrix4(parentMatrix)
      .translate(x-0.125, hipY,0)
      .rotate(-90,1,0,0);

    // upper leg
    const upperM = new Matrix4(legBase)
      .rotate(upperAng,1,0,0)
      .translate(0,-upLen,0)
      .scale(0.25,upLen,0.25);
    const upperLeg = new Cube();
    upperLeg.color  = baseColor;
    upperLeg.matrix = upperM;
    upperLeg.render();

    // lower leg
    const lowerM = new Matrix4(legBase)
      .rotate(upperAng,1,0,0)
      .translate(0,-upLen,0)
      .rotate(lowerAng,1,0,0)
      .translate(0,-loLen,0)
      .scale(0.2,loLen,0.2);
    const lowerLeg = new Cube();
    lowerLeg.color  = baseColor;
    lowerLeg.matrix = lowerM;
    lowerLeg.render();

    // paw
    const pawM = new Matrix4(legBase)
      .rotate(upperAng,1,0,0)
      .translate(0,-upLen,0)
      .rotate(lowerAng,1,0,0)
      .translate(0,-loLen-0.15,-0.05)
      .scale(0.35,0.15,0.4);
    const paw = new Cube();
    paw.color  = darkBrown;
    paw.matrix = pawM;
    paw.render();
  }
}

function renderTail(parentMatrix) {
  const baseColor     = [0.9,0.69,0.2,1];
  const creamTipColor = [1.0,0.98,0.9,1];
  const segments = [
    {h:0.4, s:0.3, rot:-8},
    {h:0.35,s:0.25,rot:-6},
    {h:0.3, s:0.2, rot:-4},
    {h:0.28,s:0.18,rot:10},
    {h:0.25,s:0.2, rot:18}
  ];

  let tailM = new Matrix4(parentMatrix)
    .translate(-0.15,-2.25,-0.2)
    .rotate(g_tailTilt, 1,0,0);
  const sway = Math.sin(g_seconds * 2) * 15;
  tailM.rotate(-20 + sway, 1,0,0);

  const gap = 0.15;
  for (let i=0; i<segments.length; i++) {
    const seg = segments[i];
    const cube = new Cube();
    cube.color  = (i===segments.length-1 ? creamTipColor : baseColor);
    cube.matrix = new Matrix4(tailM).scale(seg.s,seg.h,seg.s);
    cube.render();

    if (i < segments.length - 1) {
      const next = segments[i+1], midH = (seg.h + next.h)/2;
      const bridge = new Cube();
      bridge.color  = baseColor;
      bridge.matrix = new Matrix4(tailM)
        .translate(0, -(midH/2 + gap/2), 0)
        .scale(0.15, midH + gap, 0.15);
      bridge.render();

      tailM.translate(-0.075, -(midH + gap), 0)
           .rotate(next.rot, 1,0,0);
    }
  }
}
