export default class Loader {
    loadTargetPose() {
        let danceMoves = ['Y-pose.json', 'T-pose.json', 'rightArmUp.json']
        let randomlyPickDanceMove = danceMoves[Math.floor(Math.random() * danceMoves.length)];
        return new Promise((resolve, reject) => {
            var xobj = new XMLHttpRequest();
            xobj.overrideMimeType("application/json");
            xobj.open('GET', randomlyPickDanceMove, true); // Replace 'appDataServices' with the path to your file
            xobj.onreadystatechange = function () {
                if (xobj.readyState == 4 && xobj.status == "200") {
                    let targetPose = JSON.parse(xobj.responseText);
                    resolve(targetPose);
                }
            };
            xobj.send(null);
        });
    }
}