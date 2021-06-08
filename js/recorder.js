export default class Recorder {
    output = []
    interval;
    intervalTime = 200;
    currentPoses = []
    time = 0;
    recording = false;

    recordPose() {
        this.currentPoses = { "poses": this.currentPoses, "time": this.time };
        this.output.push(this.currentPoses);
        this.time += this.intervalTime;
    }

    setCurrentPoses(currentPoses) {
        this.currentPoses = currentPoses;
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