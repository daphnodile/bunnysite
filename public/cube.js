const NB_COLS = 64;
const NB_ROWS = 32;

var matrix = Array.from({ length: NB_ROWS }, () => Array(NB_COLS).fill('⠀'));

// move to obj notation
var vertices = [
    { x: -1, y: -1, z: -1 },
    { x: -1, y: 1, z: -1 },
    { x: 1, y: 1, z: -1 },
    { x: 1, y: -1, z: -1 },
    { x: 1, y: 1, z: 1 },
    { x: 1, y: -1, z: 1 },
    { x: -1, y: -1, z: 1 },
    { x: -1, y: 1, z: 1 },
];

// planes in R3 are defined by three vertices
// planes on opposite sides share the same symbol as they are never rendered at the same time
var planes = [
    // front face
    [0, 1, 2, '░'],
    [0, 2, 3, '░'],
    // right face
    [3, 2, 4, '▒'],
    [3, 4, 5, '▒'],
    // back face
    [5, 4, 7, '░'],
    [5, 7, 6, '░'],
    // left face
    [6, 7, 1, '▒'],
    [6, 1, 0, '▒'],
    // top face
    [6, 0, 3, '█'],
    [6, 3, 5, '█'],
    // bottom face
    [1, 7, 4, '█'],
    [1, 4, 2, '█']
]

function drawLine(y, x0, x1, char) {
    var left = x0;
    var right = x1;

    if (left > right) {
    left = x1;
    right = x0;
    }

    for (var i = left; i <= right; i++) {
        matrix[y][i] = char;
    }
}

function drawAscendingGradientTriangle(t1, t2, b, char) {
    var x_delta_1 = (b.x - t1.x) / (b.y - t1.y);
    var x_delta_2 = (b.x - t2.x) / (b.y - t2.y);

    var y0 = Math.round(t1.y);          
    var y1 = Math.round(b.y + 1);

    var x0 = t1.x;
    var x1 = t2.x;

    for (var i = y0; i < y1; i++) { // draw the line segment from x0 to x1 for each y value
    drawLine(i, Math.round(x0), Math.round(x1), char);

    x0 += x_delta_1;
    x1 += x_delta_2;
    }
}

// todo coealease and use *-1 to alter direction?
function drawDescendingGradientTriangle(b, t1, t2, char) {
    var x_delta_1 = (b.x - t1.x) / (t1.y - b.y);
    var x_delta_2 = (b.x - t2.x) / (t2.y - b.y);
    
    var y0 = Math.round(b.y);
    var y1 = Math.round(t1.y + 1);

    var x0 = b.x;
    var x1 = b.x;

    for (var i = y0; i < y1; i++) { // draw the line segment from x0 to x1 for each y value
    drawLine(i, Math.round(x0), Math.round(x1), char);

    x0 -= x_delta_1;
    x1 -= x_delta_2;
    }
}


function drawPlane(vec0, vec1, vec2, char) {
    // arrange by y level
    var vecs = [vec0, vec1, vec2].toSorted((v1, v2) => v1.y - v2.y);

    var v0 = vecs[0];
    var v1 = vecs[1];
    var v2 = vecs[2];
    
    if (v1.y === v2.y) { // only one half of the plane is visible
        drawDescendingGradientTriangle(v0, v1, v2, char);
        return;
    }

    if (v0.y === v1.y) {
        drawAscendingGradientTriangle(v0, v1, v2, char);
        return;
    }

    var intersection_x = v0.x + Math.floor(((v2.x - v0.x) * (v1.y - v0.y)) / (v2.y - v0.y));

    var intersection_vector = {
        x: intersection_x,
        y: v1.y,
    };

    drawDescendingGradientTriangle(v0, v1, intersection_vector, char);
    drawAscendingGradientTriangle(v1, intersection_vector, v2, char);
}

// projects a 3d vector onto the 2d plane
function projectVector(v) {
    return {
        x: Math.round(v.x / v.z + NB_COLS / 2), // offsets x=0 into the centre
        y: Math.round(v.y / v.z + NB_ROWS / 2), // offsets y=0 into the centre
    }
}

// todo check Math for vector methods
function cross_product(v0, v1) {
    return {
        x: v0.y * v1.z - v0.z * v1.y,
        y: v0.z * v1.x - v0.x * v1.z,
        z: v0.x * v1.y - v0.y * v1.x,
    }
}

function dot_product(v0, v1) {
    return v0.x * v1.x + v0.y * v1.y + v0.z * v1.z;
}

function rotateXAxis(v, radians) {
    return {
        x: v.x,
        y: Math.cos(radians) * v.y - Math.sin(radians) * v.z,
        z: Math.sin(radians) * v.y + Math.cos(radians) * v.z,
    };
}

function rotateYAxis(v, radians) {
    return {
        x: Math.cos(radians) * v.x + Math.sin(radians) * v.z,
        y: v.y,
        z: -Math.sin(radians) * v.x + Math.cos(radians) * v.z,
    };
}

function rotateZAxis(v, radians) {
    return {
        x: Math.cos(radians) * v.x - Math.sin(radians) * v.y,
        y: Math.sin(radians) * v.x + Math.cos(radians) * v.y,
        z: v.z,
    };
}


function drawCube(rx, ry, rz) {
    planes.forEach((plane) => {
        var projectedVertices = plane;

        var v0 = { ...vertices[plane[0]] }; // move to object whateva
        var v1 = { ...vertices[plane[1]] };
        var v2 = { ...vertices[plane[2]] };
        var char = plane[3];

        // apply rotations
        v0 = rotateXAxis(v0, rx);
        v0 = rotateYAxis(v0, ry);
        v0 = rotateZAxis(v0, rz);

        v1 = rotateXAxis(v1, rx);
        v1 = rotateYAxis(v1, ry);
        v1 = rotateZAxis(v1, rz);

        v2 = rotateXAxis(v2, rx);
        v2 = rotateYAxis(v2, ry);
        v2 = rotateZAxis(v2, rz);

        // scale the cube up from the unit vectors 
        const scalingFactor = 256
        
        v0.x *= scalingFactor * 1.5;
        v1.x *= scalingFactor * 1.5;
        v2.x *= scalingFactor * 1.5;

        v0.y *= scalingFactor;
        v1.y *= scalingFactor;
        v2.y *= scalingFactor;

        // move into z axis
        v0.z += 40;
        v1.z += 40;
        v2.z += 40;
        
        var projectedV0 = projectVector(v0);
        var projectedV1 = projectVector(v1);
        var projectedV2 = projectVector(v2);
        
        // cull faces we cant see
        const v_01 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
        const v_02 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };
        
        // arbitrary camera vector to define which planes are facing the view area
        const camera_vector = { x: 0, y: 0, z: -1 };

        const normal = cross_product(v_01, v_02);
        const dot_prod = dot_product(normal, camera_vector);
        
        if (dot_prod <= 0) {
            return; // face cannot be seen, dont draw and return early
        }

        drawPlane(projectedV0, projectedV1, projectedV2, char);
    })
}

async function main() {
    var rx = 0;
    var ry = 0;
    var rz = 0;
    
    while (true) { // replace w/ interaction
        matrix = Array.from({ length: NB_ROWS }, () => Array(NB_COLS).fill('⠀')); // reset rendering space

        drawCube(rx, ry, rz)

        rx = (rx + 0.01) % (2 * Math.PI);
        ry = (ry + 0.05) % (2 * Math.PI);
        rz = (rz + 0.05) % (2 * Math.PI);

        // "render" to screen
        var outputContainer = document.getElementById("cube");
        var str = matrix.map((row) => row.join('')).join('<br>');
        outputContainer.innerHTML = str;

        await new Promise(resolve => setTimeout(resolve, 1/24 * 1000)); // 24 ""fps"" as the lord intended
    }
}

main();


