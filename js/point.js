export default function Point(x, y) {
    this.x = x;
    this.y = y;

    this.distanceTo = function (point) {
        var distance = Math.sqrt((Math.pow(point.x - this.x, 2)) + (Math.pow(point.y - this.y, 2)))
        return distance;
    };
}

export function pointMatches(part, targetPose, goodPoints) {
    if (!goodPoints[part] || !targetPose) return false;
    let actual = new Point(goodPoints[part].position.x, goodPoints[part].position.y);
    let target = new Point(targetPose.pose.keypoints[part].position.x, targetPose.pose.keypoints[part].position.y);

    let distance = actual.distanceTo(target);
    if (distance < 100) {
        return true;
    } else {
        return false;
    }
}

export function getMatches(targetPose, goodPoints) {
    // Compare only main body sections
    let matches = 0;
    for (let i = 5; i < 12; i++) {
        if (pointMatches(i, targetPose, goodPoints)) {
            matches++;
        }
    }

    return matches;
}