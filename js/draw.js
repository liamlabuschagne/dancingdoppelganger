import { pointMatches, getMatches } from './point.js'
import Loader from './loader.js';
import { findSkeletonElement, calibrate, scaleAndShift } from './calibrate.js'
import Recorder from './recorder.js';
import Point from "./point.js";     //temporarily need this for a quick bug fix

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
    danceMoves = [];
    danceMovesIndex = -1;
    globalScaler = 1;
    calibrateRShoulder;

    constructor(ctx, canvas, video) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.video = video;
        this.poses = [];
        this.goodPoints = [];

        this.recorder = new Recorder();
        this.loader = new Loader();

        this.loadCameraAndStartSetup();
        this.setupRecordButtonEventListener();
        this.setUpFileUploadEventListener();
    }

    restartSong() {
        setInterval(this.updateCountdown.bind(this), 100);
        document.querySelector("audio").currentTime = 0;
        document.querySelector("audio").play();
    }

    stopSong() {
        this.danceMoves = [];
        document.querySelector("audio").pause();
    }

    setUpFileUploadEventListener() {
        if (window.location.pathname == "/game.html") {
            document.querySelector("#dancingQueen").addEventListener("click", async (e) => {
                this.setDanceMoves(await this.loader.loadPrerecorded());
            })
        } else if (window.location.pathname == "/created_game.html") {
            document.querySelector("#fileUpload").addEventListener("change", async (e) => {
                this.setDanceMoves(await this.loader.getFileContents(e));
            });
        }
    }

    setDanceMoves(jsonString) {
        console.log(jsonString);
        this.danceMoves = JSON.parse(jsonString);
        this.nextDanceMove();
        this.calibrateAfterSeconds(5);
    }

    calibrateAfterSeconds(seconds) {
        setTimeout(this.calibrateOrScaleAndShift.bind(this), seconds * 1000);
        setTimeout(this.restartSong.bind(this), seconds * 1000);
    }

    setupRecordButtonEventListener() {
        if (window.location.pathname != "/record_dance.html") return;
        document.querySelector("#record").addEventListener("click", () => {
            if (this.recorder.recording) {
                this.recorder.stopRecording();
                this.stopSong();
            } else {
                this.recorder.startRecording();
                this.calibrateAfterSeconds(5);
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
                        this.drawEllipse(keyPoint.position.x, keyPoint.position.y, 7.5);
                    } else {
                        //this.ctx.fillStyle = "#FF0000";
                        this.goodPoints[j] = keyPoint;
                    }

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
                    this.ctx.beginPath();
                    this.ctx.moveTo(partA.position.x, partA.position.y)
                    this.ctx.lineTo(partB.position.x, partB.position.y);
                    this.ctx.closePath();
                    this.ctx.stroke();
                } //else {
                //this.ctx.strokeStyle = "#FF0000";
                //}
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

            amountToIncreaseScoreBy = matches - 4;

            if (!this.hasDonePose) {
                if (amountToIncreaseScoreBy > 0){
                    document.body.style.backgroundColor = "green";
                }
                else if (amountToIncreaseScoreBy < 0){
                    document.body.style.backgroundColor = "red";
                }
                else {
                    document.body.style.backgroundColor = "orange";
                }
                this.hasDonePose = true;
                this.score += amountToIncreaseScoreBy;
                this.updateScore();
            }
        }
    }

    setNewTargetPose(targetPose) {
        this.targetPose = targetPose;
        this.targetPose.pose.target = true;     //Quick thought: do the poses, when originally saved to a json, have a .target property?
        this.hasDonePose = false;

        console.log("targetPose: ");
        console.log(targetPose);
        console.log("And the global scaler: " + this.globalScaler);
        //Scale and shift it to its correct position based on the calibration pose
        scaleAndShift(this.targetPose, this.calibrateRShoulder, this.globalScaler);
    }

    reportLoadError(message) {
        console.log(message);
    }

    updateCountdown() {
        if (window.location.pathname != "/game.html" && window.location.pathname != "/created_game.html") return;

        if (this.time < 9 && this.time > 2) {
            document.body.style.backgroundColor = "white";
        }

        const countdownEl = document.querySelector('#countdown');
        const minutes = Math.floor(this.time / 60);
        let seconds = this.time % 60;

        countdownEl.innerHTML = `${minutes}: ${seconds}`;
        this.time++;

        if (this.time == 10) {
            // this.loadTargetPose();
            if (this.danceMoves.length != 0) {
                this.nextDanceMove();
            }
            this.time = 0;
        }
    }

    nextDanceMove() {
        if (this.danceMovesIndex < this.danceMoves.length - 1) {
            this.danceMovesIndex++;
        } else {
            this.danceMovesIndex = 0;
            let message = "\r\n noice";
            if (this.score < 0) {
                message = "\r\n You suck. Do better.";
            }
            alert("Final score: " + this.score + message);
            this.stopSong();
            //Force refresh the page (not using cache) (apparently .reload() is deprecated so we gotta find the new improved one)
            document.location.reload(true);
        }
        if (!this.danceMoves[this.danceMovesIndex].poses[0]) return;
        this.setNewTargetPose(this.danceMoves[this.danceMovesIndex].poses[0])
    }

    loadTargetPose() {
        this.loader.loadTargetPose().then(this.setNewTargetPose.bind(this)).catch(this.reportLoadError.bind(this));
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

    /**
     * Will only run once, so a lot of stuff like calibratedFlag are possibly irrelevant. Wait, no...
     */
    calibrateOrScaleAndShift() {
        if (this.poses[0] != undefined) {
            if (this.calibratedFlag == false) {
                //console.log("calibratedFlag was false." + calibratedFlag);
                //Find the element which has the pair of shoulders from the first pose in the poses array
                let shouldersIndex = findSkeletonElement("rightShoulder", "leftShoulder", this.poses[0].skeleton);

                console.log("this.poses[0].skeleton[shouldersIndex]: ");
                console.log(this.poses[0].skeleton[shouldersIndex]);

                console.log("targetPose: ");
                console.log(this.targetPose);

                //If the shoulders were found
                if (shouldersIndex > -1) {
                    //Scale and shift targetPose to the first pose in the poses array

                    console.log("this.poses[0].skeleton[shouldersIndex], the sequel: ");
                    console.log(this.poses[0].skeleton[shouldersIndex]);

                    console.log("targetPose, the sequel: ");
                    console.log(this.targetPose);

                    console.log("thisRShoulder x position: ");
                    console.log(this.targetPose.pose.keypoints[6].position.x);

                    //THIS ASSUMES THE RIGHT SHOULDER IS THE SECOND IN THE ARRAY (pretty sure ml5 always does it that way)
                    //Save the pose's right and left shoulder points as two new right and left shoulder Points.
                    let thisRShoulder = new Point(this.targetPose.pose.keypoints[6].position.x, this.targetPose.pose.keypoints[6].position.y);    //6 is the index of the right shoulder
                    let thisLShoulder = new Point(this.targetPose.pose.keypoints[5].position.x, this.targetPose.pose.keypoints[5].position.y);    //5 is the index of the left shoulder

                    this.calibrateRShoulder = thisRShoulder;

                    console.log("thisRShoulder outside: ");
                    console.log(thisRShoulder);
                    console.log("thisLShoulder outside: ");
                    console.log(thisLShoulder);

                    this.globalScaler = calibrate(this.targetPose, this.poses[0].skeleton[shouldersIndex], thisRShoulder, thisLShoulder);

                    this.calibratedFlag = true;
                }
            }
            /*else {
                //Code beyond this point is now irrelevant due to the context which this is used - I'll delete it once I'm sure I'm done with it
                //  (this code was meant to scale and shift poses normally, relative to calibrated pose, once calibration was complete)
                //Shift it to it's point relative to absoluteShoulderPair
                scaleAndShift(this.targetPose, this.globalScaler);

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
            */
        }
    }
}
