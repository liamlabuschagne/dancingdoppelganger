import { pointMatches, getMatches } from './point.js'
import Loader from './loader.js';
import { findSkeletonElement, calibrate, scaleAndShift } from './calibrate.js'
import Recorder from './recorder.js';

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
    absShoulderPair = undefined;
    calibratedFlag = false;
    recorder;

    constructor(ctx, canvas, video) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.video = video;
        this.poses = [];
        this.goodPoints = [];

        this.recorder = new Recorder();

        this.loadTargetPose();
        this.loadCameraAndStartSetup();
        this.setupRecordButtonEventListener();
    }

    setupRecordButtonEventListener() {
        document.querySelector("#record").addEventListener("click", () => {
            if (this.recorder.recording) {
                this.recorder.stopRecording();
            } else {
                this.recorder.startRecording();
                document.querySelector("#record").textContent = "Stop Recording";
            }
        })
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

        this.checkIfCalibrationNeeded();

        this.drawKeyPoints();
        this.drawSkeleton();

        let matches = getMatches(this.targetPose, this.goodPoints);
        this.awardPoints(matches);

        this.recorder.setCurrentPoses(this.poses);

        // Call draw recursively every frame (max 60fps)
        requestAnimationFrame(this.draw.bind(this));
    }

    updateScore() {
        document.querySelector("#score").innerHTML = "Score: " + this.score;
    }

    awardPoints(matches) {
        if (this.time == 9) {

            let amountToIncreaseScoreBy = 0;

            if (matches == 7) {
                amountToIncreaseScoreBy = 3;
            }
            if (matches == 6) {
                amountToIncreaseScoreBy = 2;
            }
            if (matches == 5) {
                amountToIncreaseScoreBy = 1;
            }

            if (!this.hasDonePose) {
                document.body.style.backgroundColor = "green";
                this.hasDonePose = true;
                this.score += amountToIncreaseScoreBy;
                this.updateScore();
            }
        }
    }

    setNewTargetPose(targetPose) {
        document.body.style.backgroundColor = "white";
        this.targetPose = targetPose;
        this.hasDonePose = false;
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
            console.log("Model Loaded");
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

    checkIfCalibrationNeeded() {
        if (this.poses[0] != undefined) {
            if (this.calibratedFlag == false) {
                //console.log("calibratedFlag was false." + calibratedFlag);
                //Find the element which has the pair of shoulders from the first pose in the poses array
                let shouldersIndex = findSkeletonElement("rightShoulder", "leftShoulder", this.poses[0].skeleton);

                //If the shoulders were found
                if (shouldersIndex > -1) {
                    //Scale and shift targetPose to the first pose in the poses array
                    //targetPose = scaleAndShift(targetPose, poses[0].skeleton[shouldersIndex]);
                    calibrate(this.targetPose, this.poses[0].skeleton[shouldersIndex]);
                }
            }
            else {
                //Shift it to it's point relative to absoluteShoulderPair
                scaleAndShift(this.targetPose, this.absShoulderPair);

                //Yoink some stuff outta matchPose
                // Compare only main body sections
                let matches = getMatches(this.targetPose, this.goodPoints);
                //If they're close to getting the pose
                if (matches > 4) {
                    //Find the element which has the pair of shoulders from the first pose in the poses array
                    let shouldersIndex = findSkeletonElement("rightShoulder", "leftShoulder", this.poses[0].skeleton);

                    //If the shoulders were found
                    if (shouldersIndex > -1) {
                        //Shift this pose closer to them (don't change absShoulderPair)
                        scaleAndShift(this.targetPose, this.poses[0].skeleton[shouldersIndex]);
                    }
                }
                //else {
                //Shift it to it's point relative to absoluteShoulderPair
                //    scaleAndShift(targetPose, absShoulderPair);
                //}
            }
        }
    }
}
