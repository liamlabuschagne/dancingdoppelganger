export default class Recorder {
    output = []
    interval;
    intervalTime = 1000;
    currentPoses = []
    time = 0;
    recording = false;

    recordPose() {
        if (this.currentPoses == null) return;
        this.currentPoses = { "poses": this.currentPoses, "time": this.time };
        this.output.push(this.currentPoses);
        this.time += this.intervalTime;
    }

    setCurrentPoses(currentPoses) {
        let missingPoints = false;
        currentPoses.forEach((pose) => {
            pose = pose.pose;
            for (let j = 5; j < 13; j++) {
                const keyPoint = pose.keypoints[j];
                if (keyPoint.score < 0.2) {
                    missingPoints = true;
                }
            }
        })
        if (!missingPoints) this.currentPoses = currentPoses;
    }

    downloadSong() {
        console.log(this.output)
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.output)));
        element.setAttribute('download', "song.json");

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    startRecording() {
        this.recording = true;
        this.interval = setInterval(this.recordPose.bind(this), this.intervalTime);
    }

    stopRecording() {
        clearInterval(this.interval);
        this.downloadSong();
    }
}