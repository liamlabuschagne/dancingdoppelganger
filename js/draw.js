import { pointMatches, getMatches } from './point.js'
import Loader from './loader.js';
export default class Draw {
    poses = [];
    goodPoints = [];
    ctx;
    canvas;
    poses;
    video;
    targetPose;
    time = 0;
    score = 0;
    hasDonePose = false;

    constructor(ctx, canvas, video) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.video = video;
        this.poses = [];
        this.goodPoints = [];
        this.loadTargetPose();
        this.loadCameraAndStartSetup();
    }

    drawKeyPoints() {
        this.poses.forEach((pose) => {
            pose = pose.pose;
            for (let j = 5; j < 13; j++) {
                const keyPoint = pose.keypoints[j];
                if (keyPoint.score > 0.2) {
                    if (pose.target) {
                        this.ctx.fillStyle = "#00ff00";
                    } else {
                        this.ctx.fillStyle = "#FF0000";
                        this.goodPoints[j] = keyPoint;
                    }
                    this.drawEllipse(keyPoint.position.x, keyPoint.position.y, 7.5);
                }
            }
        })
    }

    drawEllipse(x, y, r) {
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, r, r, Math.PI * 2, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.fill();
    }

    // A function to draw the skeletons
    drawSkeleton() {
        // Loop through all the skeletons detected
        for (let i = 0; i < this.poses.length; i += 1) {
            const skeleton = this.poses[i].skeleton;
            // For every skeleton, loop through all body connections
            for (let j = 0; j < skeleton.length; j += 1) {
                const partA = skeleton[j][0];
                const partB = skeleton[j][1];
                if (this.poses[i].pose.target) {
                    this.ctx.strokeStyle = "#00FF00";
                } else {
                    this.ctx.strokeStyle = "#FF0000";
                }
                this.ctx.beginPath();
                this.ctx.moveTo(partA.position.x, partA.position.y)
                this.ctx.lineTo(partB.position.x, partB.position.y);
                this.ctx.closePath();
                this.ctx.stroke();
            }
        }
    }

    draw() {
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        if (this.targetPose) this.poses.push(this.targetPose);

        this.drawKeyPoints();
        this.drawSkeleton();

        let matches = getMatches(this.targetPose, this.goodPoints);
        this.awardPoints(matches);

        // Call draw recursively every frame (max 60fps)
        requestAnimationFrame(this.draw.bind(this));
    }

    awardPoints(matches) {
        if (matches == 7) {
            if (!this.hasDonePose) {
                this.hasDonePose = true;
                this.score++;
                document.querySelector("#score").innerHTML = "Score: " + this.score;
            }
        }
    }

    setNewTargetPose(targetPose) {
        this.targetPose = targetPose;
    }

    reportLoadError(message) {
        console.log(message);
    }

    updateCountdown() {
        const countdownEl = document.querySelector('#countdown');
        const minutes = Math.floor(this.time / 60);
        let seconds = this.time % 60;

        countdownEl.innerHTML = `${minutes}: ${seconds}`;
        this.time++;

        if (this.time == 10) {
            this.loadTargetPose();
            this.time = 0;
        }
    }

    loadTargetPose() {
        let loader = new Loader();
        loader.loadTargetPose().then(this.setNewTargetPose.bind(this)).catch(this.reportLoadError.bind(this));
    }

    loadCameraAndStartSetup() {
        this.loadCamera().then(this.setup.bind(this)).catch(this.reportLoadError.bind(this));
    }

    setup() {
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.video.width = this.video.videoWidth;
        this.video.height = this.video.videoHeight;

        // Create a new poseNet method with a single detection
        let poseNet = ml5.poseNet(this.video, () => {
            document.querySelector("#status").innerHTML = "Model Loaded";
        });

        poseNet.on("pose", this.setPoses.bind(this));

        setInterval(this.updateCountdown.bind(this), 1000);
        this.draw();
    }

    setPoses(results) {
        this.poses = results;
    }

    loadCamera() {
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.getUserMedia({ audio: false, video: true }).then((stream) => {
                this.video.srcObject = stream;
                this.video.hidden = true;

                // Once the video has loaded that stream, start the main setup
                this.video.addEventListener("loadeddata", () => {
                    resolve();
                });

            }).catch((error) => {
                reject('navigator.MediaDevices.getUserMedia error: ' + error.message + error.name);
            });
        });
    }
}

