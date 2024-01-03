window.onload = function () { init(); }

const container = document.getElementById("content");
const ENDPOINT = "matrix.php";

// spritesheet resolution
const WIDTH = 128;
const HEIGHT = 128;

let bytes = new Array(WIDTH * HEIGHT);

// Individual frame size:
const SPRITE_WIDTH = 16
const SPRITE_HEIGHT = 16

// Largest dimension of sprite:
const LARGEST_SIZE = Math.max(SPRITE_HEIGHT, SPRITE_WIDTH);

// Rendering area with margin:
const CANVAS_WIDTH = Math.min((container.offsetWidth*0.85),container.offsetHeight*0.7);
const CANVAS_HEIGHT = container.offsetHeight;

// Pixel grid characteristics (Editor area)
const GRID_WIDTH = CANVAS_WIDTH - 2;
const GRID_HEIGHT = GRID_WIDTH;
const CELL_WIDTH = GRID_WIDTH / LARGEST_SIZE;
const CELL_HEIGHT = GRID_HEIGHT / LARGEST_SIZE;

let grid = new PIXI.Graphics();

let mouseState = 0;

let offsetX = 0;
let offsetY = 0;

// Are we removing pixels?
let erasing = 0;
// Colour picking
let pickMode = 0;

// Scratchpad - used for copying frames
let copyData = [];

//  Palette characteristics
const PALETTE_COLS = 24;
const PALETTE_ROWS = 8;
const PALETTE_CELL_WIDTH = (CANVAS_WIDTH - 2) / PALETTE_COLS;
const PALETTE_CELL_HEIGHT = PALETTE_CELL_WIDTH/1.2;

var palette = new PIXI.Graphics();

// Lazy global properties
let selectedColor = 0xff
// Location of current sprite within spritesheet
// Palette data
let colours = [];

// Generate palette
let index = 0;
let paly = PALETTE_ROWS;
let half_paly = paly / 2;
for (var y = 0; y < paly; y++) {
    for (var x = 0; x < PALETTE_COLS; x++) {
        let b = 0;
        let v = 0;
        if (y <= half_paly) {
            b = 1;
            v = y / half_paly;
        } else {
            b = 1 - ((y - half_paly) / half_paly);
            v = 1;
        }
        if (y == 0) {
            b=0;
            v = x/PALETTE_COLS;
        }
        colours[index] = Math.floor(hsv2rgb(x * (255/(17)), b, v));
        index++;
    }
}


// Basic url processing- look for anim, store it.
let paramString = location.href.split('?')[1];
let queryString = new URLSearchParams(paramString);

for (let pair of queryString.entries()) {
    if (pair[0] == "anim") {
        anim = pair[1];
        localStorage.setItem("animName", anim);
    }
}

function renderPalette() {
    palette.clear();

    for (let x = 0; x < PALETTE_COLS; x++) {
        for (let y = 0; y < PALETTE_ROWS; y++) {
            let color = colours[x + (y * PALETTE_COLS)];
            if (color == selectedColor) {
                palette.lineStyle(2, 0xffffff)
            } else {
                palette.lineStyle(0, 0)
            }

            palette.beginFill(0);
            palette.drawRect(x * PALETTE_CELL_WIDTH, y * PALETTE_CELL_HEIGHT, PALETTE_CELL_WIDTH, PALETTE_CELL_HEIGHT);

            palette.beginFill(color);
            palette.drawRect(x * PALETTE_CELL_WIDTH, y * PALETTE_CELL_HEIGHT, PALETTE_CELL_WIDTH - 1, PALETTE_CELL_HEIGHT - 1);

        }
    }
}

function init() {
    // Create the application
    const app = new PIXI.Application({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, resolution: 1, });
    // Add the view to the DOM
    container.appendChild(app.view);

    // Shows hand cursor
    grid.cursor = 'pointer';
    grid.x = 1;
    grid.y = 0;

    // Pointers normalize touch and mouse (good for mobile and desktop)
    grid.on('pointerdown', function (e) {
        e.local = {
            x: e.data.global.x - grid.x,
            y: e.data.global.y - grid.y
        }
        gridClicked(e);
    });

    grid.eventMode = 'static';
    grid.on('pointerdown', function (e) {
        mouseState = 1;
    });

    grid.on('pointerup', function (e) {
        mouseState = 0;
        postData(bytes);

    });

    grid.on('pointermove', function (e) {
        if (mouseState == 1) {
            e.local = {
                x: e.data.global.x - grid.x,
                y: e.data.global.y - grid.y
            }
            gridMoved(e);

        }
    });
    app.stage.addChild(grid);
    app.stage.addChild(palette);


    palette.x = 1;
    // palette

    palette.eventMode = 'static';
    palette.on('pointerdown', function (e) {
        let x = Math.floor((e.global.x - palette.x) / PALETTE_CELL_WIDTH);
        let y = Math.floor((e.global.y - palette.y) / PALETTE_CELL_HEIGHT);
        console.log(x + " " + y)
        selectedColor = colours[x + (y * PALETTE_COLS)];
        renderPalette();
    });

    anim = localStorage.getItem("animName");
    document.getElementById("animName").value = anim;
    document.getElementById("animName").addEventListener('input', function (evt) {
        anim = this.value;
        localStorage.setItem("animName", anim);
        getData();
    });

    document.getElementById("frameCount").addEventListener('input', function (evt) {
        let newFrames = parseInt(this.value);
        if (newFrames > 0 && newFrames < 64) {
            frames = newFrames;
            updateFrameButtons();
        }
        //postData(bytes);
    });

    document.getElementById("currentFrame").addEventListener('input', function (evt) {
        let newFrame = parseInt(this.value);
        if (newFrame > 0 && newFrame < 64) {
            selectFrame(newFrame - 1);
        }
    });

    getData();
    renderPalette();
    palette.y = container.offsetHeight - palette.height-8;
}


function updateFrameButtons() {
    let frameContainer = document.getElementById("frameButtons");
    while (frameContainer.firstChild) {
        frameContainer.removeChild(frameContainer.lastChild);
    }

    for (let i = 0; i < frames; i++) {
        const button =document.createElement("BUTTON");
        button.innerText=i+1;
        button.onclick = () => {
            selectFrame(i);
        }
        frameContainer.appendChild(button);
    }
}

function postData(data) {

    $.post(ENDPOINT, {
        anim: anim,
        data: ([frames, WIDTH, HEIGHT].concat(data)).toString()
    }, function (response) {
        // maybe call getData();
    });
}

function getData() {
    $.post(ENDPOINT, {
        anim: anim
    }, function (response) {
        const data = response.split("\n");
        frames = 8;
        if (data.length < 3) {
            frames = 1;
            for (x = 0; x < bytes.length; x++) {
                bytes[x] = 0;
            }

        } else {
            frames = data[0];
        }
        updateFrameButtons();
        document.getElementById("frameCount").value = frames;
        let w = data[1];
        let h = data[2];
        for (var x = 0; x < w * h; x++) {
            bytes[x] = parseInt(data[x + 3]) || 0;
        }

        drawAll();
    });
}


function plot(color, x, y) {
    grid.beginFill(color);
    bytes[(x + offsetX) + ((y + offsetY) * WIDTH)] = color;
    grid.drawRect(x * CELL_WIDTH, y * CELL_HEIGHT, CELL_WIDTH, CELL_HEIGHT);
}

function drawAll() {
    grid.clear();
    grid.beginFill(0x202020);
    grid.drawRect(0, 0, GRID_WIDTH, GRID_HEIGHT);
    grid.lineStyle(1, 0xffffff);
    grid.y = (palette.y / 2) - (grid.height / 2);
            for (var x = 0; x < SPRITE_WIDTH; x++) {
        for (var y = 0; y < SPRITE_HEIGHT; y++) {
            plot(bytes[(x + offsetX) + ((y + offsetY) * WIDTH)], x, y)
        }
    }
}

function get(x, y) {
    return bytes[(x + offsetX) + ((y + offsetY) * WIDTH)]
}

function gridClicked(e) {
    let x = Math.floor(e.local.x / CELL_WIDTH);
    let y = Math.floor(e.local.y / CELL_HEIGHT);
    if (pickMode) {
        selectedColor = get(x, y);
        renderPalette();
        pickMode = 0;
        return;
    }
    erasing = get(x, y) > 0

    if (erasing) {
        plot(0, x, y)
    } else {
        plot(selectedColor, x, y)
    }
}

function gridMoved(e) {
    let x = Math.floor(e.local.x / CELL_WIDTH);
    let y = Math.floor(e.local.y / CELL_HEIGHT);

    if (erasing) {
        plot(0, x, y)
    } else {
        plot(selectedColor, x, y)
    }
}

function selectFrame(frame) {
    offsetX = frame * SPRITE_WIDTH;
    offsetY = Math.floor(offsetX / WIDTH) * SPRITE_HEIGHT;
    drawAll();
}


function copyFrame() {
    for (var x = 0; x < SPRITE_WIDTH; x++) {
        for (var y = 0; y < SPRITE_HEIGHT; y++) {
            copyData[x + (y * WIDTH)] = bytes[(x + offsetX) + ((y + offsetY) * WIDTH)];
        }
    }
}
function pasteFrame() {
    for (var x = 0; x < SPRITE_WIDTH; x++) {
        for (var y = 0; y < SPRITE_HEIGHT; y++) {
            bytes[(x + offsetX) + ((y + offsetY) * WIDTH)] = copyData[x + (y * WIDTH)];
        }
    }
    drawAll();
}

function pickColour() {
    pickMode = 1;
}

function shiftImage(xd,yd) {
    let cacheData = [];
    for (var x = 0; x < SPRITE_WIDTH; x++) {
        for (var y = 0; y < SPRITE_HEIGHT; y++) {
            cacheData[x + (y * WIDTH)] = bytes[(x + offsetX) + ((y + offsetY) * WIDTH)];
        }
    }

    for (var x = 0; x < SPRITE_WIDTH; x++) {
        for (var y = 0; y < SPRITE_HEIGHT; y++) {
            let nx = (x+SPRITE_WIDTH+xd)%SPRITE_WIDTH;
            let ny = (y+SPRITE_HEIGHT+yd)%SPRITE_HEIGHT;
            bytes[(nx + offsetX) + ((ny + offsetY) * WIDTH)] = cacheData[x + (y * WIDTH)];
        }
    }
    drawAll();
    postData(bytes);
}