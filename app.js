const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const backgroundImage = new Image();
backgroundImage.src = "images/background.png";

const dollImages = [
    "images/1747101159907.png",
    "images/1747101175482.png",
    "images/1747101180315.png",
    "images/1747101185271.png",
    "images/1747101190790.png",
    "images/1747101196111.png",
    "images/1747101202511.png"
];

const dolls = [];

const claw = {
    x: canvas.width / 2,
    y: 50,
    speed: 5,
    width: 30,
    height: 30,
    dropping: false,
    raising: false,
    grabbing: false
};

let score = 0;
let currentDoll = null;

class Doll {
    constructor(x, y, imageSrc) {
        this.x = x;
        this.y = y;
        this.image = new Image();
        this.image.src = imageSrc;
        this.width = 50;
        this.height = 50;
        this.collisionData = null;
        this.collected = false;
    }

    // 获取图片像素碰撞数据
    async getCollisionData() {
        return new Promise((resolve) => {
            const tempCanvas = document.createElement("canvas");
            const tempCtx = tempCanvas.getContext("2d");
            tempCanvas.width = this.image.width;
            tempCanvas.height = this.image.height;
            tempCtx.drawImage(this.image, 0, 0);

            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;
            this.collisionData = new Array(tempCanvas.width * tempCanvas.height).fill(false);

            for (let i = 0; i < data.length; i += 4) {
                const alpha = data[i + 3];
                if (alpha > 0) {
                    this.collisionData[i / 4] = true;
                }
            }
            resolve(this.collisionData);
        });
    }

    // 检测碰撞
    collidesWith(rect) {
        if (!this.collisionData) return false;

        const scaleX = this.image.width / this.width;
        const scaleY = this.image.height / this.height;

        for (let x = 0; x < rect.width; x++) {
            for (let y = 0; y < rect.height; y++) {
                const imgX = Math.floor((rect.x + x - this.x) * scaleX);
                const imgY = Math.floor((rect.y + y - this.y) * scaleY);

                if (imgX >= 0 && imgX < this.image.width && imgY >= 0 && imgY < this.image.height) {
                    const index = imgY * this.image.width + imgX;
                    if (this.collisionData[index]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

function getRandomPosition(dollIndex) {
    const x = Math.random() * (canvas.width - 50);
    const y = 30 + dollIndex * 100;
    return { x, y };
}

async function initDolls() {
    for (let i = 0; i < dollImages.length; i++) {
        const position = getRandomPosition(i);
        const doll = new Doll(position.x, position.y, dollImages[i]);
        await doll.getCollisionData();
        dolls.push(doll);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    dolls.forEach(doll => {
        if (!doll.collected) doll.draw();
    });

    ctx.fillStyle = "black";
    ctx.fillRect(claw.x - claw.width / 2, claw.y, claw.width, claw.height);

    ctx.fillStyle = "red";
    ctx.font = "24px Arial";
    ctx.fillText("分数: " + score, 10, 30);
}

function update() {
    if (claw.dropping) {
        claw.y += claw.speed;
        if (claw.y > canvas.height - 50) {
            claw.dropping = false;
            claw.grabbing = true;
        }
    } else if (claw.grabbing) {
        claw.grabbing = false;
        claw.raising = true;
        currentDoll = null;

        for (const doll of dolls) {
            if (!doll.collected && doll.collidesWith({
                x: claw.x - claw.width / 2,
                y: claw.y,
                width: claw.width,
                height: claw.height
            })) {
                doll.collected = true;
                currentDoll = doll;
                score++;
                break;
            }
        }
    } else if (claw.raising) {
        claw.y -= claw.speed;
        if (claw.y < 50) {
            claw.raising = false;
            if (currentDoll) {
                currentDoll.x = claw.x - currentDoll.width / 2;
                currentDoll.y = 20;
            }
        }
    }

    if (currentDoll && claw.raising) {
        currentDoll.y = claw.y - currentDoll.height;
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

backgroundImage.onload = async () => {
    await initDolls();
    requestAnimationFrame(gameLoop);
};

document.addEventListener("keydown", (e) => {
    if (e.key.startsWith("Arrow")) {
        if (e.key === "ArrowLeft") {
            claw.x = Math.max(0, claw.x - claw.speed);
        } else if (e.key === "ArrowRight") {
            claw.x = Math.min(canvas.width, claw.x + claw.speed);
        }
    } else if (e.code === "Space" && !claw.dropping && !claw.raising) {
        claw.dropping = true;
    }
});
