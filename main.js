const video = document.querySelector('video');
const canvas = window.canvas = document.querySelector('canvas');
const ctx = canvas.getContext("2d");
let poseNet;
let poses = [];
let goodpoints = [];

let danceMoves = ['Y-pose.json', 'T-pose.json', 'rightArmUp.json']

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
    let secondsUp = time % 60;
    let secondsDown = 10 - secondsUp;
    countdownEl.innerHTML = "Seconds till next pose: " + secondsDown;
    time++;

    if(time == 10){
        loadTarget();
        time = 0;
    }
}


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

    // Add the target pose
    if (targetPose) poses.push(targetPose);

    // We can call both functions to draw all keypoints and the skeletons
    drawKeypoints();
    drawSkeleton();
    
    // Seperate out pose matching from drawing
    matchPose();

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

function matchPose(){
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
            document.querySelector("#score").innerHTML = "Score: " + score;
        }
        else{
            //Sing and wait for next pose!
        }
    }
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints() {
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
                    ctx.fillStyle = "#00ff00";
                } else {
                    ctx.fillStyle = "#FF0000";
                    goodpoints[j] = keypoint;
                }
                ctx.beginPath();
                ctx.ellipse(keypoint.position.x, keypoint.position.y, 7.5, 7.5,Math.PI*2,0,Math.PI*2);
                ctx.closePath();
                ctx.fill();
            }
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