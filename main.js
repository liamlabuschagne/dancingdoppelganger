const video = document.querySelector('video');
const canvas = window.canvas = document.querySelector('canvas');
const ctx = canvas.getContext("2d");
let poseNet;
let poses = [];
let goodpoints = [];

let danceMoves = ['Y-pose.json', 'T-pose.json', 'rightArmUp.json']

let targetPose = null;

let absShoulderPair = undefined;
let calibratedFlag = false;

document.getElementById("calibrateButton").addEventListener("click", function flagFlip() {
    console.log("Hey the clicky thing worked");
    calibratedFlag = !calibratedFlag;
    console.log(calibratedFlag);
}
);

//This is our score, always starts at 0
var score = 0;
var scoreAudio = document.getElementById("scoreAudio");

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

    if(time == 10){
        loadTarget();
        time = 0;
    }
}

function loadTarget() {
    document.body.style.backgroundColor = "white";
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
            targetPose.target = true;
        }
    };
    xobj.send(null);
}

// Attach webcam feed into video as it's source
navigator.mediaDevices.getUserMedia({audio: false,video: true}).then((stream)=>{
    video.srcObject = stream;
    video.hidden = true;

    // Once the video has loaded that stream, start the main setup
    video.addEventListener("loadeddata", () => {
        setup();
    });

}).catch((error) => {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
});

function setup() {
    canvas.width = video.videoWidth;// / video.videoWidth * window.innerWidth;
    canvas.height = video.videoHeight;// / video.videoWidth * window.innerWidth;
    video.width = video.videoWidth;
    video.height = video.videoHeight;

    // Create a new poseNet method with a single detection
    poseNet = ml5.poseNet(video,() =>{
        document.querySelector("#status").innerHTML = "Model Loaded";
        document.querySelector("#score").innerHTML = "Score: " + score;
    });
    // poseNet.detectionType = "single";
    poseNet.on("pose", function (results) {
        poses = results;
    });
    loadTarget();

    draw();
}

function draw() {
    // Clear the screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the camera input on the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    //Scale and shift the target pose to match the player
    //  Is just in draw for now - not sure if this is the best place?
    //Note:     The first pose in the poses array seems to usually be the most prominent pose that ml5 has returned, I think?
    //              So this even works when multiple people on-screen.
    if (poses[0] != undefined){
        if (calibratedFlag == false){
            console.log("calibratedFlag was false." + calibratedFlag);
            //Find the element which has the pair of shoulders from the first pose in the poses array
            let shouldersIndex = findSkeletonElement("rightShoulder", "leftShoulder", poses[0].skeleton);

            //If the shoulders were found
            if (shouldersIndex > -1){
                //Scale and shift targetPose to the first pose in the poses array
                //targetPose = scaleAndShift(targetPose, poses[0].skeleton[shouldersIndex]);
                calibrate(targetPose, poses[0].skeleton[shouldersIndex]);
            }
        }
        else {
            console.log("calibratedFlag was true.");
            scaleAndShift(targetPose, absShoulderPair);
        }
    }

    // Add the target pose
    if (targetPose) poses.push(targetPose);

    // We can call both functions to draw all keypoints and the skeletons
    drawKeypoints();
    drawSkeleton();

    // Seperate out pose matching from drawing
    matchPose();

    //clear goodpoints
    goodpoints = [];

    //console.log("Poses: ");
    //console.log(poses);
    //console.log("Score: ");
    //console.log(score);

    //Not sure if this should go here but pretty sure we need it
    //if (targetPose) poses.pop(targetPose);
    
    //console.log(poses);

    // Call draw recursively every frame (max 60fps)
    requestAnimationFrame(draw);
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
    //if (goodpoints.length > 0){
    //    console.log("This is goodpoints within pointMatches function: ");
    //    console.log(goodpoints);
    //}
    if (!goodpoints[part]) return false;
    let actual = new Point(goodpoints[part].x, goodpoints[part].y);
    let target = new Point(targetPose.pose.keypoints[part].position.x, targetPose.pose.keypoints[part].position.y);

    let distance = actual.distanceTo(target);
    if (distance < 100) {
        return true;
    } else {
        return false;
    }
}

function matchPose(){
    //if (goodpoints.length > 0){
    //    console.log("This is goodpoints within matchPose function: ");
    //    console.log(goodpoints);
    //} 
    // Compare only main body sections
    let matches = 0;
    for (let i = 5; i < 12; i++) {
        if (pointMatches(i)) {
            matches++;
        }
    }

    if(time == 9){
        if (matches == 7) {
            //Adds 10 to the score
            if(!hasDonePose){
                document.body.style.backgroundColor = "green";
                hasDonePose = true;
                score += 3;
                document.querySelector("#score").innerHTML = "Score: " + score;
            }
            else{
                //Sing and wait for next pose!
            }
        }
        if (matches == 6) {
            //Adds 10 to the score
            if(!hasDonePose){
                document.body.style.backgroundColor = "green";
                hasDonePose = true;
                score += 2;
                document.querySelector("#score").innerHTML = "Score: " + score;
            }
            else{
                //Sing and wait for next pose!
            }
        }
        if (matches == 5) {
            //Adds 10 to the score
            if(!hasDonePose){
                document.body.style.backgroundColor = "green";
                hasDonePose = true;
                score += 1;
                document.querySelector("#score").innerHTML = "Score: " + score;
            }
            else{
                //Sing and wait for next pose!
            }
        }
    }
}
// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i += 1) {
        // For each pose detected, loop through all the keypoints
        let pose = poses[i].pose;
        //goodpoints = [];
        for (let j = 5; j < 13; j++) {
            // A keypoint is an object describing a body part (like rightArm or leftShoulder)
            let keypoint = pose.keypoints[j];
            // Only draw an ellipse if the pose probability is bigger than 0.2
            if (keypoint.score > 0.2) {
                if (poses[i].pose.target) {
                    ctx.fillStyle = "#00ff00";
                } else {
                    ctx.fillStyle = "#FF0000";
                    goodpoints[j] = new Point(keypoint.position.x, keypoint.position.y);
                }
                ctx.beginPath();
                ctx.ellipse(keypoint.position.x, keypoint.position.y, 7.5, 7.5,Math.PI*2,0,Math.PI*2);
                ctx.closePath();
                ctx.fill();
            }
        }   
        //if (goodpoints.length > 0){
        //    console.log("This is goodpoints within drawKeypoints function: ");
        //    console.log(goodpoints);
        //}
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
                ctx.strokeStyle = "#00FF00";
            } else {
                ctx.strokeStyle = "#FF0000";
            }
            ctx.beginPath();
            ctx.moveTo(partA.position.x, partA.position.y)
            ctx.lineTo(partB.position.x, partB.position.y);
            ctx.closePath();
            ctx.stroke();
        }
    }
}

//###------------------------------------------------------------------------Start of scaleAndShift functions--------------------------------------------------------------------###

/**
 * Is an array with just one copy of every point on a pose - no double-ups.
 * Could just use an array but then how would we do cool function 
 * shenanigans?
 * @param {object} pose 
 */
 function minimalKeypoints(pose){
    //Loop through keypoints
    let i = 0;
    for (i = 0; i < pose.pose.keypoints.length; ++i){
        //keypoint = the current keypoint
        let keypoint = pose.pose.keypoints[i];
        //Save at this index a position Point and the name of this part
        this[i] = {position : new Point(keypoint.position.x, keypoint.position.y), part : keypoint.part};
    }

    //Gives a minimalKeypoints array a length value
    this.length = i;

    //console.log("Made a minimal keypoints array:");
    //console.log(this);
}

/**
     * Checks if a part is in the **minimalKeypoints** array, if so, returns its index.
     * (only works for minimalKeypoints)
     * @param {*} lookingFor the name of the part to look for
     * @returns -1 if not found, its index in the array if found
     */
 function findElement(lookingFor, minKeyPoints){
    //Loop through array
    for (i = 0; i < minKeyPoints.length; ++i){
        if (minKeyPoints[i].part == lookingFor){
            //Return the index of the element with this part name
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
    for (i = 0; i < skeleton.length; ++i){  //Loop through each pair
        for (j = 0; j < 2; ++j){            //Loop through both items in this pair
            if (skeleton[i][j].part == lookingFor1 || skeleton[i][j].part == lookingFor2){ 
                //If this is either of the parts we want, increment foundCount
                foundCount++;
            }
        }
        if (foundCount == 2){
            //Both parts match, so return the index of this pair
            return i;
        }
        //Else its not this pair, so reset foundCount before next pair
        foundCount = 0;
    }
    //It wasn't found, return -1
    return -1;
}

/**
 * Scales a pose relative to a given shoulder-to-shoulder distance (just overall size, not body shape)
 * @param {object} pose A pose object to be scaled
 * @param {number} scaleToDistance The right-left shoulder distance we want to scale the pose to
 * @returns {object} The altered pose object (hopefully it doesn't just alter the original...?)
 */
 function  scaleToShoulders(pose, scaleToDistance) {
    //x and y are measured from top-right, so I've used rShoulder as the absolute point
    //skeleton[6] is the line from left to right shoulder. [1] is right, [0] is left (I think ml5 just always returns it in this order)

    //NOW THAT I KNOW MORE, I'm considering changing these to access keypoints instead of skeleton.
    // Keypoints always have a value - even if it's bad. skeleton can be totally empty if it doesn't detect both points.
    // Not sure which is best tho. It doesn't crash if there's no skeleton pair, just throws an error and continues.

    //Create new (so not referencing the original - very important to avoid in javascript) Points for the right and left shoulder of the input pose
    let rShoulderPoint = new Point(pose.skeleton[6][1].position.x, pose.skeleton[6][1].position.y);
    let lShoulderPoint = new Point(pose.skeleton[6][0].position.x, pose.skeleton[6][0].position.y);

    //Calculate current shoulder-distance of input pose
    let shDistance = rShoulderPoint.distanceTo(lShoulderPoint);
    
    //console.log("The shoulder distance to scale to: " + scaleToDistance);
    //console.log("The shoulder distance of the actual pose, unchanged: " + shDistance);

    //Calculate ratio of desiredShoulderDistance/currentShoulderDistance
    let multiplier = scaleToDistance/shDistance;

    //console.log("The multiplier: " + multiplier);

    //Use a minimalKeypoints array so life is simpler. Editing this doesn't edit the original.
    let pointsArray = new minimalKeypoints(pose);

    //console.log("This is the minimal keypoints array again: ");
    //console.log(pointsArray);

    //console.log(pointsArray.length);

    //Loop through minimalKeypoints array
    for (let i = 0; i < pointsArray.length; ++i){
        //let keypoint = pointsArray[i];

        //Scale the x and y distance from the original rightShoulder by the multiplier
        let newXDistance = (pointsArray[i].position.x - rShoulderPoint.x) * multiplier;
        let newYDistance = (pointsArray[i].position.y - rShoulderPoint.y) * multiplier;

        //Add this to the rShoulderPoint to get the new x,y position
        pointsArray[i].position.x = rShoulderPoint.x + newXDistance;
        pointsArray[i].position.y = rShoulderPoint.y + newYDistance;
        //console.log(pointsArray[i].x);
    }

    //console.log("And now, after it has been changed: ");
    //console.log(pointsArray);

    //For the keypoints
    for (let i = 0; i < pose.pose.keypoints.length; ++i){
        let keypoint = pose.pose.keypoints[i];
        //console.log("The current keypoint: ");
        //console.log(keypoint);

        //Copy the x,y values from pointsArray 
        keypoint.position.x = pointsArray[i].position.x;
        keypoint.position.y = pointsArray[i].position.y;
    }

    //What about the ones just hangin in neither?

    //For the skeleton
    for (let i = 0; i < pose.skeleton.length; i++) {    //For each pair
        for (let j = 0; j < 2; ++j){                    //Loop through both parts in this pair
            //Find this part in pointsArray
            let partFoundAt = findElement(pose.skeleton[i][j].part, pointsArray);
            if (partFoundAt > -1){      //If found, 
                //Copy the x,y values from pointsArray for this point
                pose.skeleton[i][j].position.x = pointsArray[partFoundAt].position.x;
                pose.skeleton[i][j].position.y = pointsArray[partFoundAt].position.y;
            }   //Can't really imagine this not finding the part btw, unless something's wrong
        }
    }

    //console.log("The pose, all edited yay: ");
    //console.log(pose);

    return pose;
}

/**
 * Takes a right and left shoulder pair and a pose. Scales the given pose to match the shoulders' size and 
 * positions it so that the right shoulders line up.
 * @param {*} pose The pose to be scaled and shifted
 * @param {*} skeletonBone The target shoulder position/scale. A right-left shoulder pair from a skeleton array
 * @returns pose, once shifted and scaled
 */
function scaleAndShift(pose, skeletonBone) {
    //x and y are measured from top-right, so I've used rShoulder as the absolute point

    //THIS ASSUMES THE RIGHT SHOULDER IS THE SECOND IN THE ARRAY (pretty sure ml5 always does it that way)
    //Save the two points as new right and left shoulder Points.
    let rShoulderPoint = new Point(skeletonBone[1].position.x, skeletonBone[1].position.y);
    let lShoulderPoint = new Point(skeletonBone[0].position.x, skeletonBone[0].position.y);
    
    //Calculate the distance between the two shoulders
    let shDistance = rShoulderPoint.distanceTo(lShoulderPoint);

    //Save the original right shoulder position of the pose to change
    let thisRShoulder = new Point(pose.pose.keypoints[6].position.x, pose.pose.keypoints[6].position.y);     //6 is the index of the right shoulder
    //VERY IMPORTANT to make this a point so that it won't change as the pose is being changed
    //That was the bug that was making me big sad

    //Make sure that the pose has a right shoulder
    if (thisRShoulder == undefined){
        return;
    }

    //console.log("keypoints length: ");
    //console.log(pose.pose.keypoints);

    //console.log("thisRShoulder");
    //console.log(thisRShoulder);

    //console.log("rShoulderPoint");
    //console.log(rShoulderPoint);

    for (let j = 0; j < pose.pose.keypoints.length; j++) {
        //console.log(j);

        //The current keypoint
        let keypoint = pose.pose.keypoints[j];

        //console.log("pose.pose.keypoints[j] pre-change");
        //console.log(pose.pose.keypoints[j]);
        
        //Change the x and y of this point to the same distance from new rShoulderPoint (our target) as it was from thisRShoulder
        pose.pose.keypoints[j].position.x = pose.pose.keypoints[j].position.x - thisRShoulder.x + rShoulderPoint.x;
        //console.log("pose.pose.keypoints[j].position.x: " + keypoint.position.x);
        pose.pose.keypoints[j].position.y = pose.pose.keypoints[j].position.y - thisRShoulder.y + rShoulderPoint.y;
        //console.log("pose.pose.keypoints[j].position.y: " + pose.pose.keypoints[j].position.y);

        //console.log("pose.pose.keypoints[j] post-change");
        //console.log(pose.pose.keypoints[j]);
    }

    //What about the loose points not in keypoints or skeleton?

    for (let i = 0; i < pose.skeleton.length; i++) {
        let boneStart = pose.skeleton[i][0];
        let boneEnd = pose.skeleton[i][1];

        //Change both points to be the same distance from new rShoulderPoint (our target) as they were from thisRShoulder
        pose.skeleton[i][0].position.x = pose.skeleton[i][0].position.x - thisRShoulder.x + rShoulderPoint.x;
        pose.skeleton[i][0].position.y = pose.skeleton[i][0].position.y - thisRShoulder.y + rShoulderPoint.y;

        pose.skeleton[i][1].position.x = pose.skeleton[i][1].position.x - thisRShoulder.x + rShoulderPoint.x;
        pose.skeleton[i][1].position.y = pose.skeleton[i][1].position.y - thisRShoulder.y + rShoulderPoint.y;

    }

    //console.log("The shifted, unscaled pose: ");
    //console.log(pose);

    //Then, do the scaling using this edited pose and the calculated shoulder distance
    pose = scaleToShoulders(pose, shDistance);

    //console.log("The shifted and scaled pose: ");
    //console.log(pose);

    return pose;
}

function calibrate(pose, skeletonBone){
    //x and y are measured from top-right, so I've used rShoulder as the absolute point

    if (skeletonBone == undefined || skeletonBone == null){
        return;
    }

    absShoulderPair = skeletonBone;

    pose = scaleAndShift(pose, absShoulderPair);
}
