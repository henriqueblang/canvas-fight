var canvas, ctx, height, width, perso1, perso2, btn

function init() {
    height = window.innerHeight;
    width = window.innerWidth;

    sessionStorage.setItem('player', 'zuckerberg');

    perso1 = document.getElementById("perso_1");
    perso1.addEventListener("mouseup", click1);

    perso2 = document.getElementById("perso_2");
    perso2.addEventListener("mouseup", click2);
}

function click1(){
    sessionStorage.setItem('player', 'zuckerberg');
    if(document.getElementById("perso_1").innerHTML == "mark2"){
        perso1.style.backgroundImage = 'url("./assets/mark1.png")';
        perso2.style.backgroundImage = 'url("./assets/renzo2.png")';
        document.getElementById("perso_2").innerHTML = "renzo2";
        document.getElementById("perso_1").innerHTML = "mark1";
    }
}

function click2(){
    sessionStorage.setItem('player', 'renzo');

    if(document.getElementById("perso_2").innerHTML == "renzo2"){
        perso1.style.backgroundImage = 'url("./assets/mark2.png")';
        perso2.style.backgroundImage = 'url("./assets/renzo1.png")';
        document.getElementById("perso_2").innerHTML = "renzo1";
        document.getElementById("perso_1").innerHTML = "mark2";
    }
}


init();