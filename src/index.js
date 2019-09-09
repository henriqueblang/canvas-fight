var DOCUMENT_HEIGHT, DOCUMENT_WIDTH;
const PLAYER_WIDTH = 21, PLAYER_HEIGHT = 20;
const POWER_UP_WIDTH = 48, POWER_UP_HEIGHT = 41;
const MOVE_PLAYER = 10;
const ROUND_TIME = 80000;

var timePassed = ROUND_TIME / 1000;
var roundTimer;
var countTimer;

var canvas;
var trackCanvas;

var ctx;
var trackCtx;

var powerUpsChances = [];
var powerUpSpawned = [];

var scoreMatrix;
var queryPowerUp;

const POWER_UPS = {
    ['Slow']: {
        speed: -(MOVE_PLAYER / 2),
        x: 0,
        y: 0,
        appearChance: 25,
        color: 'slowPowerUp'
    },
    ['Star']: {
        speed: MOVE_PLAYER,
        x: 0,
        y: 0,
        appearChance: 25,
        color: 'starPowerUp'
    },
    ['Freeze']: {
        speed: -MOVE_PLAYER,
        x: 0,
        y: 0,
        appearChance: 25,
        color: 'icePowerUp'
    },
    ['RControl']: {
        speed: 0,
        x: -1,
        y: -1,
        appearChance: 25,
        color: 'controliPowerUp'
    },
}

function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}

String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes+':'+seconds;
}

class PowerUp
{
    constructor(name, speed, x, y, appearX, appearY, color)
    {
        this.name = name;
        this.speed = speed;
        this.x = x;
        this.y = y;
        this.appearX = appearX;
        this.appearY = appearY;

        this.color = color;
    }

    draw = function()
    {
        var pp = document.getElementById(this.color);
        ctx.drawImage(pp, this.appearX, this.appearY);
    }

    applyEffect = function(target)
    {
        console.log("Using " + this.name + " on " + target.id);

        if(this.speed != 0)
            target.speed += this.speed;

        if(this.x != 0)
            target.xFactor = this.x;

        if(this.y != 0)
            target.yFactor = this.y;

        setTimeout(() => {
            console.log("finished effect");
            if(this.speed != 0)
                target.speed -= this.speed;

            if(this.x != 0)
                target.xFactor = 1;

            if(this.y != 0)
                target.yFactor = 1;
        }, 4000);
    }

    delete = function()
    {
        ctx.clearRect(this.appearX, this.appearY, POWER_UP_WIDTH, POWER_UP_HEIGHT);

        var startY = this.appearY - (MOVE_PLAYER + 30) < 0 ? 0 : this.appearY - (MOVE_PLAYER + 30);
        var endY = this.appearY + (MOVE_PLAYER + 30) > canvas.height ? canvas.height : this.appearY + (MOVE_PLAYER + 30);

        var startX = this.appearX - (MOVE_PLAYER + 30) < 0 ? 0 : this.appearX - (MOVE_PLAYER + 30);
        var endX = this.appearX + (MOVE_PLAYER + 30) > canvas.width ? canvas.width : this.appearX + (MOVE_PLAYER + 30);

        for(var i = startY; i < endY; i++)
        {
            for(var j = startX; j < endX; j++)
                queryPowerUp[i][j] = null;
        }

        this.appearX = -1;
        this.appearY = -1;

        for(var i = 0; i < powerUpSpawned.length; i++)
        {
            if(powerUpSpawned[i] == this)
            {
                powerUpSpawned.splice(i, 1);

                break;
            }
        }
    }
}

class Player
{
    constructor(id, x, y, srcImage, srcBackImg, trackColor)
    {
        this.id = id;
        this.score = 0;
        this.srcImage = srcImage;

        this.normalSrc = srcImage;
        this.backSrc = srcBackImg;
    
        this.PUSlot1 = null;
        this.PUSlot2 = null;

        this.x = x;
        this.y = y;
        this.speed = MOVE_PLAYER;
        this.xFactor = 1;
        this.yFactor = 1;
        this.trackColor = trackColor;
    }

    draw = function()
    {
        var pp = document.getElementById(this.srcImage);
        ctx.drawImage(pp, this.x, this.y);
    }

    power = function(slot)
    {
        if(slot == 1)
        {
            if(!this.PUSlot1)
                return;

            if(this.id == 1)
                document.getElementById("slot1P1").style.backgroundImage = "none";
            else
                document.getElementById("slot1P2").style.backgroundImage = "none";    
                
            this.PUSlot1.applyEffect(this.PUSlot1.name == "Star" ? this : this.enemy);
            this.PUSlot1 = null;
        }
        else if(slot == 2)
        {
            if(!this.PUSlot2)
                return;

            if(this.id == 1)
                document.getElementById("slot2P1").style.backgroundImage = "none";
            else
                document.getElementById("slot2P2").style.backgroundImage = "none";

            this.PUSlot2.applyEffect(this.PUSlot2.name == "Star" ? this : this.enemy);
            this.PUSlot2 = null;
        }
    }

    move = function(direction)
    {
        var add = 0;
        var sub = 0;

        trackCtx.fillStyle = this.trackColor;

        switch(direction)
        {
            case 'up':
                if(this.y <= 0)
                    return;
                else if(this.y - this.speed < 0)
                {
                    if(this.y > 0)
                        this.y = 0;
                }
                else
                {
                    this.y -= this.yFactor * this.speed;

                    if(this.y + PLAYER_HEIGHT > canvas.height)
                        this.y = canvas.height - PLAYER_HEIGHT;
                }
                    

                // y + PLAYER_HEIGHT -> y + PLAYER_HEIGHT + MOVE_PLAYER
                // x -> x + PLAYER_WIDTH

                trackCtx.fillRect(this.x, this.y + PLAYER_HEIGHT, PLAYER_WIDTH, this.speed);

                // y -> y + MOVE_PLAYER
                // x -> x + PLAYER_WIDTH

                for(var i = this.y; i < this.y + this.speed; i++)
                {
                    for(var j = this.x; j < this.x + PLAYER_WIDTH; j++)
                    {
                        var cell = scoreMatrix[i][j];

                        if(cell == this.id)
                            continue;
                        else if(cell != 0 && cell != this.id)
                            sub++;
                        
                        add++;

                        scoreMatrix[i][j] = this.id;

                    }
                }

                break;
            case 'down':
                if(this.y + PLAYER_HEIGHT >= canvas.height)
                    return;
                else if(this.y + PLAYER_HEIGHT + this.speed > canvas.height)
                {
                    if(this.y + PLAYER_HEIGHT < canvas.height)
                        this.y = canvas.height - PLAYER_HEIGHT;
                }
                else
                {
                    this.y += this.yFactor * this.speed;

                    if(this.y < 0)
                        this.y = 0;
                }
                    
                // y - PLAYER_HEIGHT -> y - PLAYER_HEIGHT + this.speed
                // x -> x + PLAYER_WIDTH

                trackCtx.fillRect(this.x, this.y - (PLAYER_HEIGHT - this.speed), PLAYER_WIDTH, this.speed);

                // y - MOVE_PLAYER -> y
                // x -> x + PLAYER_WIDTH

                for(var i = this.y - this.speed; i < this.y; i++)
                {
                    for(var j = this.x; j < this.x + PLAYER_WIDTH; j++)
                    {
                        var cell = scoreMatrix[i][j];

                        if(cell == this.id)
                            continue;
                        else if(cell != 0 && cell != this.id)
                            sub++;
                        
                        add++;

                        scoreMatrix[i][j] = this.id;
                    }
                }

                break;
            case 'right':
                if(this.x + PLAYER_WIDTH >= canvas.width)
                    return;
                else if(this.x + PLAYER_WIDTH + this.speed > canvas.width)
                {
                    if(this.x + PLAYER_WIDTH < canvas.width)
                        this.x = canvas.width - PLAYER_WIDTH;
                }
                else
                {
                    this.x += this.xFactor * this.speed;

                    if(this.x < 0)
                        this.x = 0;
                }
                    

                // y -> y + PLAYER_HEIGHT
                // x - PLAYER_WIDTH -> x - (PLAYER_WIDTH - this.speed)

                this.srcImage = this.normalSrc;              

                trackCtx.fillRect(this.x - (PLAYER_WIDTH - this.speed), this.y, this.speed, PLAYER_HEIGHT);

                // x + (PLAYER_WIDTH - this.speed) -> x + PLAYER_WIDTH

                for(var i = this.y; i < this.y + PLAYER_HEIGHT; i++)
                {
                    for(var j = this.x + (PLAYER_WIDTH - this.speed); j < this.x + PLAYER_WIDTH; j++)
                    {
                        var cell = scoreMatrix[i][j];

                        if(cell == this.id)
                            continue;
                        else if(cell != 0 && cell != this.id)
                            sub++;
                        
                        add++;

                        scoreMatrix[i][j] = this.id;
                    }
                }

                break;
            case 'left':
                if(this.x <= 0)
                    return;
                else if(this.x - this.speed < 0)
                {
                    if(this.x > 0)
                        this.x = 0;
                }
                else
                {
                    this.x -= this.xFactor * this.speed;

                    if(this.x + PLAYER_WIDTH > canvas.width)
                        this.x = canvas.width - PLAYER_WIDTH;
                }

                this.srcImage = this.backSrc;
        
                trackCtx.fillRect(this.x + PLAYER_WIDTH, this.y, this.speed, PLAYER_HEIGHT);

                // x -> x + MOVE_PLAYER

                for(var i = this.y; i < this.y + PLAYER_HEIGHT; i++)
                {
                    for(var j = this.x; j < this.x + this.speed; j++)
                    {
                        var cell = scoreMatrix[i][j];

                        if(cell == this.id)
                            continue;
                        else if(cell != 0 && cell != this.id)
                            sub++;
                        
                        add++;

                        scoreMatrix[i][j] = this.id;
                    }
                }

                break;
        }

        this.score += add / 200.0;
        this.enemy.score -= sub / 200.0;

        if(this.score == ((canvas.width * canvas.height) / 200.0))
        {
            win();

            return;
        }

        var centerX = parseInt(((this.x + PLAYER_WIDTH) + this.x) / 2);
        var centerY = parseInt(((this.y + PLAYER_HEIGHT) + this.y) / 2);

        var powerUp = queryPowerUp[centerY][centerX];
        if(powerUp)
        {
            console.log('colidiu');
            if(!this.PUSlot1)
            {
                this.PUSlot1 = powerUp;
                if(this.id == 1)
                    document.getElementById("slot1P1").style.backgroundImage = "url(./img/" + this.PUSlot1.color + ".png)";
    
                else
                    document.getElementById("slot1P2").style.backgroundImage =  "url(./img/" + this.PUSlot1.color + ".png)";
                powerUp.delete();
                
            }
            else if(!this.PUSlot2)
            {
                this.PUSlot2 = powerUp;

                if(this.id == 1)
                    document.getElementById("slot2P1").style.backgroundImage = "url(./img/" + this.PUSlot2.color + ".png)";
                else
                    document.getElementById("slot2P2").style.backgroundImage = "url(./img/" + this.PUSlot2.color + ".png)";

                powerUp.delete();
            }
        }

        var percentP1 = (player_1.score / 12.5).toFixed(2);
        var percentP2 = (player_2.score / 12.5).toFixed(2);

        document.getElementById("s1").innerHTML = percentP1 + "%";
        document.getElementById("s2").innerHTML = percentP2 + "%"; 

    }
}

var control = sessionStorage.getItem("player");

var player_1;
var player_2;

if(control == "renzo") {
    player_1 = new Player(1, 50, 50, "playerRenzo", "playerRenzoBack", "#961026");
    player_2 = new Player(2, 30, 30, "playerZucken", "playerZuckenBack", "#3039c0");
}
else {
    player_1 = new Player(1, 30, 30, "playerZucken", "playerZuckenBack", "#961026");
    player_2 = new Player(2, 50, 50, "playerRenzo", "playerRenzoBack", "#3039c0");
}



player_1.enemy = player_2;
player_2.enemy = player_1;

function win()
{
    if(player_1.score > player_2.score) {
        console.log("Player 1 wins!");
        if(control == "renzo")
            sessionStorage.setItem('winner','renzo')
        else
            sessionStorage.setItem('winner','zuckaoDaMassa')    
    }
    else if(player_2.score > player_1.score) {
        if(control != "renzo") {
            sessionStorage.setItem('winner','renzo')
            console.log("Player 2 wins!");
        }
        else {
            sessionStorage.setItem('winner','zuckaoDaMassa') 
        }
    }
    else
        console.log("Its a draw!");

    window.location = "victoryPage.html";

    clearTimeout(countTimer);
    clearTimeout(roundTimer);
}

function init() 
{
    DOCUMENT_HEIGHT = window.innerHeight;
    DOCUMENT_WIDTH = window.innerWidth;

    canvas = document.getElementById("myGame");
    trackCanvas = document.getElementById("track");

    canvas.width = DOCUMENT_WIDTH > 500 ? 500 : DOCUMENT_WIDTH;
    canvas.height = DOCUMENT_HEIGHT > 500 ? 500 : DOCUMENT_HEIGHT;
    canvas.style.border = "1px solid #000";

    trackCanvas.width = DOCUMENT_WIDTH > 500 ? 500 : DOCUMENT_WIDTH;
    trackCanvas.height = DOCUMENT_HEIGHT > 500 ? 500 : DOCUMENT_HEIGHT;

    ctx = canvas.getContext("2d");
    trackCtx = trackCanvas.getContext("2d");
    
    document.addEventListener("keydown", movePlayer);
    document.addEventListener("keyup", movePlayer);

    scoreMatrix = createArray(canvas.height, canvas.width);
    queryPowerUp = createArray(canvas.height, canvas.width);

    for(var i = 0; i < canvas.height; i++)
    {
        for(var j = 0; j < canvas.width; j++)
            scoreMatrix[i][j] = 0;
    }

    for(var i = 0; i < canvas.height; i++)
    {
        for(var j = 0; j < canvas.width; j++)
            queryPowerUp[i][j] = null;
    }

    var countPowerUp = 0;
    var sum = 0;
    Object.keys(POWER_UPS).forEach(function(key) {
        value = POWER_UPS[key];
        sum = countPowerUp;

        for(; countPowerUp < value.appearChance + sum; countPowerUp++)
            powerUpsChances.push(key);

    });

    countTimer = setInterval(() => {
        timePassed--;

        console.log(timePassed.toString().toHHMMSS()); //here time

        document.getElementById("tempo").innerHTML = timePassed.toString().toHHMMSS();
        if(timePassed.toString().toHHMMSS() == "00:10")
            document.getElementById("tempo").style.color = "red";
    }, 1000);

    roundTimer = setTimeout(() => {
        win();
    }, ROUND_TIME);

    powerUps();
    run();
}

//var firstTime = true;
var firstTime = false;
function powerUps()
{
    if(!firstTime)
    {
        var randomPowerUpName = powerUpsChances[parseInt(Math.random() * 100)];

        var randomX = parseInt(Math.random() * canvas.width);
        var randomY = parseInt(Math.random() * canvas.height);

        if(!(queryPowerUp[randomX][randomY]) && scoreMatrix[randomX][randomY] == 0)
        {
            var powerUpMap = POWER_UPS[randomPowerUpName];
            var randomPowerUp = new PowerUp(randomPowerUpName, powerUpMap.speed, powerUpMap.x, powerUpMap.y, randomX, randomY, powerUpMap.color);

            var startY = randomY - (MOVE_PLAYER + 30) < 0 ? 0 : randomY - (MOVE_PLAYER + 30);
            var endY = randomY + (MOVE_PLAYER + 30) > canvas.height ? canvas.height : randomY + (MOVE_PLAYER + 30);

            var startX = randomX - (MOVE_PLAYER + 30) < 0 ? 0 : randomX - (MOVE_PLAYER + 30);
            var endX = randomX + (MOVE_PLAYER + 30) > canvas.width ? canvas.width : randomX + (MOVE_PLAYER + 30);

            console.log("Y: " + startY + " - " + endY);
            console.log("X: " + startX + " - " + endX);

            for(var i = startY; i < endY; i++)
            {
                for(var j = startX; j < endX; j++)
                    queryPowerUp[i][j] = randomPowerUp;
            }

            if(queryPowerUp[randomY][randomX])
            {
                console.log("(POWER UP) pos Y: " + randomY + ", pos X: " + randomX);
            }

            powerUpSpawned.push(randomPowerUp);
        }
    } else firstTime = false;

    setTimeout(powerUps, Math.random() * (16000 - 12000) + 12000);
}

function run()
{
    draw();

    window.requestAnimationFrame(run);
}

function draw()
{
    canvas.width = canvas.width;

    player_1.draw();
    player_2.draw();

    for(var i = 0; i < powerUpSpawned.length; i++)
        powerUpSpawned[i].draw();
}

var map = {};
function movePlayer(ev)
{
    ev = ev || event;

    var key = ev.keyCode;
    map[key] = ev.type == 'keydown';

    /*if(map[65] && map[37])
    {
        player_1.move('left');
        player_2.move('left');
    }
    else if(map[65] && map[38])
    {
        player_1.move('left');
        player_2.move('up');

    }
    else if(map[65] && map[39])
    {
        player_1.move('left');
        player_2.move('right');
        
    }
    else if(map[65] && map[40])
    {
        player_1.move('left');
        player_2.move('down');
    }
    else if(map[65] && map[188])
    {
        player_1.move('left');
        player_2.power(1);
    }
    else if(map[65] && map[190])
    {
        player_1.move('left');
        player_2.power(2);
    }
    else if(map[68] && map[37])
    {
        player_1.move('right');
        player_2.move('left');
    }
    else if(map[68] && map[38])
    {
        player_1.move('right');
        player_2.move('up');

    }
    else if(map[68] && map[39])
    {
        player_1.move('right');
        player_2.move('right');
        
    }
    else if(map[68] && map[40])
    {
        player_1.move('right');
        player_2.move('down');
    }
    else if(map[68] && map[188])
    {
        player_1.move('right');
        player_2.power(1);
    }
    else if(map[68] && map[190])
    {
        player_1.move('right');
        player_2.power(2);
    }
    else if(map[87] && map[37])
    {
        player_1.move('up');
        player_2.move('left');
    }
    else if(map[87] && map[38])
    {
        player_1.move('up');
        player_2.move('up');
    }
    else if(map[87] && map[39])
    {
        player_1.move('up');
        player_2.move('right');
        
    }
    else if(map[87] && map[40])
    {
        player_1.move('up');
        player_2.move('down');
    }
    else if(map[87] && map[188])
    {
        player_1.move('up');
        player_2.power(1);
    }
    else if(map[87] && map[190])
    {
        player_1.move('up');
        player_2.power(2);
    }
    else if(map[83] && map[37])
    {
        player_1.move('down');
        player_2.move('left');
    }
    else if(map[83] && map[38])
    {
        player_1.move('down');
        player_2.move('up');

    }
    else if(map[83] && map[39])
    {
        player_1.move('down');
        player_2.move('right');
        
    }
    else if(map[83] && map[40])
    {
        player_1.move('down');
        player_2.move('down');
    }
    else if(map[83] && map[188])
    {
        player_1.move('down');
        player_2.power(1);
    }
    else if(map[83] && map[190])
    {
        player_1.move('down');
        player_2.power(2);
    }
    else if(map[88] && map[37])
    {
        player_1.power(2);
        player_2.move('left');
    }
    else if(map[88] && map[38])
    {
        player_1.power(2);
        player_2.move('up');
    }
    else if(map[88] && map[39])
    {
        player_1.power(2);
        player_2.move('right');
    }
    else if(map[88] && map[40])
    {
        player_1.power(2);
        player_2.move('down');
    }
    else if(map[90] && map[37])
    {
        player_1.power(1);
        player_2.move('left');
    }
    else if(map[90] && map[38])
    {
        player_1.power(1);
        player_2.move('up');
    }
    else if(map[90] && map[39])
    {
        player_1.power(1);
        player_2.move('right');
    }
    else if(map[90] && map[40])
    {
        player_1.power(1);
        player_2.move('down');
    }
    else if(map[65])
        player_1.move('left');
    else if(map[68])
        player_1.move('right');
    else if(map[87])
        player_1.move('up');
    else if(map[83])
        player_1.move('down');
    else if(map[37])
        player_2.move('left');
    else if(map[38])
        player_2.move('up');
    else if(map[39])
        player_2.move('right');
    else if(map[40])
        player_2.move('down');
    else if(map[88])
        player_1.power(2);
    else if(map[90])
        player_1.power(1);
    else if(map[188])
        player_2.power(1);
    else if(map[190])
        player_2.power(2);*/

    var player_1Moved = false;
    var player_2Moved = false;

    if(map[65])
    {
        player_1.move('left');

        player_1Moved = true;
    }

    if(map[68] && !player_1Moved)
    {
        player_1.move('right');

        player_1Moved = true;
    }

    if(map[87] && !player_1Moved)
    {
        player_1.move('up');

        player_1Moved = true;
    }

    if(map[83] && !player_1Moved)
    {
        player_1.move('down');

        player_1Moved = true;
    }

    if(map[37])
    {
        player_2.move('left');

        player_2Moved = true;
    }

    if(map[38] && !player_2Moved)
    {
        player_2.move('up');

        player_2Moved = true;
    }

    if(map[39] && !player_2Moved)
    {
        player_2.move('right');

        player_2Moved = true;
    }

    if(map[40] && !player_2Moved)
    {
        player_2.move('down');

        player_2Moved = true;
    }

    if(map[90])
        player_1.power(1);

    if(map[88])
        player_1.power(2);

    if(map[188])
        player_2.power(1);

    if(map[190])
        player_2.power(2);
}

init();