// Copyright (c) 2019 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet example using p5.js
=== */

let video;
let poseNet;
let poses = [];
let goodpoints = [];

let danceMoves = ['Y-pose.json', 'T-pose.json', 'rightArmUp.json']

var testMove = 'Y-pose.json';

let testPose = null;

let targetPose = null;

//This is our score, always starts at 0
var score = 0;

//Timer for adding poses randomly throughout the song.
const startingMinutes = 0;
let time = startingMinutes * 60;

//Stops our score flying up
//hasDonePose = new boolean(false);

const countdownEl = document.getElementById('countdown');

setInterval(updateCountdown, 1000);

function updateCountdown(){
    const minutes = Math.floor(time / 60);
    let seconds = time % 60;

    countdownEl.innerHTML = `${minutes}: ${seconds}`;
    time++;

    if(time == 2){
        loadTarget();
        time = 0;
    }
}

function loadTarget() {
    hasDonePose = false;
    let randomlyPickDanceMove = danceMoves[Math.floor(Math.random() * danceMoves.length)];
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', randomlyPickDanceMove, true); // Replace 'appDataServices' with the path to your file
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            //callback();
            // Add target to drawing
            targetPose = JSON.parse(xobj.responseText);
            targetPose.target = 1;
            console.log(targetPose);
        }
    };
    xobj.send(null);

    console.log(targetPose);
}

function loadScaledTarget() {
    //I is Learnding: Anything outside a block/function is run first, then the block/function
    // i.e. even if something is written AFTER the function, it is still run before what's inside the function.

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', testMove, true); // Replace 'appDataServices' with the path to your file
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            //callback();

            console.log(testPose);

            // Add target to drawing
            testPose = JSON.parse(xobj.responseText);
            testPose.info = 2;
            console.log(testPose);

            var ppose = testPose.pose;
            var skeleton = testPose.skeleton;
            score += 2;
            //Bgoodpoints = [];
            //score += 1;
            for (let j = 5; j < 13; j++) {
                // A keypoint is an object describing a body part (like rightArm or leftShoulder)
                let keypoint = ppose.keypoints[j];

                keypoint.position.x *= 0.5;
                keypoint.position.y *= 0.5;

                //if (keypoint.score > 0.2) {
                //    if (poses[i].pose.target == 1) {
                //        fill(0, 255, 0);
                //    }else if (poses[i].pose.target == 2){
                //        fill(0, 0, 255);
                //    } else {
                //        fill(0, 0, 0);
                //        goodpoints[j] = keypoint;
                //    }
                //    noStroke();
                //    ellipse(keypoint.position.x, keypoint.position.y, 15, 15);
                //}
            }
            for (let i = 0; i < skeleton.length; i++) {
                let boneStart = skeleton[i][0];
                let boneEnd = skeleton[i][1];

                boneStart.position.x *= 0.5;
                boneStart.position.y *= 0.5;

                boneEnd.position.x *= 0.5;
                boneEnd.position.y *= 0.5;
            }
        }
    };
    xobj.send(null);
    
    console.log(testPose);

    //score += 1;

    // For test pose, loop through all the keypoints
    console.log(testPose);
    //For some testPose is null in this level - why??
    //I think the WHOLE of function should be run before I try to access testPose
    //const ppose = testPose.pose;
    //score += 2;
    //Bgoodpoints = [];
    //score += 1;
    //for (let j = 5; j < 13; j++) {
        // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    //    let keypoint = ppose.keypoints[j];

    //    keypoint.position.x = 100;
    //    keypoint.position.y = 100;

        // Only draw an ellipse is the pose probability is bigger than 0.2
        //if (keypoint.score > 0.2) {
        //    if (targetPose.pose.target) {
        //        fill(0, 255, 0);
        //    } else {
        //        fill(255, 0, 0);
        //        Bgoodpoints[j] = keypoint;
        //    }
        //    noStroke();
        //    ellipse(keypoint.position.x, keypoint.position.y, 15, 15);
        //}
    //}

    //score += 1;
}


function setup() {
    let scale = 1.5
    createCanvas(640 * scale, 480 * scale);
    video = createCapture(VIDEO);
    video.size(width, height);

    // Create a new poseNet method with a single detection
    poseNet = ml5.poseNet(video, modelReady);
    // This sets up an event that fills the global variable "poses"
    // with an array every time new poses are detected
    poseNet.on("pose", function (results) {
        poses = results;
    });
    // Hide the video element, and just show the canvas
    video.hide();

    loadTarget();
    loadScaledTarget();
}

function modelReady() {
    select("#status").html("Model Loaded");
    select("#score").html("Score: " + score);
}

function draw() {
    image(video, 0, 0, width, height);

    // We can call both functions to draw all keypoints and the skeletons

    //Scale testPose maybe please maybe I hope
    //scaleTest(targetPose);

    //Add the targetPose
    if (!targetPose) return;
    poses.push(targetPose);
    poses.push(testPose);
    drawKeypoints();
    drawSkeleton();
    //Remove the targetPose
    poses.pop();
    poses.pop();
}

function Point(x, y) {
    this.x = x;
    this.y = y;


    this.distanceTo = function (point) {
        var distance = Math.sqrt((Math.pow(point.x - this.x, 2)) + (Math.pow(point.y - this.y, 2)))
        return distance;
    };
}

function pointMatches(part) {
    if (!goodpoints[part]) return false;
    let actual = new Point(goodpoints[part].position.x, goodpoints[part].position.y);
    let target = new Point(targetPose.pose.keypoints[part].position.x, targetPose.pose.keypoints[part].position.y);

    let distance = actual.distanceTo(target);
    if (distance < 100) {
        return true;
    } else {
        return false;
    }
}

function scaleTest(poseArray){
    var ppose = poseArray.pose;
    score += 2;
    Bgoodpoints = [];
    //score += 1;
    for (let j = 5; j < 13; j++) {
        // A keypoint is an object describing a body part (like rightArm or leftShoulder)
        let keypoint = ppose.keypoints[j];

        keypoint.position.x = 100;
        keypoint.position.y = 100;
    }
}

let maxMatches = 0;

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
    //console.log(poses);

    //scaleTest(targetPose);

    //if (!targetPose) return;
    //poses.push(targetPose);//, testPose);
    //poses.push(testPose);

    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i += 1) {
        // For each pose detected, loop through all the keypoints
        const pose = poses[i].pose;
        goodpoints = [];
        for (let j = 5; j < 13; j++) {
            // A keypoint is an object describing a body part (like rightArm or leftShoulder)
            const keypoint = pose.keypoints[j];
            // Only draw an ellipse is the pose probability is bigger than 0.2
            if (keypoint.score > 0.2) {
                if (typeof poses[i].pose.info == undefined) { //Yeah this is trying to distinguish from the actual target but...
                    fill(0, 255, 255);
                }else if (poses[i].pose.target){
                    fill(0, 255, 0);
                } else {
                    fill(255, 0, 0);
                    goodpoints[j] = keypoint;
                }
                noStroke();
                ellipse(keypoint.position.x, keypoint.position.y, 15, 15);
            }
        }

        // Compare only main body sections
        let matches = 0;
        for (let i = 5; i < 12; i++) {
            if (pointMatches(i)) {
                matches++;
            }
        }

        if (matches == 7) {
            //Adds 10 to the score
            if(!hasDonePose){
                hasDonePose = true;
                score++;
                select("#score").html("Score: " + score);
            }
            else{
                //Sing and wait for next pose!
            }
        }

        
    }

    //poses.pop();
}

// A function to draw the skeletons
function drawSkeleton() {
    // Loop through all the skeletons detected
    for (let i = 0; i < poses.length; i += 1) {
        const skeleton = poses[i].skeleton;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j += 1) {
            const partA = skeleton[j][0];
            const partB = skeleton[j][1];
            if (poses[i].pose.target) {
                stroke(0, 255, 0);
            } else {
                stroke(255, 0, 0);
            }
            line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
        }
    }
}