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

let danceMoves = ['Y-Pose.json', 'T-Pose.json', 'rightArmUp.json']

let targetPose = null;

//This is our score, always starts at 0
var score = 0;

function loadTarget() {
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
            targetPose.target = true;
        }
    };
    xobj.send(null);
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
}

function modelReady() {
    select("#status").html("Model Loaded");
    select("#score").html("Score: " + score);
}

function draw() {
    image(video, 0, 0, width, height);

    // We can call both functions to draw all keypoints and the skeletons
    drawKeypoints();
    drawSkeleton();
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

let maxMatches = 0;

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
    if (!targetPose) return;
    poses.push(targetPose);

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
                if (poses[i].pose.target) {
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
            score++;
            select("#score").html("Score: " + score);
            loadTarget();
        }
    }
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
