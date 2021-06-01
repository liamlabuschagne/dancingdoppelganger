const video = document.querySelector('video');
const canvas = window.canvas = document.querySelector('canvas');
const ctx = canvas.getContext("2d");

const constraints = {
    audio: false,
    video: true
};

function handleSuccess(stream) {
    window.stream = stream; // make stream available to browser console
    video.srcObject = stream;
    // video.hidden = true;
}

function handleError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

video.addEventListener("loadeddata", () => {
    video.width = video.videoWidth;
    video.height = video.videoHeight;
})

navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);