const p5 = require("p5");

let faceapi;
let detections;
let width = 400;
let height = 300;
let mouthWasOpen = false;
let mouthWasPursed = false;
let browWasRaised = false;
let lastRightBrowLocation = 0;
lastHeadTop = 0;

const shoulda = document.getElementById('shoulda');
const dingdang = document.getElementById('dingdang');
const fishonfire = document.getElementById('fishonfire');
const suckmykiss = document.getElementById('suckmykiss');
const sounds = document.getElementsByTagName('audio');
const nick = document.getElementById('nick');


const detection_options = {
    withLandmarks: true,
    withDescriptors: false,
    Mobilenetv1Model: 'models',
    FaceLandmarkModel: 'models',
    FaceRecognitionModel: 'models',
    FaceExpressionModel: 'models',
};

const p5draw = (p) => {

    let p5video;

    function drawBox(detections) {
        detections.forEach((detection) => {
            const alignedRect = detection.alignedRect;

            p.noFill();
            p.stroke(255, 255, 255);
            p.strokeWeight(2);
            p.rect(
                alignedRect._box._x,
                alignedRect._box._y,
                alignedRect._box._width,
                alignedRect._box._height,
            );
        });
    }

    function drawLandmarks(detections) {
        p.noFill();
        p.stroke(161, 95, 251)
        p.strokeWeight(2)

        for(let i = 0; i < detections.length; i++){
            const mouth = detections[i].parts.mouth; 
            const nose = detections[i].parts.nose;
            const leftEye = detections[i].parts.leftEye;
            const rightEye = detections[i].parts.rightEye;
            const rightEyeBrow = detections[i].parts.rightEyeBrow;
            const leftEyeBrow = detections[i].parts.leftEyeBrow;

            drawPart(mouth, true);
            drawPart(nose, false);
            drawPart(leftEye, true);
            drawPart(leftEyeBrow, false);
            drawPart(rightEye, true);
            drawPart(rightEyeBrow, false);
            drawLabel(leftEyeBrow);
            drawLabel(rightEyeBrow);
        }
    }

    function drawPart(feature, closed) {
        p.beginShape();
        for(let i = 0; i < feature.length; i++){
            const x = feature[i]._x
            const y = feature[i]._y
            p.vertex(x, y)
        }
        
        if(closed === true){
            p.endShape(p.CLOSE);
        } else {
            p.endShape();
        }
    }

    function drawLabel(feature) {
        for(let i = 0; i < feature.length; i++) {
            const x = feature[i]._x;
            const y = feature[i]._y;

            p.textSize(9);
            p.strokeWeight(0);
            p.fill(255);
            p.text(`${i}`, x+3, y-3);
        }
    }

    function distance (p1, p2) {
        const dx = p1._x - p2._x;
        const dy = p1._y - p2._y;
        return Math.sqrt(dx*dx + dy*dy);
    }
    p.setup = () => {
        p.createCanvas(width, height);
        p.background(255);

        p5video = p.createCapture(p.VIDEO);
        p5video.size(width, height);
        p5video.hide();
        faceapi = ml5.faceApi(p5video, detection_options, modelReady);
    }

    p.draw = () => {
        p.image(p5video, 0, 0, p.width, p.height);
        
        if (detections) {
            drawBox(detections);
            drawLandmarks(detections);
            if(detections.length>0){
                const detection = detections[0];
                const mouth = detection.parts.mouth;
                
                const topLip = mouth[14];
                const bottomLip = mouth[18];
                const d = distance(topLip, bottomLip);
                const headWidth = detection.alignedRect._box._width;
                const normalizedDistance = d/headWidth;
                const threshold = 0.075;
                const isOpen = normalizedDistance > threshold;
                

                const headTop = detection.alignedRect._box._y;
                const rightEyeBrow = detection.parts.rightEyeBrow[1]._y;
                const rightEye = detection.parts.rightEye[2]._y;
                const normBrowRaise = (rightEye-rightEyeBrow)/headWidth;
                const browRaised = normBrowRaise > 0.131;

                if(browRaised !== browWasRaised){
                    if(browRaised){
                        fishonfire.play();
                    }
                    else {
                        fishonfire.pause();
                    }
                    browWasRaised = browRaised;
                }

                if(isOpen !== mouthWasOpen){
                    if(isOpen){
                        dingdang.play();
                    }
                    else{
                        dingdang.pause();

                    }
                    mouthWasOpen = isOpen;
                }

                const mouthLeft = mouth[0];
                const mouthRight = mouth[6];
                const mouthWidth = distance(mouthLeft, mouthRight);
                //mouth goes from 36 to 55 or so
                const normalizedMouthWidth = mouthWidth/headWidth;
                let mouthPursed = normalizedMouthWidth <0.2525;
                if(mouthPursed != mouthWasPursed) {
                    if(mouthPursed){ 
                        suckmykiss.play();
                    }
                    else {
                        suckmykiss.pause();
                    }
                    mouthWasPursed = mouthPursed;
                }

                if(!dingdang.paused || !fishonfire.paused || !suckmykiss.paused || !shoulda.paused) {
                    nick.style.display = "block";
                }
                else {
                    nick.style.display = "none";
                }
                // p.textSize(14);
                // p.strokeWeight(0);
                // p.fill(255);
                // p.textAlign(p.CENTER);
                // p.text(`Mouth Width is ${normalizedMouthWidth}. Headtop is ${headTop}.`, p.width/2, p.height - 10);
            }
        }
    }
}

function setup() {
    const myp5 = new p5(p5draw, "main");
}

function modelReady() {
    console.log("model ready!");
    faceapi.detect(gotResults);
}

function gotResults(err, results) {
    if (err) {
        console.log(err);
        return;
    }

    detections = results;
    faceapi.detect(gotResults);
}

// Calls the setup function when the page is loaded
window.addEventListener("DOMContentLoaded", setup);

