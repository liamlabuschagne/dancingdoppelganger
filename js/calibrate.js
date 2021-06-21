import Point from "./point.js";

/**
 * Is an array with just one copy of every point on a pose - no double-ups.
 * Could just use an array but then how would we do cool function 
 * shenanigans?
 * @param {object} pose 
 */
export function minimalKeypoints(pose) {
    //Loop through keypoints
    let i = 0;
    for (i = 0; i < pose.pose.keypoints.length; ++i) {
        //keypoint = the current keypoint
        let keypoint = pose.pose.keypoints[i];
        //Save at this index a position Point and the name of this part
        this[i] = { position: new Point(keypoint.position.x, keypoint.position.y), part: keypoint.part };
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
export function findElement(lookingFor, minKeyPoints) {
    //Loop through array
    for (let i = 0; i < minKeyPoints.length; ++i) {
        if (minKeyPoints[i].part == lookingFor) {
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
export function findSkeletonElement(lookingFor1, lookingFor2, skeleton) {
    let foundCount = 0;
    for (let i = 0; i < skeleton.length; ++i) {  //Loop through each pair
        for (let j = 0; j < 2; ++j) {            //Loop through both items in this pair
            if (skeleton[i][j].part == lookingFor1 || skeleton[i][j].part == lookingFor2) {
                //If this is either of the parts we want, increment foundCount
                foundCount++;
            }
        }
        if (foundCount == 2) {
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
export function scaleToShoulders(pose, scaleToDistance) {

    if (!pose || !pose.skeleton[6]) return; // Incomplete frame (no pose, or no shoulder pair)

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

    //Calculate ratio of desiredShoulderDistance/currentShoulderDistance
    let multiplier = scaleToDistance / shDistance;

    //Use a minimalKeypoints array so life is simpler. Editing this doesn't edit the original.
    let pointsArray = new minimalKeypoints(pose);

    //Loop through minimalKeypoints array
    for (let i = 0; i < pointsArray.length; ++i) {
        //let keypoint = pointsArray[i];

        //Scale the x and y distance from the original rightShoulder by the multiplier
        let newXDistance = (pointsArray[i].position.x - rShoulderPoint.x) * multiplier;
        let newYDistance = (pointsArray[i].position.y - rShoulderPoint.y) * multiplier;

        //Add this to the rShoulderPoint to get the new x,y position
        pointsArray[i].position.x = rShoulderPoint.x + newXDistance;
        pointsArray[i].position.y = rShoulderPoint.y + newYDistance;
    }

    //For the keypoints
    for (let i = 0; i < pose.pose.keypoints.length; ++i) {
        let keypoint = pose.pose.keypoints[i];

        //Copy the x,y values from pointsArray 
        keypoint.position.x = pointsArray[i].position.x;
        keypoint.position.y = pointsArray[i].position.y;
    }

    //What about the ones just hangin in neither?

    //For the skeleton
    for (let i = 0; i < pose.skeleton.length; i++) {    //For each pair
        for (let j = 0; j < 2; ++j) {                    //Loop through both parts in this pair
            //Find this part in pointsArray
            let partFoundAt = findElement(pose.skeleton[i][j].part, pointsArray);
            if (partFoundAt > -1) {      //If found, 
                //Copy the x,y values from pointsArray for this point
                pose.skeleton[i][j].position.x = pointsArray[partFoundAt].position.x;
                pose.skeleton[i][j].position.y = pointsArray[partFoundAt].position.y;
            }   //Can't really imagine this not finding the part btw, unless something's wrong
        }
    }

    return pose;
}

/**
 * Takes a right and left shoulder pair and a pose. Scales the given pose to match the shoulders' size and 
 * positions it so that the right shoulders line up.
 * @param {*} pose The pose to be scaled and shifted
 * @param {*} skeletonBone The target shoulder position/scale. A right-left shoulder pair from a skeleton array
 * @returns pose, once shifted and scaled
 */
export function scaleAndShift_shoulders(pose, skeletonBone) {
    if (!pose) return;
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
    if (thisRShoulder == undefined) {
        return;
    }

    for (let j = 0; j < pose.pose.keypoints.length; j++) {
        //The current keypoint
        let keypoint = pose.pose.keypoints[j];

        //Change the x and y of this point to the same distance from new rShoulderPoint (our target) as it was from thisRShoulder
        pose.pose.keypoints[j].position.x = pose.pose.keypoints[j].position.x - thisRShoulder.x + rShoulderPoint.x;
        pose.pose.keypoints[j].position.y = pose.pose.keypoints[j].position.y - thisRShoulder.y + rShoulderPoint.y;
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

    //Then, do the scaling using this edited pose and the calculated shoulder distance
    pose = scaleToShoulders(pose, shDistance);

    return pose;
}

/**
 * Scales and shifts a pose to match the player, and calculates the multiplier to use based on this calibration
 * @param {*} pose The pose to be scaled (and remembered outside this function for more calibrating later)
 * @param {*} shoulderBone The player's shoulder bone to scale to and calibrate to
 * @param {Point} thisRShoulder quick fix for an odd bug - is a Point holding x and y of pose's rShoulder
 * @param {Point} thisLShoulder quick fix for an odd bug - is a Point holding x and y of pose's lShoulder
 * @returns The multiplier to use (if you wanna match this calibration)
 */
export function calibrate(pose, shoulderBone, thisRShoulder, thisLShoulder) {
    //x and y are measured from top-right, so I've used rShoulder as the absolute point
    
    //NOTE: the pose seems to only have passed the information for a few layers deep into the object, so I was getting NaN as the values for the 
    //  x and y positions of the pose. I've never had that error before, kinda odd.

    if (shoulderBone == undefined || shoulderBone == null) {
        return;
    }

    //THIS ASSUMES THE RIGHT SHOULDER IS THE SECOND IN THE ARRAY (pretty sure ml5 always does it that way)
    //Save the shoulderBone's points as two new right and left shoulder Points.
    let targetRShoulder = new Point(shoulderBone[1].position.x, shoulderBone[1].position.y);
    let targetLShoulder = new Point(shoulderBone[0].position.x, shoulderBone[0].position.y);

    //Calculate the distance between the two shoulders
    let targetShDistance = targetRShoulder.distanceTo(targetLShoulder);

    //ASSUMPTION that there are a right and left shoulder in the given pose. Could handle errors better here

    console.log("pose.pose.keypoints[6]: ");
    console.log(pose.pose.keypoints[6]);
    console.log("pose.pose.keypoints[5]: ");
    console.log(pose.pose.keypoints[5]);

    console.log("thisRShoulder (parameter): ");
    console.log(thisRShoulder);
    console.log("thisLShoulder (parameter): ");
    console.log(thisLShoulder);

    //THIS ASSUMES THE RIGHT SHOULDER IS THE SECOND IN THE ARRAY (pretty sure ml5 always does it that way)
    //Save the pose's right and left shoulder points as two new right and left shoulder Points.
    //let thisRShoulder = new Point(pose.pose.keypoints[6].position.x, pose.pose.keypoints[6].position.y);    //6 is the index of the right shoulder
    //let thisLShoulder = new Point(pose.pose.keypoints[5].position.x, pose.pose.keypoints[5].position.y);    //5 is the index of the left shoulder

    //Calculate the distance between the two shoulders
    let thisShDistance = thisRShoulder.distanceTo(thisLShoulder);
    
    //let absShoulderPair = shoulderBone;

    //pose = scaleAndShift_shoulders(pose, shoulderBone);

    console.log("targetShDistance: " + targetShDistance);
    console.log("thisShDistance: " + thisShDistance);

    let multiplier = targetShDistance / thisShDistance;

    //console.log("multiplier within calibrate: " + multiplier);

    //Could perhaps write this to use multiplier and then remove the _shoulders one but hey the shoulders one was there already so why not
    //Scales and shifts to match with the player's shoulders
    scaleAndShift_shoulders(pose, shoulderBone);

    return multiplier;
}

/**
 * 
 * @param {*} pose The pose to be scaled
 * @param {number} multiplier equivalent to desiredShoulderDistance/currentShoulderDistance
 * @returns the pose once scaled
 */
export function scaleToMultiplier(pose, multiplier) {
    if (!pose) {
        alert("Error scaling that pose. \r\nPossible fixes: \r\n- Tell the dev team 'cause idk");
        return; // Incomplete frame (no pose)
    }
    let shouldersFoundAt = findSkeletonElement("rightShoulder", "leftShoulder", pose.skeleton);
    if (!shouldersFoundAt) {
        if (!pose.skeleton[shouldersFoundAt]){
            alert("Error finding shoulders on that pose. \r\nPossible fixes: \r\n- Tell the dev team 'cause idk");
            return; // Incomplete frame (no shoulder pair)
        }
    }
    console.log("pose in STMultiplier: ");
    console.log(pose);
    //x and y are measured from top-right, so I've used rShoulder as the absolute point
    //skeleton[6] is the line from left to right shoulder. [1] is right, [0] is left (I think ml5 just always returns it in this order)

    //NOW THAT I KNOW MORE, I'm considering changing these to access keypoints instead of skeleton.
    // Keypoints always have a value - even if it's bad. skeleton can be totally empty if it doesn't detect both points.
    // Not sure which is best tho. It doesn't crash if there's no skeleton pair, just throws an error and continues.

    //Create new (so not referencing the original - very important to avoid in javascript) Points for the right and left shoulder of the input pose
    let thisRShoulder = new Point(pose.skeleton[shouldersFoundAt][1].position.x, pose.skeleton[shouldersFoundAt][1].position.y);
    let lShoulderPoint = new Point(pose.skeleton[shouldersFoundAt][0].position.x, pose.skeleton[shouldersFoundAt][0].position.y);

    //Calculate current shoulder-distance of input pose
    //let shDistance = thisRShoulder.distanceTo(lShoulderPoint);

    //Calculate ratio of desiredShoulderDistance/currentShoulderDistance
    //let multiplier = scaleToDistance / shDistance;

    //Use a minimalKeypoints array so life is simpler. Editing this doesn't edit the original.
    let pointsArray = new minimalKeypoints(pose);

    //Loop through minimalKeypoints array
    for (let i = 0; i < pointsArray.length; ++i) {
        //let keypoint = pointsArray[i];

        //Scale the x and y distance from the original rightShoulder by the multiplier
        let newXDistance = (pointsArray[i].position.x - thisRShoulder.x) * multiplier;
        let newYDistance = (pointsArray[i].position.y - thisRShoulder.y) * multiplier;

        //Add this to the thisRShoulder to get the new x,y position
        pointsArray[i].position.x = thisRShoulder.x + newXDistance;
        pointsArray[i].position.y = thisRShoulder.y + newYDistance;
    }

    //For the keypoints
    for (let i = 0; i < pose.pose.keypoints.length; ++i) {
        let keypoint = pose.pose.keypoints[i];

        //Copy the x,y values from pointsArray 
        keypoint.position.x = pointsArray[i].position.x;
        keypoint.position.y = pointsArray[i].position.y;
    }

    //What about the ones just hangin in neither?

    //For the skeleton
    for (let i = 0; i < pose.skeleton.length; i++) {    //For each pair
        for (let j = 0; j < 2; ++j) {                    //Loop through both parts in this pair
            //Find this part in pointsArray
            let partFoundAt = findElement(pose.skeleton[i][j].part, pointsArray);
            if (partFoundAt > -1) {      //If found, 
                //Copy the x,y values from pointsArray for this point
                pose.skeleton[i][j].position.x = pointsArray[partFoundAt].position.x;
                pose.skeleton[i][j].position.y = pointsArray[partFoundAt].position.y;
            }   //Can't really imagine this not finding the part btw, unless something's (very) wrong
        }
    }

    return pose;
}

/**
 * For scaling and shifting a pose based on a multiplier, rather than a shoulder pair (scaleAndShift_shoulders())
 * Just doesn't run if calibrateRShoulder is undefined or null
 * @param {*} pose The pose to be scaled
 * @param {*} calibrateRShoulder The original right shoulder point of the unscaled calibration pose
 * @param {number} multiplier equivalent to desiredShoulderDistance/currentShoulderDistance
 * @returns The pose, scaled and shifted
 */
export function scaleAndShift(pose, calibrateRShoulder, multiplier) {
    if (!pose) return;

    

    //Yes, I know I'm being a bit paranoid with the 3 different options here XD
    //Return if there is no valid calibrateRShoulder parameter
    if (!calibrateRShoulder || calibrateRShoulder == undefined || calibrateRShoulder == null) return;
    //x and y are measured from top-right, so I've used rShoulder as the absolute point

    //THIS ASSUMES THE RIGHT SHOULDER IS THE SECOND IN THE ARRAY (pretty sure ml5 always does it that way)
    //Save the two points as new right and left shoulder Points.
    //let rShoulderPoint = new Point(skeletonBone[1].position.x, skeletonBone[1].position.y);
    //let lShoulderPoint = new Point(skeletonBone[0].position.x, skeletonBone[0].position.y);

    //Calculate the distance between the two shoulders
    //let shDistance = rShoulderPoint.distanceTo(lShoulderPoint);

    //Save the original right shoulder position of the pose to change
    let thisRShoulder = new Point(pose.pose.keypoints[6].position.x, pose.pose.keypoints[6].position.y);     //6 is the index of the right shoulder
    //VERY IMPORTANT to make this a point so that it won't change as the pose is being changed
    //That was the bug that was making me big sad

    //Make sure that the pose has a right shoulder
    if (thisRShoulder == undefined) {
        return;
    }

    //Calculate the distance between thisRShoulder and the original rShoulder of the calibration pose
    //let distanceOffset = calibrateRShoulder.distanceTo(thisRShoulder);
    let xPoseDistance = thisRShoulder.x - calibrateRShoulder.x;
    let yPoseDistance = thisRShoulder.y - calibrateRShoulder.y;

    //Calculate this distance times the multiplier
    let newXPoseDistance = xPoseDistance * multiplier;
    let newYPoseDistance = yPoseDistance * multiplier;

    console.log("pose in SAShift, pre: ");
    console.log(pose);

    //Then, do the scaling using this edited pose and the given multiplier
    pose = scaleToMultiplier(pose, multiplier);

    console.log("pose in SAShift: ");
    console.log(pose);

    //Shift the pose

    for (let j = 0; j < pose.pose.keypoints.length; j++) {
        //The current keypoint
        let keypoint = pose.pose.keypoints[j];

        //Change the x and y of this point to the same distance from new rShoulderPoint (our target) as it was from thisRShoulder
        keypoint.position.x = pose.pose.keypoints[j].position.x - thisRShoulder.x + calibrateRShoulder.x + newXPoseDistance;
        keypoint.position.y = pose.pose.keypoints[j].position.y - thisRShoulder.y + calibrateRShoulder.y + newYPoseDistance;
    }

    //What about the loose points not in keypoints or skeleton?

    for (let i = 0; i < pose.skeleton.length; i++) {
        let boneStart = pose.skeleton[i][0];
        let boneEnd = pose.skeleton[i][1];

        //Change both points to be the same distance from new rShoulderPoint (our target) as they were from thisRShoulder
        boneStart.position.x = pose.skeleton[i][0].position.x - thisRShoulder.x + calibrateRShoulder.x + newXPoseDistance;
        boneStart.position.y = pose.skeleton[i][0].position.y - thisRShoulder.y + calibrateRShoulder.y + newYPoseDistance;

        boneEnd.position.x = pose.skeleton[i][1].position.x - thisRShoulder.x + calibrateRShoulder.x + newXPoseDistance;
        boneEnd.position.y = pose.skeleton[i][1].position.y - thisRShoulder.y + calibrateRShoulder.y + newYPoseDistance;

    }

    

    return pose;
}