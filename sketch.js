// Copyright (c) 2019 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet example using p5.js
=== */

/* General Notes about how things work
    - "console.log"ing the poses doesn't show their keypoints in the correct order - check a json file for the right order
    - skeleton is not always full - only as many lines as are found
*/


let video;
let poseNet;
let poses = [];
let goodpoints = [];

let danceMoves = ['Y-pose.json', 'T-pose.json', 'rightArmUp.json']

var testMove = 'Y-pose.json';

let testPose = null;

let targetPose = null;

document.getElementById("calibrateButton").addEventListener("click",  testPose = function scaleTestA() {
    console.log("Hey we had a click event! This is the poses array: ");
    console.log(poses);

    let shouldersIndex = findSkeletonElement("rightShoulder", "leftShoulder", poses[0].skeleton);
    //Just some stuff to get the right-left shoulder distance
    //THIS ASSUMES THE RIGHT SHOULDER IS THE SECOND IN THE ARRAY (pretty sure ml5 always does it that way)
    //let rShoulderPoint = new Point(poses[0].skeleton[shouldersIndex][1].position.x, poses[0].skeleton[shouldersIndex][1].position.y);
    //let lShoulderPoint = new Point(poses[0].skeleton[shouldersIndex][0].position.x, poses[0].skeleton[shouldersIndex][0].position.y);
    //x and y are measured from top-right, so I'd recommend using rShoulder as the absolute point when we get to that (I think)
    //let shDistance = rShoulderPoint.distanceTo(lShoulderPoint);

    //testPose = scaleToShoulders(testPose, shDistance);

    //I think this needs to be a return - directly editing testPose leaves it... undefined
    return scaleAndShift(testPose, poses[0].skeleton[shouldersIndex]);

    console.log("The pose at the outer layer, after being changed: ");
    console.log(testPose);
}
);

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
    //MAYBE. On reflection I think the errors might've been that if (xobj.readyState...) was evaluating to false and causing errors?

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
            //score += 2;
            
            //Edit pose values here
            for (let j = 5; j < ppose.keypoints.length - 4; j++) {
                // A keypoint is an object describing a body part (like rightArm or leftShoulder)
                let keypoint = ppose.keypoints[j];

                //keypoint.position.x *= 0.5;
                //keypoint.position.y *= 0.5;

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

                //boneStart.position.x *= 0.5;
                //boneStart.position.y *= 0.5;

                //boneEnd.position.x *= 0.5;
                //boneEnd.position.y *= 0.5;

                //let distance = getDistance(boneStart.position.x, boneStart.position.y, boneEnd.position.x, boneEnd.position.y);
                //console.log("Length of testPose skeleton line " + i + ": " + distance);
            }

            //testPose = scaleToShoulders(testPose, 30);

            //if (poses[0] != undefined){
                //Just some stuff to get the right-left shoulder distance
                //let rShoulderPoint = new Point(poses[2].skeleton[6][1].position.x, poses[2].skeleton[6][1].position.y);
                //let lShoulderPoint = new Point(poses[2].skeleton[6][0].position.x, poses[2].skeleton[6][0].position.y);
                //x and y are measured from top-right, so I'd recommend using rShoulder as the absolute point when we get to that (I think)
                //let shDistance = rShoulderPoint.distanceTo(lShoulderPoint);

                //testPose = scaleToShoulders(testPose, shDistance);
            //}
        }
    };
    xobj.send(null);
    
    console.log(testPose);

    //score += 1;

    // For test pose, loop through all the keypoints
    //console.log(testPose);
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

    console.log("This is poses after target is loaded: ");
    console.log(poses);

    //Just some stuff to get the right-left shoulder distance
    //let rShoulderPoint = new Point(poses[0].pose.skeleton[6][1].position.x, poses[0].pose.skeleton[6][1].position.y);
    //let lShoulderPoint = new Point(poses[0].pose.skeleton[6][0].position.x, poses[0].pose.skeleton[6][0].position.y);
    //x and y are measured from top-right, so I'd recommend using rShoulder as the absolute point when we get to that (I think)
    //let shDistance = rShoulderPoint.distanceTo(lShoulderPoint);

    loadScaledTarget();
}

function modelReady() {
    select("#status").html("Model Loaded");
    select("#score").html("Score: " + score);

    //console.log("This is poses after model is loaded: ");
    //console.log(poses);

    //Just some stuff to get the right-left shoulder distance
    //let rShoulderPoint = new Point(poses[0].pose.skeleton[6][1].position.x, poses[0].pose.skeleton[6][1].position.y);
    //let lShoulderPoint = new Point(poses[0].pose.skeleton[6][0].position.x, poses[0].pose.skeleton[6][0].position.y);
    //x and y are measured from top-right, so I'd recommend using rShoulder as the absolute point when we get to that (I think)
    //let shDistance = rShoulderPoint.distanceTo(lShoulderPoint);

    //testPose = scaleToShoulders(testPose, shDistance);
}

function draw() {
    image(video, 0, 0, width, height);

    // We can call both functions to draw all keypoints and the skeletons

    //Scale testPose maybe please maybe I hope
    //scaleTest(targetPose);

    //Add the targetPose
    if (!targetPose) return;
    //poses.push(targetPose);
    poses.push(testPose);
    drawKeypoints();
    drawSkeleton();
    //Remove the targetPose
    //poses.pop();
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

//function scaleTest(poseArray){
//    var ppose = poseArray.pose;
//    score += 2;
//    Bgoodpoints = [];
    //score += 1;
//    for (let j = 5; j < 13; j++) {
        // A keypoint is an object describing a body part (like rightArm or leftShoulder)
//        let keypoint = ppose.keypoints[j];

//        keypoint.position.x = 100;
//        keypoint.position.y = 100;
//    }
//}

/**
 * Creates an enumerator for an array of variables - their numerical values match their index
 * @param {array} values 
 * @returns An enumerator
 */
function Enum(values){
    for (let i = 0; i< values.length; ++i){
        this[values[i]] = i;
    }
    return this;
}

/**
 * Gets the direct distance between two 2D points (just pythagoras').
 * The result is always positive. Also looks like we already have one of these...
 * @param {*} x1 x coord of first point (assumed smaller than x2 but works anyway)
 * @param {*} y1 y coord of first point (ditto for y2)
 * @returns {number} Positive distance between points
 */
function getDistance(x1, y1, x2, y2) {
    //sqrt((x2-x1)^2 + (y2-y1)^2)
    let answer = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    return answer;
}

/**
 * Is an array with just one copy of every point on a pose.
 * Could just use an array but then how would we do cool function 
 * shenanigans?
 * @param {object} pose 
 */
function minimalKeypoints(pose){
    //Loop through keypoints
    let i = 0;
    for (i = 0; i < pose.pose.keypoints.length; ++i){
        let keypoint = pose.pose.keypoints[i];
        this[i] = {position : new Point(keypoint.position.x, keypoint.position.y), part : keypoint.part};
    }

    this.length = i;

    /**
     * Checks if a part is in the minimalKeypoints array, if so, returns its index
     * @param {*} lookingFor the name of the part to look for
     * @returns -1 if not found, its index in the array if found
     */
    function findElement(lookingFor){
        for (i = 0; i < this.length; ++i){
            let keypoint = this[i];
            if (this[i].part == lookingFor){
                return i;
            }
        }
        return -1;
    }

    console.log("Made a minimal keypoints array:");
    console.log(this);
}

/**
     * Checks if a part is in the minimalKeypoints array, if so, returns its index
     * @param {*} lookingFor the name of the part to look for
     * @returns -1 if not found, its index in the array if found
     */
 function findElement(lookingFor, minKeyPoints){
    for (i = 0; i < minKeyPoints.length; ++i){
        if (minKeyPoints[i].part == lookingFor){
            return i;
        }
    }
    return -1;
}

/**
     * Checks if a pair of parts is in the skeleton array, if so, returns its index
     * @param {*} lookingFor1 the name of one of the parts to look for
     * @param {*} lookingFor2 the name of the other part to look for
     * @param {*} skeleton a skeleton array (from in a pose) to search through
     * @returns -1 if not found, the index of the pair in the array if found
     */
 function findSkeletonElement(lookingFor1, lookingFor2, skeleton){
    let foundCount = 0;
    for (i = 0; i < skeleton.length; ++i){
        for (j = 0; j < 2; ++j){
            if (skeleton[i][j].part == lookingFor1 || skeleton[i][j].part == lookingFor2){
                foundCount++;
            }
        }
        if (foundCount == 2){
            return i;
        }
        foundCount = 0;
    }
    return -1;
}

/**
 * Scales a pose relative to a given shoulder-to-shoulder distance (just overall size, not body shape)
 * @param {object} pose A pose object to be scaled
 * @param {number} scaleToDistance The right-left shoulder distance we want to scale the pose to
 * @returns {object} The altered pose object (hopefully it doesn't just alter the original...?)
 */
function  scaleToShoulders(pose, scaleToDistance) {
    //SOMEWHERE IT"S MORE ABSOLUTE THAN RELATIVE WHEN MEASURING THEIR POSITION


    //skeleton[6] is the line from left to right shoulder
    //focusShoulder = pose.skeleton[6][0]
    let rShoulderPoint = new Point(pose.skeleton[6][1].position.x, pose.skeleton[6][1].position.y);
    let lShoulderPoint = new Point(pose.skeleton[6][0].position.x, pose.skeleton[6][0].position.y);
    //x and y are measured from top-right, so I'd recommend using rShoulder as the absolute point when we get to that (I think)
    let shDistance = rShoulderPoint.distanceTo(lShoulderPoint);
    
    console.log("The shoulder distance to scale to: " + scaleToDistance);
    console.log("The shoulder distance of the actual pose, unchanged: " + shDistance);

    let multiplier = scaleToDistance/shDistance;

    console.log("The multiplier: " + multiplier);

    //for (let j = 0; j < pose.pose.length; j++) {
    //    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    //    //I really need a better name for pose
    //    let keypoint = pose.pose.keypoints[j];
    //
    //    keypoint.position.x *= multiplier;
    //    keypoint.position.y *= multiplier;
    //}

    //Option 3
    let pointsArray = new minimalKeypoints(pose);
    //let pointsArray = [];

    //for (let i = 0; i < pose.pose.keypoints.length; ++i){
        //let keypoint = pose.pose.keypoints[i];
        //pointsArray[i] = new Point(keypoint.position.x, keypoint.position.y);
    //}

    //for (let i = 0; i < pose.pose.keypoints.length; ++i){
        //let keypoint = pose.pose.keypoints[i];
        //let newXDistance = (keypoint.position.x - rShoulderPoint.x) * multiplier;
        //let newYDistance = (keypoint.position.y - rShoulderPoint.y) * multiplier;
        //keypoint.position.x = rShoulderPoint.x + newXDistance;
        //keypoint.position.y = rShoulderPoint.y + newYDistance;
    //}

    console.log("This is the minimal keypoints array again: ");
    console.log(pointsArray);

    console.log(pointsArray.length);

    for (let i = 0; i < pointsArray.length; ++i){
        //let keypoint = pointsArray[i];
        let newXDistance = (pointsArray[i].position.x - rShoulderPoint.x) * multiplier;
        let newYDistance = (pointsArray[i].position.y - rShoulderPoint.y) * multiplier;
        pointsArray[i].position.x = rShoulderPoint.x + newXDistance;
        pointsArray[i].position.y = rShoulderPoint.y + newYDistance;
        console.log(pointsArray[i].x);
    }

    console.log("And now, after it has been changed: ");
    console.log(pointsArray);

    //For the keypoints
    for (let i = 0; i < pose.pose.keypoints.length; ++i){
        let keypoint = pose.pose.keypoints[i];
        console.log("The current keypoint: ");
        console.log(keypoint);
        keypoint.position.x = pointsArray[i].position.x;
        keypoint.position.y = pointsArray[i].position.y;
    }

    //What about the ones just hangin in neither

    //For the skeleton
    for (let i = 0; i < pose.skeleton.length; i++) {
        for (let j = 0; j < 2; ++j){
            let partFoundAt = findElement(pose.skeleton[i][j].part, pointsArray);
            if (partFoundAt > -1){
                pose.skeleton[i][j].position.x = pointsArray[partFoundAt].position.x;
                pose.skeleton[i][j].position.y = pointsArray[partFoundAt].position.y;
            }
        }
    }

    console.log("The pose, all edited yay: ");
    console.log(pose);

    //Create an enum for iterating in the correct order - maybe not? Maybe just an array of references.
    //After skeleton[1], could input skeleton[7] (right-left hips), or could not. 
    // The points of that line need to be changed, but they have already been changed in other skeleton lines. 
    // Depends how we change all the other points.
    //let skeletonOrder = Enum(new [skeleton[6], , skeleton[5], skeleton[2], skeleton[0], skeleton[1], skeleton[7], skeleton[4], skeleton[3]])
    //I am assuming these are references, so the og's are getting edited
    //let skeletonInOrder = [pose.skeleton[6], pose.skeleton[5], pose.skeleton[2], pose.skeleton[0], pose.skeleton[1], pose.skeleton[7], pose.skeleton[4], pose.skeleton[3]];

    //console.log("The original skeleton info, reordered: " + skeletonInOrder);
    //Maybe will need 2D array with all the places where every point can be found and must be edited

    //for (let i = 0; i < skeletonInOrder.length; i++) {
        //Need to:
        //  Start by editing right-left shoulder first (if right shoulder is the absolute point)
        //      Calculate slope of the line
        //      Calculate distance of the line
        //      Use multiplier to get the distance we want
        //      Use this and slope to work out the x and y points that need to replace the second point (furthest point from absolute point)
        //      Save those points
        //  Rinse repeat, but in order like a graph
        
        //console.log("Current skeleton line: ");
        //console.log(skeletonInOrder[i]);

        //Hopefully the points just happen to always be in the order of:
        //      1 = predetermined point, 2 = point to change
        //      They are! except for 4 and 3 (right and left elbow-wrist)
        //let pointinit = new Point(skeletonInOrder[i][1].position.x, skeletonInOrder[i][1].position.y);
        //let pointfin = new Point(skeletonInOrder[i][0].position.x, skeletonInOrder[i][0].position.y);

        //A value from 0 to 1 for slope (1 = 90deg, 0 = 0deg). If one value is negative, answer is negative and if both are, positive
        //let slope = Math.atan((pointfin.y - pointinit.y) / (pointfin.x - pointinit.x));

        //Fancy slope calculation
        //let Dy = pointfin.y - pointinit.y;
        //let Dx = pointfin.x - pointinit.x;
        //let slope = Math.atan(Math.abs(Dy)**(Dy/Dy) / Math.abs(Dx)**(Dx/Dx));

        //console.log("Slope of this line: " + slope);

        //let slength = pointinit.distanceTo(pointfin);

        //console.log("The original length of " + skeletonInOrder[i][1].part + " to " + skeletonInOrder[i][0].part + ": " + slength);

        //let newlength = slength * multiplier;

        //console.log("The new length of " + skeletonInOrder[i][1].part + " to " + skeletonInOrder[i][0].part + ": " + newlength);

        //I wonder if changing point1.x will change pose.skeleton[i][1].position.x? - Doesn't seem to
        //skeletonInOrder[i][0].position.x = pointinit.x + newlength * Math.acos(slope) * (Dx/Dx);//slope);
        //skeletonInOrder[i][0].position.y = pointinit.y + newlength * Math.asin(slope) * (Dy/Dy);//slope);

        //console.log("Changed skeleton line: ");
        //console.log(skeletonInOrder[i]);

        //Now the problem is - we can't just use point1 to calculate. Here are the fixes (I can think of)
        //      1.  Have an array newpoints[] to store the future value of every point (no duplicates if poss - map all the other 
        //          points to refer to the one indexed/key-accessed value), and leave point1 (and all the points) as they are. 
        //          That way slength and slope will be the right value, but the new point for point2 can be calculated based on 
        //          the new point1.
        //      2.  Get all the slengths and slopes in an array before we start editing values, then edit them all and update the 
        //          minimalist array of all points as we go, then finally update all points.
        //      3.  Just multiply every value by the multiplier (except rightShoulder). Use the simple array trick if poss.

        //let distance = getDistance(boneStart.position.x, boneStart.position.y, boneEnd.position.x, boneEnd.position.y);
        //console.log("Length of testPose skeleton line " + i + ": " + distance);
    //}

    return pose;
}

function scaleAndShift(pose, skeletonBone) {

    //Find the skeleton pair across the shoulders
    //let shouldersIndex = findSkeletonElement("rightShoulder", "leftShoulder", poses[0].skeleton);
    //Just some stuff to get the right-left shoulder distance
    //THIS ASSUMES THE RIGHT SHOULDER IS THE SECOND IN THE ARRAY (pretty sure ml5 always does it that way)
    let rShoulderPoint = new Point(skeletonBone[1].position.x, skeletonBone[1].position.y);
    let lShoulderPoint = new Point(skeletonBone[0].position.x, skeletonBone[0].position.y);
    //x and y are measured from top-right, so I'd recommend using rShoulder as the absolute point when we get to that (I think)
    let shDistance = rShoulderPoint.distanceTo(lShoulderPoint);

    let thisRShoulder = new Point(pose.pose.keypoints[6].position.x, pose.pose.keypoints[6].position.y);     //6 is the index of the right shoulder
    //VERY IMPORTANT to make this a point so that it won't change as the pose is being changed
    //That was the bug that was making me big sad

    //Make sure that the pose has a right shoulder
    if (thisRShoulder == undefined){
        return;
    }

    console.log("keypoints length: ");
    console.log(pose.pose.keypoints);

    console.log("thisRShoulder");
    console.log(thisRShoulder);

    console.log("rShoulderPoint");
    console.log(rShoulderPoint);

    //Debugging:
    //  Skeleton is getting shifted towards rShoulder by the same x and y every time this runs (If the keypoint for loop loops until j= 
    //      1,2,3,4,5)
    //  Skeleton AND relevent point gets shifted (in the same, wrong way) for j = 
    //      6
    //  Just the first 2 points (and not the skeleton at all) moves completely correctly for j = 
    //      7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17
    //  And the same but with an "TypeError - thing is undefined" error for j = 
    //      18, 40, 60, 66

    for (let j = 0; j < pose.pose.keypoints.length; j++) {
        console.log(j);

        // A keypoint is an object describing a body part (like rightArm or leftShoulder)
        let keypoint = pose.pose.keypoints[j];

        console.log("pose.pose.keypoints[j] pre-change");
        console.log(pose.pose.keypoints[j]);
        
        pose.pose.keypoints[j].position.x = pose.pose.keypoints[j].position.x - thisRShoulder.x + rShoulderPoint.x;
        console.log("pose.pose.keypoints[j].position.x: " + keypoint.position.x);
        pose.pose.keypoints[j].position.y = pose.pose.keypoints[j].position.y - thisRShoulder.y + rShoulderPoint.y;
        console.log("pose.pose.keypoints[j].position.y: " + pose.pose.keypoints[j].position.y);

        console.log("pose.pose.keypoints[j] post-change");
        console.log(pose.pose.keypoints[j]);
    }
    //What about the loose points not in keypoints or skeleton?

    for (let i = 0; i < pose.skeleton.length; i++) {
        let boneStart = pose.skeleton[i][0];
        let boneEnd = pose.skeleton[i][1];

        pose.skeleton[i][0].position.x = pose.skeleton[i][0].position.x - thisRShoulder.x + rShoulderPoint.x;
        pose.skeleton[i][0].position.y = pose.skeleton[i][0].position.y - thisRShoulder.y + rShoulderPoint.y;

        pose.skeleton[i][1].position.x = pose.skeleton[i][1].position.x - thisRShoulder.x + rShoulderPoint.x;
        pose.skeleton[i][1].position.y = pose.skeleton[i][1].position.y - thisRShoulder.y + rShoulderPoint.y;

    }

    console.log("The shifted, unscaled pose: ");
    console.log(pose);
    pose = scaleToShoulders(pose, shDistance);

    console.log("The shifted and scaled pose: ");
    console.log(pose);

    return pose;
}

let maxMatches = 0;

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
    //console.log("poses at the start of every drawKeyPoints()");
    //console.log(poses);

    //Just some stuff to get the right-left shoulder distance
    //let rShoulderPoint = new Point(poses[0].skeleton[6][1].position.x, poses[0].skeleton[6][1].position.y);
    //let lShoulderPoint = new Point(poses[0].skeleton[6][0].position.x, poses[0].skeleton[6][0].position.y);
    //x and y are measured from top-right, so I'd recommend using rShoulder as the absolute point when we get to that (I think)
    //let shDistance = rShoulderPoint.distanceTo(lShoulderPoint);

    //testPose = scaleToShoulders(testPose, shDistance);

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
                ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
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