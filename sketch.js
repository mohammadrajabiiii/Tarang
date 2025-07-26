let canvas;
let isPlaying = false;
let playAxis = 'x';
let playAngle = 0;

let faceTextures = {
  front: null,
  back: null,
  left: null,
  right: null,
  top: null,
  bottom: null,
};

function preload() {
  // No images to preload yet
}

function setup() {
  let uiWidth = 320; // match .ui width
  canvas = createCanvas(windowWidth - uiWidth, windowHeight, WEBGL);
  canvas.parent("canvas-container");
  canvas.parent("canvas-container");
  canvas.style('z-index', '-1');
  noStroke();
  noLights();
}

function draw() {
  background(0);
  ortho(-400, 400, -400, 400, -1000, 1000);
  translate((width + 200) / 2 - width / 2, -200, 0);

  let angleX = parseFloat(document.getElementById("x").value);
  let angleY = parseFloat(document.getElementById("y").value);
  let angleZ = parseFloat(document.getElementById("z").value);
  let size = parseFloat(document.getElementById("scale").value);
  let depth = parseFloat(document.getElementById("depth").value);
  let spacing = parseFloat(document.getElementById("spacing").value);
  let cols = parseInt(document.getElementById("cols").value);
  let rows = parseInt(document.getElementById("rows").value);

  if (isPlaying) {
    playAngle += 0.01;
    if (playAxis === 'x') angleX = playAngle;
    if (playAxis === 'y') angleY = playAngle;
    if (playAxis === 'z') angleZ = playAngle;
  }

  let startX = -((cols - 1) * spacing) / 2;
  let startY = -((rows - 1) * spacing) / 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      push();
      translate(startX + c * spacing, startY + r * spacing, 0);
      rotateX(angleX);
      rotateY(angleY);
      rotateZ(angleZ);

      const faceData = {
        front: getFaceData("frontColor", "front"),
        back: getFaceData("backColor", "back"),
        left: getFaceData("leftColor", "left"),
        right: getFaceData("rightColor", "right"),
        top: getFaceData("topColor", "top"),
        bottom: getFaceData("bottomColor", "bottom"),
      };

      drawCube(size, size * (depth / 150), faceData);
      pop();
    }
  }
}

function getFaceData(id, face) {
  const val = document.getElementById(id).value;
  if (val === "image" && faceTextures[face]) {
    return { isTexture: true, tex: faceTextures[face] };
  } else {
    return { isTexture: false, col: color(val) };
  }
}

function drawCube(size, depth, faceData) {
  let h = size / 2;
  let d = depth / 2;

  drawFace([-h, -h, d], [h, -h, d], [h, h, d], [-h, h, d], faceData.front);
  drawFace([h, -h, -d], [-h, -h, -d], [-h, h, -d], [h, h, -d], faceData.back);
  drawFace([h, -h, d], [h, -h, -d], [h, h, -d], [h, h, d], faceData.right);
  drawFace([-h, -h, -d], [-h, -h, d], [-h, h, d], [-h, h, -d], faceData.left);
  drawFace([-h, -h, -d], [h, -h, -d], [h, -h, d], [-h, -h, d], faceData.top);
  drawFace([-h, h, d], [h, h, d], [h, h, -d], [-h, h, -d], faceData.bottom);
}

function drawFace(v1, v2, v3, v4, face) {
  if (face.isTexture && face.tex) {
    textureMode(NORMAL);
    texture(face.tex);
    beginShape();
    vertex(...v1, 0, 0);
    vertex(...v2, 1, 0);
    vertex(...v3, 1, 1);
    vertex(...v4, 0, 1);
    endShape(CLOSE);
  } else if (!face.isTexture && face.col) {
    noStroke();
    fill(face.col);
    beginShape();
    vertex(...v1);
    vertex(...v2);
    vertex(...v3);
    vertex(...v4);
    endShape(CLOSE);
  }
}

function handleFaceChange(select, face) {
  if (select.value === "image") {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        loadImage(URL.createObjectURL(file), img => {
          img.resize(512, 512);
          faceTextures[face] = img;
        });
      }
    };
    input.click();
  }
}

function resetSlider(id) {
  const slider = document.getElementById(id);
  if (!slider) return;
  if (id === "depth") slider.value = 150;
  else if (id === "scale") slider.value = 150;
  else if (id === "spacing") slider.value = 200;
  else slider.value = 0;
}

function togglePlay() {
  isPlaying = !isPlaying;
  document.getElementById("playToggle").innerText = isPlaying ? "Stop" : "Play";
  if (isPlaying) playAngle = parseFloat(document.getElementById(playAxis).value);
  else document.getElementById(playAxis).value = playAngle;
}

function setAxis(axis) {
  playAxis = axis;
  document.querySelectorAll(".axis-btn").forEach(btn => btn.classList.remove("active-axis"));
  document.getElementById("axis" + axis.toUpperCase()).classList.add("active-axis");
  if (isPlaying) playAngle = parseFloat(document.getElementById(playAxis).value);
}

function exportPNG() {
  const exportSize = 2400;
  let pg = createGraphics(exportSize, exportSize, WEBGL);
  pg.pixelDensity(1);
  pg.clear();
  pg.noStroke();
  pg.ortho(-600, 600, -600, 600, -3000, 3000);

  let angleX = parseFloat(document.getElementById("x").value);
  let angleY = parseFloat(document.getElementById("y").value);
  let angleZ = parseFloat(document.getElementById("z").value);
  let size = parseFloat(document.getElementById("scale").value);
  let depth = parseFloat(document.getElementById("depth").value);

  pg.push();
  pg.rotateX(angleX);
  pg.rotateY(angleY);
  pg.rotateZ(angleZ);

  const faceData = {
    front: getFaceData("frontColor", "front"),
    back: getFaceData("backColor", "back"),
    left: getFaceData("leftColor", "left"),
    right: getFaceData("rightColor", "right"),
    top: getFaceData("topColor", "top"),
    bottom: getFaceData("bottomColor", "bottom"),
  };

  drawCubeWithGraphics(pg, size * 3.3, size * (depth / 150) * 3.3, faceData);

  pg.pop();
  pg.save("tarang-cube.png");
}

function drawCubeWithGraphics(pg, size, depth, faceData) {
  let h = size / 2;
  let d = depth / 2;

  drawFacePG(pg, [-h, -h, d], [h, -h, d], [h, h, d], [-h, h, d], faceData.front);
  drawFacePG(pg, [h, -h, -d], [-h, -h, -d], [-h, h, -d], [h, h, -d], faceData.back);
  drawFacePG(pg, [h, -h, d], [h, -h, -d], [h, h, -d], [h, h, d], faceData.right);
  drawFacePG(pg, [-h, -h, -d], [-h, -h, d], [-h, h, d], [-h, h, -d], faceData.left);
  drawFacePG(pg, [-h, -h, -d], [h, -h, -d], [h, -h, d], [-h, -h, d], faceData.top);
  drawFacePG(pg, [-h, h, d], [h, h, d], [h, h, -d], [-h, h, -d], faceData.bottom);
}

function drawFacePG(pg, v1, v2, v3, v4, face) {
  if (face.isTexture && face.tex) {
    pg.textureMode(NORMAL);
    pg.texture(face.tex);
    pg.beginShape();
    pg.vertex(...v1, 0, 0);
    pg.vertex(...v2, 1, 0);
    pg.vertex(...v3, 1, 1);
    pg.vertex(...v4, 0, 1);
    pg.endShape(CLOSE);
  } else {
    pg.fill(face.col.levels[0], face.col.levels[1], face.col.levels[2], 255);
    pg.beginShape();
    pg.vertex(...v1);
    pg.vertex(...v2);
    pg.vertex(...v3);
    pg.vertex(...v4);
    pg.endShape(CLOSE);
  }
}

function windowResized() {
  let uiWidth = 320;
  resizeCanvas(windowWidth - uiWidth, windowHeight);
}
