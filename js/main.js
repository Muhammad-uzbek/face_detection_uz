const video = document.getElementById("video");
const isScreenSmall = window.matchMedia("(max-width: 700px)");
let predictedAges = [];
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
  faceapi.nets.faceExpressionNet.loadFromUri("./models"),
  faceapi.nets.ageGenderNet.loadFromUri("./models")
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => (video.srcObject = stream),
    err => console.error(err),
    document.getElementById("gender").innerText="Yuzingizni ko'rsating!(Yeb qo'ymayman, qo'rqmang😉)");
  ;
}

function screenResize(isScreenSmall) {
  if (isScreenSmall.matches) {
    video.style.width = "320px";
  } else {
    video.style.width = "500px";
  }
}
screenResize(isScreenSmall); 
isScreenSmall.addListener(screenResize);
video.addEventListener("playing", () => {
  console.log("playing called");
  const canvas = faceapi.createCanvasFromMedia(video);
  let container = document.querySelector(".container");
  container.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    console.log(resizedDetections);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    if (resizedDetections && Object.keys(resizedDetections).length > 0) {
      const age = resizedDetections.age;
      const interpolatedAge = interpolateAgePredictions(age);
      const gender = resizedDetections.gender;
      const expressions = resizedDetections.expressions;
      const maxValue = Math.max(...Object.values(expressions));
      const emotion = Object.keys(expressions).filter(
        item => expressions[item] === maxValue
      );
      
      let kayfiyat='';
      if(emotion=='sad') kayfiyat='Hafa';
      else if(emotion=="neutral") kayfiyat='Jiddiy';
      else if (emotion=="angry") kayfiyat="G`azablangan ";
      else if(emotion=="happy") kayfiyat='Xursand';
      else if(emotion=="surprised") kayfiyat='Xayratlangan';
      let jins='';
      if(gender=="male") jins='erkak';
      else jins="ayol";
      function randomComplimentForBoy(){
        var date = new Date();
        let whichOne=Math.round((date.getMinutes()%10)/2);
        let boy=["O'xxo, qizlarni ajali😎", "Ko'rinishizdan o'qimishli bolaga o'xshirkansiz", "To'y qachon, brat?", "Indiskiy aktyorlarga o'xshirkansiz", "Ahad Qayumga o'xsharkansiz","Qizlarni nomeri bor, beraymi?😁"];
        let  a=boy[whichOne];
        return a;
      }
      function randomComplimentForGirl(){
        var date= new Date();
        let whichOne=Math.round((date.getMinutes()/10)-1);
        let girl=["O, yaxshi qiz, shu nomerda bo'laman, mobodode. +998993331122😚","Sizga avval chiroyli ekanligizni aytishganmi?😍", "Selena Gomezga o'xshirkansiz🌚","Zarina Nizomiddinova qarindoshizmasmi, mobodo?😊", "Ko'rinishizdan odobli qizga o'xshirkansiz", "Ko'ylagiz yarashibdi😊"];
        let a=girl[whichOne];
        return a;
      }
      function loadings(){
          var element = document.getElementById("loading");
          element.classList.toggle("loadingclass");
        }
      function compliment(){
        let xushomad="";
        if(gender=="male" && Math.round(interpolatedAge)<30 && (emotion=="neutral" || emotion=='happy')){
          xushomad=randomComplimentForBoy();
         }
         else if(gender=="female" && Math.round(interpolatedAge)<25){
           xushomad=randomComplimentForGirl();
         }
         else if(gender=="male" && Math.round(interpolatedAge)>29){
           xushomad="Kampirlarni ajali ekansiz-ku🤣"
         }
         else if(emotion=="angry" && gender=="male"){
          xushomad="Ha, oka? Nimaga jahlingiz chiqyapti?🧐"
        }
        else if(gender=="female" && (emotion=="sad" || emotion=="angry")){
          xushomad="Nima bo'ldi, opa. Kim hafa qildi, ayting?🤨"
        }
        else if(emotion=="happy" && gender=="female"){
          xushomad="Qolganlarga bilmadim-u, lekin sizga tabassum yarasharkan😉"
        }
         return xushomad;
      }

      document.getElementById("age").innerText = `Yoshi taxminan, ${Math.round(interpolatedAge)}da. ${kayfiyat} holatdagi ${jins}`;
      document.getElementById("gender").innerText =compliment();
      document.getElementById("emotion").innerText = `Kayfiyat - ${kayfiyat}`;
    }
  }, 10);
});
function interpolateAgePredictions(age) {
  predictedAges = [age].concat(predictedAges).slice(0, 30);
  const avgPredictedAge =
    predictedAges.reduce((total, a) => total + a) / predictedAges.length;
  return avgPredictedAge;
}
