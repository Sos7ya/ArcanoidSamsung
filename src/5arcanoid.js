var game
var gameState = {
    lvl: 1,
    onGame:false,
    onMenu:false,
    onPause: false,
    isOver: false,
    score: 0
}
var gameWidth = 1532; // Ширина игровой области
var gameHeight = 1060; // Высота игровой области
var gameOffsetX = 350; // Смещение игровой области по оси X
var gameOffsetY = 10; // Смещение игровой области по оси Y

var cellWidth = 146;
var cellHeight = 67;
var game_version = "v 0.1.5s";
var zero ={
    x: 460,
    y: 125
}

var sessionID
var gameId = uid();

window.onload = function(){
    var config = {
        type: Phaser.WEBGL,
        width: 1920,
        height: 1080,
        parent: 'phaser-example',
        scene: [preloader,
                mainmenu,
                arcanoid,
                nextLvl,
                scenepause,
                gameOver],
        physics: {
            default: 'arcade',
            arcade : {
                debug : false  //CHANGE THIS TO TRUE TO SEE LINES
            }
        },
        backgroundColor: '#233354',
        scale:{
            mode: Phaser.Scale.FIT
        },
        audio: {
            disableWebAudio: true,
        }
}

sessionID = uid();
var startGameSession = {
    action: 'startGameSession',
    allGameSessionId: sessionID,
    timeStamp: Date.now()
}
window?.parent.postMessage(startGameSession, '*');

game = new Phaser.Game(config)
}
class Arcanoid extends Phaser.Scene{
    constructor(){
        super({key: "arcanoid"})
    }

    create(){
        gameState.onGame = true;

        
        // ;
        this.pickBonusSound = this.sound.add('pickBonus', {loop: false, volume: 0.5});
        this.brickHitSound = this.sound.add('brickHit', {loop: false, volume: 0.5});
        this.paddleHitSound = this.sound.add('paddleHit', {loop: false, volume: 0.5});
        this.loseSound = this.sound.add('lose', {loop: false, volume: 0.5});
        this.winSound = this.sound.add('win', {loop: false, volume: 0.5});
        this.lostSound = this.sound.add('lost', {loop: false, volume: 0.5});

        

        this.physics.world.setBounds(gameOffsetX, gameOffsetY, gameWidth, gameHeight);

        this.physics.world.setBoundsCollision(true, true, true, false);
        this.gameBg = this.add.image(gameOffsetX, gameOffsetY, 'background').setDisplaySize(gameWidth, gameHeight).setOrigin(0);
        this.info = this.add.image(55, 56, 'info').setOrigin(0);
        //localStorage.clear()
        if(localStorage.getItem('lvl_arcnd')){
            let userLvl =  JSON.parse(localStorage.getItem('lvl_arcnd'))
            if(userLvl > gameState.lvl){
                gameState.lvl = userLvl
            }
            else{
                gameState.lvl = Math.floor(Math.random() * 20);
            }
        }
        else{
            gameState.lvl = Math.floor(Math.random() * 20);
            localStorage.setItem('lvl_arcnd', JSON.stringify(gameState.lvl))
        }

        let index = Math.floor(Math.random() * 20);
        this.startLvl(gameState.lvl);
        
        this.hp = 3;

        this.hpText = this.add.group({
            key: 'ball',
            frame: 'ball',
            frameQuantity: 3,
            gridAlign: { width: 3, height: 1, cellWidth: 90, cellHeight: cellHeight, x: 100, y: game.config.height - 93 }
        })
        
        this.hpTracker = this.hpText.getChildren();

        this.ball = this.physics.add.image(1100, gameHeight - 130, 'ball').setCollideWorldBounds(true).setBounce(1).setOrigin(0.5)
        this.ball.setData('onPaddle', true);
        this.ball.body.maxVelocity.x = 300;
        this.ball.body.maxVelocity.y = 300;
        this.activeBalls = this.add.group();
        this.activeBalls.add(this.ball);
        this.laserGroup = this.add.group();

        this.paddle = this.physics.add.image(1100, gameHeight - 80, 'paddle').setImmovable().setOrigin(0.5)
        this.paddle.setCollideWorldBounds(true);

        this.scoreText = this.add.text(56, game.config.height - 460, 'СЧЕТ', { fontFamily: 'Rubik-Medium', fontSize: '32px', fontStyle: 'normal', color: '#9199AA' });
        this.score = this.add.text(this.scoreText.x, this.scoreText.y+42, gameState.score, { fontFamily: 'Rubik-SemiBold', fontSize: '72px', fontStyle: 'bold', fill: '#fff' });
        
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);
        this.physics.add.overlap(this.paddle, this.ball, ()=>{this.ball.setVelocity(-75,-300)}, null, this );

        document.addEventListener('keydown',(e)=>{
            if((e.keyCode == 8 || e.keyCode == 10009 || e.keyCode == 461 || e.keyCode == 166 || e.keyCode == 196)&&gameState.onGame){
                this.pause()
            }
        })

        var children = this.bricks.getChildren();
        this.physics.add.collider(this.ball, children, this.hitBrick, null, this);
        // this.input.keyboard.on('keydown-B', this.widePaddle, this);
        this.input.keyboard.on('keydown-F', this.setError, this);
        this.input.keyboard.on('keydown-D', this.laserShooting, this);

        // this.loadScore();
        this.bonuses = this.add.group();
        this.steelBlocks = [];
        this.activeBlocks = this.add.group();

        for(let block of this.bricks.getChildren()){
            // block.enableBody(true, block.x, block.y, true, true);
            if(block.frame.name == 'red'||block.frame.name == 'purple'){
                block.hp = 2
            }
            else if(block.frame.name == 'grey'){
                block.hp = 'more'
            }
            else{
                block.hp = 1
            }
            if(block.hp == 0){
                block.disableBody(true, true);
            }
            if(block.frame.name === 'grey'){
                this.steelBlocks.push(block);
            }
            if(block.frame.name !== 'grey'){
                this.activeBlocks.add(block);
            }
        }

        this.versionText = this.add.text(game.config.width - 60, game.config.height - 40, `${game_version}`, { fontFamily:'Arial', fontStyle:'bold', fontSize: '30px', fill: '#fff' }).setOrigin(0.5);
        this.paddle.depth = 20

        this.loadScore()
    }

    checkStorage(){
        console.log(...localStorage);
    }

    setError(){
        localStorage.setItem('lvl_arcnd', JSON.stringify(undefined));
    }

    saveScore(){
        this.heighScore = gameState.score;
        this.oldScore = JSON.parse(localStorage.getItem('heighScore_arcnd'));
        this.heighScore > this.oldScore ? localStorage.setItem('heighScore_arcnd', JSON.stringify(this.heighScore)) : this.heighScore = this.oldScore;
        localStorage.setItem('lvl_arcnd', JSON.stringify(gameState.lvl))
    }

    startLvl(lvl){
        switch(lvl){
            case 1:
                this.startLvl_1();
                gameOver.saveScore();
                break;
            case 2:
                this.startLvl_14();
                gameOver.saveScore();
                break;
            case 3:
                this.startLvl_3();
                gameOver.saveScore();
                break;
            case 4:
                this.startLvl_4();
                gameOver.saveScore();
                break;
            case 5:
                this.startLvl_5();
                gameOver.saveScore();
                break;
            case 6:
                this.startLvl_6();
                gameOver.saveScore();
                break;
            case 7:
                this.startLvl_7();
                gameOver.saveScore();
                break;
            case 8:
                this.startLvl_8();
                gameOver.saveScore();
                break;
            case 9:
                this.startLvl_9();
                gameOver.saveScore();
                break;

            case 10:
                this.startLvl_10();
                gameOver.saveScore();
                break;
            case 11:
                this.startLvl_11();
                gameOver.saveScore();
                break;
            case 12:
                this.startLvl_12();
                gameOver.saveScore();
                break;
            case 13:
                this.startLvl_13();
                gameOver.saveScore();
                break;
            case 14:
                this.startLvl_2();
                gameOver.saveScore();
                break;
            case 15:
                this.startLvl_15();
                gameOver.saveScore();
                break;
            case 16:
                this.startLvl_16();
                gameOver.saveScore();
                break;
            case 17:
                this.startLvl_17();
                gameOver.saveScore();
                break;
            case 18:
                this.startLvl_18();
                gameOver.saveScore();
                break;
            case 19:
                this.startLvl_19();
                gameOver.saveScore();
                break;
            case 20:
                this.startLvl_20();
                gameOver.saveScore();
                break;
            default:
                if(lvl > 1){
                    let index = Math.floor(Math.random() * 20);
                    this.startLvl(index);
                    gameOver.saveScore();
                }
                else{
                    this.startLvl_1();
                    gameOver.saveScore();
                }
                break;
        }
    }

    startLvl_1(){
        this.gameBg.setTexture('background_1');

        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow', 'purple'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 2, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y}
        })

        this.bricksNew = this.physics.add.staticGroup({
            key: 'blocks', frame: ['blue', 'red'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 2, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+(2*cellHeight)}
        })

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow', 'purple', 'blue'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+(4*cellHeight)}
        })

        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell);
        }

       for(let el of this.bricksNew.getChildren()){
            this.bricks.add(el);
        }

        let n = 0
        for( let block of this.bricks.getChildren()){
            
            block.y+=n;
            block.setDisplaySize(cellWidth, cellHeight);
            block.setSize(cellWidth, cellHeight, true);
            block.setOrigin(0.5, true);
            
            block.enableBody(true, block.x, block.y, true, true);
        }
    }

    startLvl_2(){
        this.gameBg.setTexture('background_2');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 3,
            gridAlign: { width: 3, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: gameOffsetX+110, y: 125}
        })

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: gameOffsetX+110, y: 125+cellHeight}
        })

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow'],
            frameQuantity: 5,
            gridAlign: { width: 5, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: gameOffsetX+110, y: 125+(cellHeight*2)}
        })

        this.blocks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple'],
            frameQuantity: 6,
            gridAlign: { width: 6, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: gameOffsetX+110, y: 125+(cellHeight*3)}
        })

        this.blocks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue', 'red'],
            frameQuantity: 7,
            gridAlign: { width: 7, height: 2, cellWidth: cellWidth, cellHeight: cellHeight, x: gameOffsetX+110, y: 125+(cellHeight*4)}
        })

        this.blocks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow'],
            frameQuantity: 8,
            gridAlign: { width: 8, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: gameOffsetX+110, y: 125+(cellHeight*6)}
        })
        this.blocks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple'],
            frameQuantity: 9,
            gridAlign: { width: 9, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: gameOffsetX+110, y: 125+(cellHeight*7)}
        })
        this.blocks7 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 2, cellWidth: cellWidth, cellHeight: cellHeight, x: gameOffsetX+110, y: 125+(cellHeight*8)}
        })

        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.blocks3.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.blocks4.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.blocks5.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.blocks6.getChildren()){
            this.bricks.add(ell);
        }
        for(let block of this.blocks7.getChildren()){
            this.bricks.add(block);
        }
        let steel = this.blocks7.getChildren();
        steel[steel.length-1].setFrame('blue');

        let n = 0
        for( let block of this.bricks.getChildren()){
            
            block.y+=n;
            block.setDisplaySize(cellWidth, cellHeight);
            block.setSize(cellWidth, cellHeight, true);
            block.setOrigin(0.5, true);
            
            block.enableBody(true, block.x, block.y, true, true);
        }
    }

    startLvl_3(){
        this.gameBg.setTexture('background_3');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple'],
            frameQuantity: 9,
            gridAlign: { width: 1, height: 9, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth/2), y: zero.y},
        })
        this.bricks.getChildren()[7].setFrame('grey');

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow'],
            frameQuantity: 9,
            gridAlign: { width: 1, height: 9, cellWidth: cellWidth, cellHeight: cellHeight, x: this.bricks.getChildren()[0].x + (cellWidth*2), y: zero.y}
        })
        this.bricks1.getChildren()[7].setFrame('grey');
        this.bricks1.getChildren()[2].setFrame('grey');
        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 9,
            gridAlign: { width: 1, height: 9, cellWidth: cellWidth, cellHeight: cellHeight, x: this.bricks.getChildren()[0].x + (cellWidth*4), y: zero.y}
        })
        this.bricks2.getChildren()[2].setFrame('grey');
        this.bricks2.getChildren()[7].setFrame('grey');
        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 9,
            gridAlign: { width: 1, height: 9, cellWidth: cellWidth, cellHeight: cellHeight, x: this.bricks.getChildren()[0].x + (cellWidth*6), y: zero.y}
        })
        this.bricks3.getChildren()[2].setFrame('grey');
        this.bricks3.getChildren()[7].setFrame('grey');
        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple'],
            frameQuantity: 9,
            gridAlign: { width: 1, height: 9, cellWidth: cellWidth, cellHeight: cellHeight, x: this.bricks.getChildren()[0].x + (cellWidth*8), y: zero.y}
        })
        this.bricks4.getChildren()[7].setFrame('grey');

        this.blocks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple'],
            frameQuantity: 3,
            gridAlign: { width: 3, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: this.bricks1.getChildren()[0].x+(cellWidth), y: this.bricks1.getChildren()[2].y}
        })
        this.blocks5.getChildren()[1].disableBody(true, this.blocks5.getChildren()[1].x, this.blocks5.getChildren()[1].y, true, true);
        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell);
        }
        for(let block of this.blocks5.getChildren()){
            this.bricks.add(block);
        }
    }

    startLvl_4(){
        this.gameBg.setTexture('background_4');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y},
        })

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+(cellHeight*2)},
        })

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+(cellHeight*4)},
        })
        for(let i = 4; i<10; i++){
            this.bricks2.getChildren()[i].setFrame('grey');
        }

        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+(cellHeight*6)},
        })

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+(cellHeight*8)},
        })
        for(let i = 0; i<6; i++){
            this.bricks4.getChildren()[i].setFrame('grey');
        }

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 3,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: this.bricks.getChildren()[7].x, y: zero.y+(cellHeight)},
        })
        this.bricks5.getChildren()[1].disableBody(true, this.bricks5.getChildren()[1].x, this.bricks5.getChildren()[1].y, true, true);

        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 3,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: this.bricks2.getChildren()[2].x, y: this.bricks2.getChildren()[0].y+(cellHeight)},
        })
        this.bricks6.getChildren()[1].disableBody(true, this.bricks5.getChildren()[1].x, this.bricks5.getChildren()[1].y, true, true);

        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell);
        }
    }

    startLvl_5(){
        this.gameBg.setTexture('background_5');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*3), y: zero.y-cellHeight},
        })

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 6,
            gridAlign: { width: 6, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*2), y: zero.y},
        })
        for(let i = 1; i<5; i++){
            this.bricks1.getChildren()[i].setFrame('purple');
        }

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 8,
            gridAlign: { width: 8, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + cellWidth, y: zero.y+(cellHeight)},
        })

        for(let i = 1; i<7; i++){
            this.bricks2.getChildren()[i].setFrame('yellow');
        }

        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 8,
            gridAlign: { width: 8, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + cellWidth, y: zero.y+(cellHeight*2)},
        })

        for(let i = 1; i<7; i++){
            this.bricks3.getChildren()[i].setFrame('yellow');
        }

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+(cellHeight*3)},
        })

        for(let i = 2; i<8; i++){
            this.bricks4.getChildren()[i].setFrame('red');
        }

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 8,
            gridAlign: { width: 8, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + cellWidth, y: zero.y+(cellHeight*4)},
        })

        for(let i = 1; i<7; i++){
            this.bricks5.getChildren()[i].setFrame('yellow');
        }

        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 8,
            gridAlign: { width: 8, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + cellWidth, y: zero.y+(cellHeight*5)},
        })

        for(let i = 1; i<7; i++){
            this.bricks6.getChildren()[i].setFrame('yellow');
        }

        this.bricks7 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 6,
            gridAlign: { width: 6, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*2), y: zero.y+(cellHeight*6)},
        })

        for(let i = 1; i<5; i++){
            this.bricks7.getChildren()[i].setFrame('purple');
        }

        this.bricks8 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*3), y: zero.y+(cellHeight*7)},
        })


        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks7.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks8.getChildren()){
            this.bricks.add(ell);
        }

    }

    startLvl_6(){
        this.gameBg.setTexture('background_6');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y-cellHeight},
        })

        for(let i = 2; i<4; i++){
            this.bricks.getChildren()[i].disableBody(true, this.bricks.getChildren()[i].x, this.bricks.getChildren()[i].y, true, true);
            this.bricks.getChildren()[i+4].disableBody(true, this.bricks.getChildren()[i].x, this.bricks.getChildren()[i].y, true, true);
            this.bricks.getChildren()[i+2].setFrame('purple');
        }

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y},
        })

        for(let i = 2; i<4; i++){
            this.bricks1.getChildren()[i].disableBody(true, this.bricks.getChildren()[i].x, this.bricks.getChildren()[i].y, true, true);
            this.bricks1.getChildren()[i+4].disableBody(true, this.bricks.getChildren()[i].x, this.bricks.getChildren()[i].y, true, true);
            this.bricks1.getChildren()[i+2].setFrame('purple');
        }

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: this.bricks1.getChildren()[0].y+(cellHeight)},
        })

        for(let i = 2; i<4; i++){
            this.bricks2.getChildren()[i].disableBody(true, this.bricks.getChildren()[i].x, this.bricks.getChildren()[i].y, true, true);
            this.bricks2.getChildren()[i+4].disableBody(true, this.bricks.getChildren()[i].x, this.bricks.getChildren()[i].y, true, true);
        }

        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow'],
            frameQuantity: 6,
            gridAlign: { width: 6, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*2), y: this.bricks2.getChildren()[1].y+(cellHeight)},
        })

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 6,
            gridAlign: { width: 6, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*2), y: this.bricks3.getChildren()[1].y+(cellHeight)},
        })

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey'],
            frameQuantity: 6,
            gridAlign: { width: 6, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*2), y: this.bricks4.getChildren()[1].y+(cellHeight)},
        })

        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: this.bricks5.getChildren()[0].y+(cellHeight)},
        })

        for(let i = 2; i<4; i++){
            this.bricks6.getChildren()[i].disableBody(true, this.bricks.getChildren()[i].x, this.bricks.getChildren()[i].y, true, true);
            this.bricks6.getChildren()[i+4].disableBody(true, this.bricks.getChildren()[i].x, this.bricks.getChildren()[i].y, true, true);
            this.bricks6.getChildren()[i+2].setFrame('blue');
        }

        this.bricks7 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: this.bricks6.getChildren()[0].y+(cellHeight)},
        })

        for(let i = 2; i<4; i++){
            this.bricks7.getChildren()[i].disableBody(true, this.bricks.getChildren()[i].x, this.bricks.getChildren()[i].y, true, true);
            this.bricks7.getChildren()[i+4].disableBody(true, this.bricks.getChildren()[i].x, this.bricks.getChildren()[i].y, true, true);
            this.bricks7.getChildren()[i+2].setFrame('blue');
        }

        this.bricks8 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: this.bricks7.getChildren()[0].y+(cellHeight)},
        })

        for(let i = 2; i<4; i++){
            this.bricks8.getChildren()[i].disableBody(true, this.bricks.getChildren()[i].x, this.bricks.getChildren()[i].y, true, true);
            this.bricks8.getChildren()[i+4].disableBody(true, this.bricks.getChildren()[i].x, this.bricks.getChildren()[i].y, true, true);
            
        }

        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks7.getChildren()){
            this.bricks.add(ell);
        }
        for(let ell of this.bricks8.getChildren()){
            this.bricks.add(ell);
        }
    }

    startLvl_7(){
        this.gameBg.setTexture('background_1');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y-cellHeight},
        })

        for(let i =3; i<7; i++){
            this.bricks.getChildren()[i].setFrame('blue');
        }
        for(let i = 7; i<this.bricks.getChildren().length; i++){
            this.bricks.getChildren()[i].setFrame('purple');
        }

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y},
        })

        for(let i =3; i<7; i++){
            this.bricks1.getChildren()[i].setFrame('blue');
        }
        for(let i = 7; i<this.bricks.getChildren().length; i++){
            this.bricks1.getChildren()[i].setFrame('purple');
        }

        for(let i = 4; i<6; i++){
            this.bricks1.getChildren()[i].setFrame('red');
        }

        this.bricks1.getChildren()[1].setFrame('yellow');
        this.bricks1.getChildren()[this.bricks1.getChildren().length-2].setFrame('yellow');

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: this.bricks1.getChildren()[0].y+(cellHeight)},
        })

        for(let i =3; i<7; i++){
            this.bricks2.getChildren()[i].setFrame('blue');
        }
        for(let i = 7; i<this.bricks.getChildren().length; i++){
            this.bricks2.getChildren()[i].setFrame('purple');
        }

        for(let i = 4; i<6; i++){
            this.bricks2.getChildren()[i].setFrame('yellow');
        }

        this.bricks2.getChildren()[1].disableBody(true, this.bricks2.getChildren()[1].x, this.bricks2.getChildren()[1].y, true, true);
        this.bricks2.getChildren()[this.bricks2.getChildren().length-2].disableBody(true, this.bricks2.getChildren()[this.bricks2.getChildren().length-2].x, this.bricks2.getChildren()[this.bricks2.getChildren().length-2].y, true, true);


        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: this.bricks2.getChildren()[0].y+(cellHeight)},
        })

        for(let i =3; i<7; i++){
            this.bricks3.getChildren()[i].setFrame('blue');
        }
        for(let i = 7; i<this.bricks.getChildren().length; i++){
            this.bricks3.getChildren()[i].setFrame('purple');
        }

        for(let i = 4; i<6; i++){
            this.bricks3.getChildren()[i].disableBody(true, this.bricks3.getChildren()[i].x, this.bricks3.getChildren()[i].y, true, true);
        }

        this.bricks3.getChildren()[1].disableBody(true, this.bricks2.getChildren()[1].x, this.bricks2.getChildren()[1].y, true, true);
        this.bricks3.getChildren()[this.bricks3.getChildren().length-2].disableBody(true, this.bricks3.getChildren()[this.bricks3.getChildren().length-2].x, this.bricks3.getChildren()[this.bricks3.getChildren().length-2].y, true, true);

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: this.bricks3.getChildren()[3].x, y: this.bricks3.getChildren()[0].y+(cellHeight)},   
        })

        for(let i =1; i < 3; i++){
            this.bricks4.getChildren()[i].setFrame('purple');
        }

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: this.bricks3.getChildren()[3].x, y: this.bricks4.getChildren()[0].y+(cellHeight)},   
        })

        for(let i =1; i < 3; i++){
            this.bricks5.getChildren()[i].disableBody(true, this.bricks5.getChildren()[i].x, this.bricks5.getChildren()[i].y, true, true);
        }

        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: this.bricks3.getChildren()[3].x, y: this.bricks5.getChildren()[0].y+(cellHeight)},   
        })

        for(let i =1; i < 3; i++){
            this.bricks6.getChildren()[i].setFrame('yellow');
        }

        this.bricks7 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: this.bricks3.getChildren()[3].x, y: this.bricks6.getChildren()[0].y+(cellHeight)},   
        })

        for(let i =1; i < 3; i++){
            this.bricks7.getChildren()[i].setFrame('red');
        }

        this.bricks8 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: this.bricks3.getChildren()[3].x, y: this.bricks7.getChildren()[0].y+(cellHeight)},   
        })

        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks7.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks8.getChildren()){
            this.bricks.add(ell)
        }
        
    }

    startLvl_8(){
        this.gameBg.setTexture('background_2');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y-cellHeight},
        })

        for(let i = 3; i > 1; i--){
            this.bricks.getChildren()[i].setFrame('yellow');
            this.bricks.getChildren()[i].y += cellHeight;
            this.bricks.getChildren()[i-2].setFrame('yellow');
            this.bricks.getChildren()[i-2].y += cellHeight*2;
        }

        for(let i = 8; i < this.bricks.getChildren().length; i++){
            this.bricks.getChildren()[i].setFrame('yellow');
            this.bricks.getChildren()[i].y += cellHeight*2;
            this.bricks.getChildren()[i-2].setFrame('yellow');
            this.bricks.getChildren()[i-2].y += cellHeight;
        }

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y + (cellHeight)},
        })

        for(let i = 3; i > 1; i--){
            this.bricks2.getChildren()[i].setFrame('blue');
            this.bricks2.getChildren()[i].y += cellHeight;
            this.bricks2.getChildren()[i-2].setFrame('blue');
            this.bricks2.getChildren()[i-2].y += cellHeight*2;
        }

        for(let i = 8; i < this.bricks2.getChildren().length; i++){
            this.bricks2.getChildren()[i].setFrame('blue');
            this.bricks2.getChildren()[i].y += cellHeight*2;
            this.bricks2.getChildren()[i-2].setFrame('blue');
            this.bricks2.getChildren()[i-2].y += cellHeight;
        }

        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y + (cellHeight*3)},
        })

        for(let i = 3; i > 1; i--){
            this.bricks3.getChildren()[i].setFrame('purple');
            this.bricks3.getChildren()[i].y += cellHeight;
            this.bricks3.getChildren()[i-2].setFrame('grey');
            this.bricks3.getChildren()[i-2].y += cellHeight*2;
        }

        for(let i = 8; i < this.bricks3.getChildren().length; i++){
            this.bricks3.getChildren()[i].setFrame('grey');
            this.bricks3.getChildren()[i].y += cellHeight*2;
            this.bricks3.getChildren()[i-2].setFrame('purple');
            this.bricks3.getChildren()[i-2].y += cellHeight;
        }

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y + (cellHeight*5)},
        })

        for(let i = 3; i > 1; i--){
            this.bricks4.getChildren()[i].setFrame('blue');
            this.bricks4.getChildren()[i].y += cellHeight;
            this.bricks4.getChildren()[i-2].setFrame('blue');
            this.bricks4.getChildren()[i-2].y += cellHeight*2;
        }

        for(let i = 8; i < this.bricks4.getChildren().length; i++){
            this.bricks4.getChildren()[i].setFrame('blue');
            this.bricks4.getChildren()[i].y += cellHeight*2;
            this.bricks4.getChildren()[i-2].setFrame('blue');
            this.bricks4.getChildren()[i-2].y += cellHeight;
        }

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey'],
            frameQuantity: 2,
            gridAlign: { width: 2, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: this.bricks4.getChildren()[4].x, y: zero.y + (cellHeight*7)},
        })

        for(let ell of this.bricks2.getChildren()){
            ell.enableBody(true, ell.x, ell.y, true, true);
            this.bricks.add(ell)
        }
        for(let ell of this.bricks3.getChildren()){
            ell.enableBody(true, ell.x, ell.y, true, true);
            this.bricks.add(ell)
        }
        for(let ell of this.bricks4.getChildren()){
            ell.enableBody(true, ell.x, ell.y, true, true);
            this.bricks.add(ell)
        }
        for(let ell of this.bricks5.getChildren()){
            ell.enableBody(true, ell.x, ell.y, true, true);
            this.bricks.add(ell)
        }
    }

    startLvl_9(){
        this.gameBg.setTexture('background_3');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow'],
            frameQuantity: 2,
            gridAlign: { width: 2, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*3), y: zero.y-cellHeight},
        })

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*2), y: zero.y},
        })

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue', 'purple'],
            frameQuantity: 6,
            gridAlign: { width: 6, height: 2, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth), y: zero.y + (cellHeight)},
        })

        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red'],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*2), y: zero.y + (cellHeight*3)},
        })

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow'],
            frameQuantity: 2,
            gridAlign: { width: 2, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*3), y: zero.y+(cellHeight*4)},
        })

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey'],
            frameQuantity: 8,
            gridAlign: { width: 8, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y + (cellHeight*7)},
        })

        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey'],
            frameQuantity: 9,
            gridAlign: { width: 1, height: 9, cellWidth: cellWidth, cellHeight: cellHeight, x: this.bricks5.getChildren()[7].x + cellWidth, y: zero.y-(cellHeight)},
        })

        this.bricks6.getChildren()[1].disableBody(true, this.bricks6.getChildren()[1].x, this.bricks6.getChildren()[1].y, true, true);
        this.bricks6.getChildren()[2].disableBody(true, this.bricks6.getChildren()[1].x, this.bricks6.getChildren()[1].y, true, true);

        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell)
        }
    }

    startLvl_10(){
        this.gameBg.setTexture('background_4');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow'],
            frameQuantity: 9,
            gridAlign: { width: 1, height: 9, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x , y: zero.y - cellHeight},
        })

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple'],
            frameQuantity: 9,
            gridAlign: { width: 1, height: 9, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth) , y: zero.y - cellHeight},
        })

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 7,
            gridAlign: { width: 1, height: 7, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*2) , y: zero.y},
        })
        this.bricks2.getChildren()[1].disableBody(true, this.bricks2.getChildren()[0].x, this.bricks2.getChildren()[0].y, true, true);
        this.bricks2.getChildren()[3].disableBody(true, this.bricks2.getChildren()[3].x, this.bricks2.getChildren()[3].y, true, true);
        this.bricks2.getChildren()[5].disableBody(true, this.bricks2.getChildren()[5].x, this.bricks2.getChildren()[5].y, true, true);


        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 7,
            gridAlign: { width: 1, height: 7, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*3) , y: zero.y},
        })

        this.bricks3.getChildren()[0].disableBody(true, this.bricks3.getChildren()[0].x, this.bricks3.getChildren()[0].y, true, true);
        this.bricks3.getChildren()[2].disableBody(true, this.bricks3.getChildren()[2].x, this.bricks3.getChildren()[2].y, true, true);
        this.bricks3.getChildren()[4].disableBody(true, this.bricks3.getChildren()[4].x, this.bricks3.getChildren()[4].y, true, true);
        this.bricks3.getChildren()[6].disableBody(true, this.bricks3.getChildren()[6].x, this.bricks3.getChildren()[6].y, true, true);

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow'],
            frameQuantity: 9,
            gridAlign: { width: 1, height: 9, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*4) , y: zero.y - cellHeight},
        })

        for(let ind = 0.5; ind < this.bricks4.getChildren().length/2; ind++){
            this.bricks4.getChildren()[ind*2].setFrame('red');    
        }

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow'],
            frameQuantity: 9,
            gridAlign: { width: 1, height: 9, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*5) , y: zero.y - cellHeight},
        })

        for(let ind = 0.5; ind < this.bricks5.getChildren().length/2; ind++){
            this.bricks5.getChildren()[ind*2].setFrame('red');    
        }


        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 7,
            gridAlign: { width: 1, height: 7, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*6) , y: zero.y},
        })

        this.bricks6.getChildren()[0].disableBody(true, this.bricks6.getChildren()[0].x, this.bricks6.getChildren()[0].y, true, true);
        this.bricks6.getChildren()[2].disableBody(true, this.bricks6.getChildren()[2].x, this.bricks6.getChildren()[2].y, true, true);
        this.bricks6.getChildren()[4].disableBody(true, this.bricks6.getChildren()[4].x, this.bricks6.getChildren()[4].y, true, true);
        this.bricks6.getChildren()[6].disableBody(true, this.bricks6.getChildren()[6].x, this.bricks6.getChildren()[6].y, true, true);

        this.bricks7 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue'],
            frameQuantity: 7,
            gridAlign: { width: 1, height: 7, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*7) , y: zero.y},
        })
        this.bricks7.getChildren()[1].disableBody(true, this.bricks7.getChildren()[0].x, this.bricks7.getChildren()[0].y, true, true);
        this.bricks7.getChildren()[3].disableBody(true, this.bricks7.getChildren()[3].x, this.bricks7.getChildren()[3].y, true, true);
        this.bricks7.getChildren()[5].disableBody(true, this.bricks7.getChildren()[5].x, this.bricks7.getChildren()[5].y, true, true);

        this.bricks8 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow'],
            frameQuantity: 9,
            gridAlign: { width: 1, height: 9, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*8), y: zero.y - cellHeight},
        })

        this.bricks9 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple'],
            frameQuantity: 9,
            gridAlign: { width: 1, height: 9, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*9), y: zero.y - cellHeight},
        })

        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks7.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks8.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks9.getChildren()){
            this.bricks.add(ell)
        }
    }

    startLvl_11(){
        this.gameBg.setTexture('background_5');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple', 'red', 'yellow', 'blue'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 4, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x , y: zero.y - cellHeight},
        })

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow', 'blue', 'red', 'purple'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 4, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth), y: zero.y-cellHeight},
        })

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow', 'blue', 'red', 'purple'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 4, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*2), y: zero.y-cellHeight},
        })

        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow', 'blue', 'red'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth), y: this.bricks1.getChildren()[3].y+cellHeight},
        })

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow', 'blue', 'red'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*2), y: this.bricks1.getChildren()[3].y+cellHeight},
        })

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['purple'],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: this.bricks4.getChildren()[2].y+cellHeight},
        })
        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['yellow'],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*3), y: this.bricks5.getChildren()[0].y+cellHeight},
        })

        this.bricks7 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow', 'blue', 'red', 'purple'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 4, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*4), y: zero.y-cellHeight},
        })

        this.bricks8 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow', 'blue', 'red', 'purple'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 4, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*5), y: zero.y-cellHeight},
        })

        this.bricks9 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow', 'blue', 'red', 'purple'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 4, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*7), y: zero.y-cellHeight},
        })

        this.bricks10 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow', 'blue', 'red', 'purple'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 4, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*8), y: zero.y-cellHeight},
        })

        this.bricks11 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple', 'red', 'yellow', 'blue'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 4, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*9) , y: zero.y - cellHeight},
        })

        this.bricks12 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow', 'blue', 'red'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*4), y: this.bricks1.getChildren()[3].y+cellHeight},
        })

        this.bricks13 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow', 'blue', 'red'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*5), y: this.bricks1.getChildren()[3].y+cellHeight},
        })

        this.bricks14 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow', 'blue', 'red'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*7), y: this.bricks1.getChildren()[3].y+cellHeight},
        })

        this.bricks15 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow', 'blue', 'red'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*8), y: this.bricks1.getChildren()[3].y+cellHeight},
        })

        this.bricks16 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['grey'],
            frameQuantity: 6,
            gridAlign: { width: 1, height: 6, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*3), y: zero.y - cellHeight},
        })

        this.bricks16.getChildren()[1].disableBody(true, this.bricks16.getChildren()[1].x, this.bricks16.getChildren()[1].y, true, true);
        this.bricks16.getChildren()[4].disableBody(true, this.bricks16.getChildren()[3].x, this.bricks16.getChildren()[3].y, true, true);
        this.bricks16.getChildren()[2].setFrame('yellow');
        this.bricks16.getChildren()[3].setFrame('blue');


        this.bricks17 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['grey'],
            frameQuantity: 6,
            gridAlign: { width: 1, height: 6, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*6), y: zero.y - cellHeight},
        })

        this.bricks17.getChildren()[1].disableBody(true, this.bricks17.getChildren()[1].x, this.bricks17.getChildren()[1].y, true, true);
        this.bricks17.getChildren()[4].disableBody(true, this.bricks17.getChildren()[3].x, this.bricks17.getChildren()[3].y, true, true);
        this.bricks17.getChildren()[2].setFrame('yellow');
        this.bricks17.getChildren()[3].setFrame('blue');

        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks7.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks8.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks9.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks10.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks11.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks12.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks13.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks14.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks15.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks16.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks17.getChildren()){
            this.bricks.add(ell)
        }
    }

    startLvl_12(){
        this.gameBg.setTexture('background_6');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 9,
            gridAlign: { width: 1, height: 9, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y-cellHeight},
        })

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['red'],
            frameQuantity: 8,
            gridAlign: { width: 8, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth), y: zero.y+(cellHeight*7)},
        })

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 9,
            gridAlign: { width: 1, height: 9, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*9), y: zero.y-cellHeight},
        })

        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['yellow'],
            frameQuantity: 6,
            gridAlign: { width: 6, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*2), y: zero.y-cellHeight},
        })

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['yellow'],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*3), y: zero.y},
        })

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['yellow'],
            frameQuantity: 2,
            gridAlign: { width: 2, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*4), y: this.bricks4.getChildren()[0].y+cellHeight},
        })

        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['purple'],
            frameQuantity: 6,
            gridAlign: { width: 1, height: 6, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*2), y: zero.y},
        })

        this.bricks7 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['purple'],
            frameQuantity: 6,
            gridAlign: { width: 1, height: 6, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*7), y: zero.y},
        })

        this.bricks8 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['red'],
            frameQuantity: 4,
            gridAlign: { width: 2, height: 2, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*4), y: zero.y+(cellHeight*5)},
        })

        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks7.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks8.getChildren()){
            this.bricks.add(ell)
        }
    }

    startLvl_13(){
        this.gameBg.setTexture('background_1');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y-cellHeight},
        })

        this.bricks.getChildren()[0].setFrame('grey');
        this.bricks.getChildren()[this.bricks.getChildren().length-1].setFrame('grey');
        this.bricks.getChildren()[this.bricks.getChildren().length-2].setFrame('red');
        this.bricks.getChildren()[1].setFrame('red');

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['purple'],
            frameQuantity: 8,
            gridAlign: { width: 8, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth), y: zero.y},
        })

        this.bricks1.getChildren()[this.bricks1.getChildren().length-2].setFrame('red');
        this.bricks1.getChildren()[1].setFrame('red');

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow',],
            frameQuantity: 6,
            gridAlign: { width: 6, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*2), y: zero.y+cellHeight},
        })

        this.bricks2.getChildren()[this.bricks2.getChildren().length-2].setFrame('red');
        this.bricks2.getChildren()[1].setFrame('red');

        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['grey'],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*3), y: zero.y+(cellHeight*2)},
        })

        this.bricks3.getChildren()[this.bricks3.getChildren().length-2].setFrame('red');
        this.bricks3.getChildren()[1].setFrame('red');

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['grey'],
            frameQuantity: 2,
            gridAlign: { width: 2, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*4), y: this.bricks3.getChildren()[0].y+cellHeight},
        })

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['grey'],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth*3), y: this.bricks4.getChildren()[0].y+cellHeight},
        })

        this.bricks5.getChildren()[this.bricks5.getChildren().length-2].setFrame('red');
        this.bricks5.getChildren()[1].setFrame('red');

        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow',],
            frameQuantity: 6,
            gridAlign: { width: 6, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*2), y: this.bricks5.getChildren()[0].y+cellHeight},
        })

        this.bricks6.getChildren()[this.bricks6.getChildren().length-2].setFrame('red');
        this.bricks6.getChildren()[1].setFrame('red');
        
        this.bricks7 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['purple'],
            frameQuantity: 8,
            gridAlign: { width: 8, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + (cellWidth), y: this.bricks6.getChildren()[0].y+cellHeight},
        })

        this.bricks7.getChildren()[this.bricks7.getChildren().length-2].setFrame('red');
        this.bricks7.getChildren()[1].setFrame('red');

        this.bricks8 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: this.bricks7.getChildren()[0].y+cellHeight},
        })

        this.bricks8.getChildren()[0].setFrame('grey');
        this.bricks8.getChildren()[this.bricks8.getChildren().length-1].setFrame('grey');
        this.bricks8.getChildren()[this.bricks8.getChildren().length-2].setFrame('red');
        this.bricks8.getChildren()[1].setFrame('red');

        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks7.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks8.getChildren()){
            this.bricks.add(ell)
        }
    }

    startLvl_14(){
        this.gameBg.setTexture('background_2');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 3,
            gridAlign: { width: 3, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth), y: zero.y+cellHeight},
        })

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 3,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+(cellHeight*2)},
        })

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 3,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*4), y: zero.y+(cellHeight*2)},
        })

        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 3,
            gridAlign: { width: 3, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth), y: zero.y+(cellHeight*5)},
        })

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 3,
            gridAlign: { width: 3, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*6), y: zero.y+cellHeight},
        })

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 3,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*5), y: zero.y+(cellHeight*2)},
        })

        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 3,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*9), y: zero.y+(cellHeight*2)},
        })

        this.bricks7 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 3,
            gridAlign: { width: 3, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*6), y: zero.y+(cellHeight*5)},
        })

        this.bricks8 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple',],
            frameQuantity: 4,
            gridAlign: { width: 2, height: 2, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*4), y: zero.y+(cellHeight*5)},
        })

        this.bricks9 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple',],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*3), y: zero.y+(cellHeight*7)},
        })

        this.bricks10 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow',],
            frameQuantity: 6,
            gridAlign: { width: 6, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*2), y: zero.y-(cellHeight)},
        })

        for(let i = 1; i<5; i++){
            this.bricks10.getChildren()[i].disableBody(true, true);
        }

        this.bricks11 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red',],
            frameQuantity: 6,
            gridAlign: { width: 6, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+(cellWidth*2), y: zero.y+(cellHeight*3)},
        })

        for(let i = 1; i<5; i++){
            this.bricks11.getChildren()[i].disableBody(true, true);
        }

        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks7.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks8.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks9.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks10.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks11.getChildren()){
            this.bricks.add(ell)
        }
    }

    startLvl_15(){
        this.gameBg.setTexture('background_3');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y-cellHeight},
        })
        this.bricks.getChildren()[1].setFrame('yellow');
        this.bricks.getChildren()[5].setFrame('yellow');
        this.bricks.getChildren()[8].setFrame('yellow');
        this.bricks.getChildren()[2].setFrame('red');
        this.bricks.getChildren()[7].setFrame('red');
        this.bricks.getChildren()[3].setFrame('purple');
        this.bricks.getChildren()[6].setFrame('purple');

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y},
        })

        for(let i = 0; i<5; i++){
            this.bricks1.getChildren()[i*2].disableBody(true, true);
        }
        this.bricks1.getChildren()[3].setFrame('yellow');
        this.bricks1.getChildren()[5].setFrame('red');
        this.bricks1.getChildren()[9].setFrame('yellow');

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+cellHeight},
        })

        for(let i = 0; i<5; i++){
            this.bricks2.getChildren()[i*2].disableBody(true, true);
        }

        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+2*cellHeight},
        })

        this.bricks3.getChildren().forEach(element => {
            element.disableBody(true, true);
        });
        for(let i = 0; i<this.bricks3.getChildren().length/2; i++){
            this.bricks3.getChildren()[i*2].enableBody(true, this.bricks3.getChildren()[i*2].x, this.bricks3.getChildren()[i*2].y, true, true);
        }
        this.bricks3.getChildren()[0].setFrame('yellow');

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+3*cellHeight},
        })

        this.bricks4.getChildren().forEach(element => {
            element.disableBody(true, true);
        });
        for(let i = 0; i<this.bricks4.getChildren().length/2; i++){
            this.bricks4.getChildren()[i*2].enableBody(true, this.bricks4.getChildren()[i*2].x, this.bricks4.getChildren()[i*2].y, true, true);
        }

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+4*cellHeight},
        })

        for(let i = 0; i<5; i++){
            this.bricks5.getChildren()[i*2].disableBody(true, true);
        }
        this.bricks5.getChildren()[3].setFrame('purple');
        this.bricks5.getChildren()[5].setFrame('yellow');
        this.bricks5.getChildren()[7].setFrame('purple');

        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+5*cellHeight},
        })

        for(let i = 0; i<5; i++){
            this.bricks6.getChildren()[i*2].disableBody(true, true);
        }

        this.bricks7 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+6*cellHeight},
        })

        this.bricks7.getChildren().forEach(element => {
            element.disableBody(true, true);
        });
        for(let i = 0; i<this.bricks7.getChildren().length/2; i++){
            this.bricks7.getChildren()[i*2].enableBody(true, this.bricks7.getChildren()[i*2].x, this.bricks7.getChildren()[i*2].y, true, true);
        }
        this.bricks7.getChildren()[0].setFrame('purple');
        this.bricks7.getChildren()[4].setFrame('red');
        this.bricks7.getChildren()[8].setFrame('yellow');


        this.bricks8 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+7*cellHeight},
        })

        this.bricks8.getChildren().forEach(element => {
            element.disableBody(true, true);
        });
        for(let i = 0; i<this.bricks8.getChildren().length/2; i++){
            this.bricks8.getChildren()[i*2].enableBody(true, this.bricks8.getChildren()[i*2].x, this.bricks8.getChildren()[i*2].y, true, true);
        }

        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks7.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks8.getChildren()){
            this.bricks.add(ell)
        }
    }

    startLvl_16(){
        this.gameBg.setTexture('background_4');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y-cellHeight},
        });

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple',],
            frameQuantity: 8,
            gridAlign: { width: 1, height: 8, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y},
        })

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey',],
            frameQuantity: 8,
            gridAlign: { width: 1, height: 8, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + cellWidth, y: zero.y},
        })

        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red',],
            frameQuantity: 16,
            gridAlign: { width: 2, height: 8, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + 2*cellWidth, y: zero.y},
        })

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey',],
            frameQuantity: 16,
            gridAlign: { width: 2, height: 8, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + 4*cellWidth, y: zero.y},
        })

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow',],
            frameQuantity: 16,
            gridAlign: { width: 2, height: 8, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + 6*cellWidth, y: zero.y},
        })

        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey',],
            frameQuantity: 8,
            gridAlign: { width: 1, height: 8, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + 8*cellWidth, y: zero.y},
        })

        this.bricks7 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple',],
            frameQuantity: 8,
            gridAlign: { width: 1, height: 8, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x + 9*cellWidth, y: zero.y},
        })

        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks7.getChildren()){
            this.bricks.add(ell)
        }
    }

    startLvl_17(){
        this.gameBg.setTexture('background_5');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y-cellHeight},
        })

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow',],
            frameQuantity: 7,
            gridAlign: { width: 1, height: 8, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y},
        })

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+7*cellHeight},
        })

        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 7,
            gridAlign: { width: 1, height: 8, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+ 9*cellWidth, y: zero.y},
        })

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey',],
            frameQuantity: 6,
            gridAlign: { width: 6, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+2*cellWidth, y: zero.y+cellHeight},
        })
        this.bricks4.getChildren()[0].setFrame('blue');
        this.bricks4.getChildren()[1].setFrame('blue');
        this.bricks4.getChildren()[this.bricks4.getChildren().length-1].setFrame('yellow');
        this.bricks4.getChildren()[this.bricks4.getChildren().length-2].setFrame('yellow');

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey',],
            frameQuantity: 6,
            gridAlign: { width: 6, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+2*cellWidth, y: zero.y+5*cellHeight},
        })

        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey',],
            frameQuantity: 3,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+2*cellWidth, y: zero.y+2*cellHeight},
        })

        this.bricks6.getChildren()[0].setFrame('blue');

        this.bricks7 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey',],
            frameQuantity: 3,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+7*cellWidth, y: zero.y+2*cellHeight},
        })

        this.bricks7.getChildren()[0].setFrame('yellow');

        this.bricks8 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple',],
            frameQuantity: 2,
            gridAlign: { width: 2, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+4*cellWidth, y: zero.y+3*cellHeight},
        })

        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks7.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks8.getChildren()){
            this.bricks.add(ell)
        }
    }

    startLvl_18(){
        this.gameBg.setTexture('background_6');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y-cellHeight},
        })

        let n = 1
        for(let i = 1; i < 4; i++){
            this.bricks.getChildren()[i].y += cellHeight*n
            n+=1
        }
        let p = 1
        for(let i = 8; i >5; i--){
            this.bricks.getChildren()[i].y += cellHeight*p
            p+=1
        }
        this.bricks.getChildren()[5].y =  this.bricks.getChildren()[3].y+cellHeight*2
        this.bricks.getChildren()[4].y =  this.bricks.getChildren()[3].y+cellHeight*2
        for(let e of this.bricks.getChildren()){
            e.enableBody(true, e.x, e.y, true, true);
        }

        this.bricks0 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y},
        })
        
        n = 1
        p = 1
        for(let i = 1; i < 4; i++){
            this.bricks0.getChildren()[i].y += cellHeight*n
            n+=1
        }
        
        for(let i = 8; i >5; i--){
            this.bricks0.getChildren()[i].y += cellHeight*p
            p+=1
        }
        this.bricks0.getChildren()[5].y =  this.bricks0.getChildren()[3].y+cellHeight*2
        this.bricks0.getChildren()[4].y =  this.bricks0.getChildren()[3].y+cellHeight*2
        for(let e of this.bricks0.getChildren()){
            e.enableBody(true, e.x, e.y, true, true);
        }

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+cellHeight},
        })
        
        n = 1
        p = 1
        for(let i = 1; i < 4; i++){
            this.bricks1.getChildren()[i].y += cellHeight*n
            n+=1
        }
        
        for(let i = 8; i >5; i--){
            this.bricks1.getChildren()[i].y += cellHeight*p
            p+=1
        }
        this.bricks1.getChildren()[5].y =  this.bricks1.getChildren()[3].y+cellHeight*2
        this.bricks1.getChildren()[4].y =  this.bricks1.getChildren()[3].y+cellHeight*2
        for(let e of this.bricks1.getChildren()){
            e.enableBody(true, e.x, e.y, true, true);
        }

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+2*cellHeight},
        })
        
        n = 1
        p = 1
        for(let i = 1; i < 4; i++){
            this.bricks2.getChildren()[i].y += cellHeight*n
            n+=1
        }
        
        for(let i = 8; i >5; i--){
            this.bricks2.getChildren()[i].y += cellHeight*p
            p+=1
        }
        this.bricks2.getChildren()[5].y =  this.bricks2.getChildren()[3].y+cellHeight*2
        this.bricks2.getChildren()[4].y =  this.bricks2.getChildren()[3].y+cellHeight*2
        for(let e of this.bricks2.getChildren()){
            e.enableBody(true, e.x, e.y, true, true);
        }

        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red',],
            frameQuantity: 4,
            gridAlign: { width: 4, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+3*cellWidth, y: zero.y-cellHeight},
        })

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 2,
            gridAlign: { width: 2, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+4*cellWidth, y: zero.y},
        })

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple', 'yellow', 'grey'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+5*cellHeight},
        })

        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['yellow', 'grey'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 2, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+cellWidth, y: zero.y+6*cellHeight},
        })

        this.bricks7 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple', 'yellow', 'grey'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 3, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+9*cellWidth, y: zero.y+5*cellHeight},
        })

        this.bricks8 = this.physics.add.staticGroup({
            key: 'blocks', frame: ['yellow', 'grey'],
            frameQuantity: 1,
            gridAlign: { width: 1, height: 2, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+8*cellWidth, y: zero.y+6*cellHeight},
        })

        for(let ell of this.bricks0.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks7.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks8.getChildren()){
            this.bricks.add(ell)
        }
    }

    startLvl_19(){
        this.gameBg.setTexture('background_1');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'purple',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y-cellHeight},
        })
        for(let i = 3; i<7; i++){
            this.bricks.getChildren()[i].disableBody(true, this.bricks.getChildren()[i].x, this.bricks.getChildren()[i].y, true, true);
        }
        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'blue',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y},
        })

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+cellHeight},
        })
        this.bricks2.getChildren()[4].disableBody(true, true);
        this.bricks2.getChildren()[5].disableBody(true, true);

        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'yellow',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+3*cellHeight},
        })

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+4*cellHeight},
        })
        this.bricks4.getChildren()[4].disableBody(true, true);
        this.bricks4.getChildren()[5].disableBody(true, true);

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+6*cellHeight},
        })

        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+7*cellHeight},
        })
        this.bricks6.getChildren()[4].disableBody(true, true);
        this.bricks6.getChildren()[5].disableBody(true, true);

        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell)
        }
    }

    startLvl_20(){
        this.gameBg.setTexture('background_2');
        this.bricks = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red',],
            frameQuantity: 2,
            gridAlign: { width: 1, height: 2, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+cellWidth, y: zero.y+2*cellHeight},
        })

        this.bricks1 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red',],
            frameQuantity: 4,
            gridAlign: { width: 1, height: 4, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+2*cellWidth, y: zero.y+cellHeight},
        })

        this.bricks2 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red',],
            frameQuantity: 6,
            gridAlign: { width: 1, height: 6, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+3*cellWidth, y: zero.y},
        })

        this.bricks2.getChildren()[2].setFrame('yellow')
        this.bricks2.getChildren()[3].setFrame('yellow')

        this.bricks3 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red',],
            frameQuantity: 6,
            gridAlign: { width: 1, height: 6, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+4*cellWidth, y: zero.y+cellHeight},
        })

        this.bricks3.getChildren()[2].setFrame('yellow')
        this.bricks3.getChildren()[3].setFrame('yellow')

        this.bricks4 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red',],
            frameQuantity: 6,
            gridAlign: { width: 1, height: 6, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+5*cellWidth, y: zero.y+cellHeight},
        })

        this.bricks4.getChildren()[2].setFrame('yellow')
        this.bricks4.getChildren()[3].setFrame('yellow')

        this.bricks5 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red',],
            frameQuantity: 6,
            gridAlign: { width: 1, height: 6, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+6*cellWidth, y: zero.y},
        })

        this.bricks5.getChildren()[2].setFrame('yellow')
        this.bricks5.getChildren()[3].setFrame('yellow')

        this.bricks6 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red',],
            frameQuantity: 4,
            gridAlign: { width: 1, height: 4, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+7*cellWidth, y: zero.y+cellHeight},
        })

        this.bricks7 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'red',],
            frameQuantity: 2,
            gridAlign: { width: 1, height: 2, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x+8*cellWidth, y: zero.y+2*cellHeight},
        })

        this.bricks8 = this.physics.add.staticGroup({
            key: 'blocks', frame: [ 'grey',],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 1, cellWidth: cellWidth, cellHeight: cellHeight, x: zero.x, y: zero.y+9*cellHeight},
        })
        this.bricks8.getChildren()[0].setFrame('purple');
        this.bricks8.getChildren()[this.bricks8.getChildren().length-1].setFrame('purple');

        for(let ell of this.bricks1.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks2.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks3.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks4.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks5.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks6.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks7.getChildren()){
            this.bricks.add(ell)
        }
        for(let ell of this.bricks8.getChildren()){
            this.bricks.add(ell)
        }
    }

    loadScore(){
        if(localStorage.getItem('heighScore_arcnd')){
            this.hieghScoreText = this.add.text(this.score.x, this.score.y+110, `РЕКОРД`, {fontFamily: 'Rubik-Medium', fontSize: '32px', fontStyle: 'bold', color: '#9199AA'});
            this.hieghScore = this.add.text(this.hieghScoreText.x, this.hieghScoreText.y+48, JSON.parse(localStorage.getItem('heighScore_arcnd')), {fontFamily: 'Rubik-Semibold', fontSize: '42px', fontStyle: 'bold', color: '#9199AA'});
        }
    }

    pause(){
        gameState.onGame = false
        this.scene.pause(arcanoid)
        this.scene.launch(scenepause)
    }


    movePaddle(direction){
        switch(direction){
            case 'left':
                this.paddle.setVelocityX(-900);
                this.goingLeft = true
                break;
            case 'right':
                this.paddle.setVelocityX(900);
                this.goingRight = true
                break;
            default:
                this.paddle.setVelocityX(0);
                this.goingRight = false
                this.goingLeft = false
                break;
        }
    }

    goLeft(){
        if(gameState.onGame == true){
            if(this.paddle.x >= 480 ){
                this.paddle.x -= 80
            }
            for (let ball of this.activeBalls.getChildren()) {
                if(ball.getData('onPaddle')){
                    ball.x = this.paddle.x
                }
            }
        }
    }

    goRight(){
        if(gameState.onGame == true){
            if(this.paddle.x <= game.config.width - 170){
                this.paddle.x += 80
            }
            for (let ball of this.activeBalls.getChildren()) {
                if(ball.getData('onPaddle')){
                    ball.x = this.paddle.x
                }
            }
        }
    }

    pickBonusBalls(){
        this.pickBonusSound.play()
        this.bonusStart()
        this.bonus.destroy();
    }

    pickBonusWide(){
        this.pickBonusSound.play()
        this.widePaddle();
        this.bonus.destroy();
    }

    pickBonusLaser(){
        this.pickBonusSound.play()
        this.laserShooting();
        this.bonus.destroy();
    }

    addBonusLaser(){
        if(this.bricks.countActive() == 60 && this.bonuses.getChildren().length == 0 || this.bricks.countActive() == 20 && this.bonuses.getChildren().length == 0){
            this.bonus = this.physics.add.image(this.ball.x, this.ball.y, 'bonusLaser')
            this.bonus.setVelocityY(100)
            this.physics.add.collider(this.bonus, this.paddle, this.pickBonusLaser, null, this);
            this.bonuses.add(this.bonus)
        }
    }

    addBonusBalls(){
        if(this.bricks.countActive() == 60 && this.bonuses.getChildren().length == 0 || this.bricks.countActive() == 20 && this.bonuses.getChildren().length == 0){
            this.bonus = this.physics.add.image(this.ball.x, this.ball.y, 'bonusBalls')
            this.bonus.setVelocityY(100)
            this.physics.add.collider(this.bonus, this.paddle, this.pickBonusBalls, null, this);
            this.bonuses.add(this.bonus)
        }
    }

    addBonusWide(){
        if(this.bricks.countActive() == 60 && this.bonuses.getChildren().length == 0 || this.bricks.countActive() == 20 && this.bonuses.getChildren().length == 0){
            this.bonus = this.physics.add.image(this.ball.x, this.ball.y, 'bonusWide')
            this.bonus.setVelocityY(100)
            this.physics.add.collider(this.bonus, this.paddle, this.pickBonusWide, null, this);
            this.bonuses.add(this.bonus)
        }
    }

    ballBonus(){
        let parent = this.activeBalls.getChildren()[0]
        this.ball = this.physics.add.image(parent.x, parent.y, 'ball').setCollideWorldBounds(true).setBounce(1)
        this.ball.setData('onPaddle', false);
        let x = Math.floor(Math.random() * -100);
        this.ball.setVelocity(x, -300);
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);
        // this.physics.add.overlap(this.paddle, this.ball, ()=>{this.ball.setVelocity(-75,-300)}, null, this );
        this.activeBalls.add(this.ball)
        this.ball.body.maxVelocity.y = 500
        this.ball.body.maxVelocity.x = 500
    }

    bonusStart(){
            var timedEvent = this.time.addEvent({
            delay: 0,
            callback: this.ballBonus,
            callbackScope: this,
            repeat: 1
        });
        
    }

    widePaddle(){
        this.paddle.displayWidth+=100
        setTimeout(()=>{this.paddle.displayWidth-=50}, 5000)
    }

    addLaser(){
        this.laserL = this.physics.add.image(this.paddle.x - this.paddle.width/3+10, this.paddle.y, 'laser').setDepth(0);
        this.laserR = this.physics.add.image(this.paddle.x + this.paddle.width/3-10, this.paddle.y, 'laser').setDepth(0);
        this.paddle.setTexture('paddle_shoot');
        this.paddle.setDepth(1);
        this.laserGroup.add(this.laserL);
        this.laserGroup.add(this.laserR);
        this.laserL.setVelocityY(-200);
        this.laserR.setVelocityY(-200);
        
        this.physics.add.collider(this.laserL, this.bricks, this.shootBrick, this.clearLaser, this);
        this.physics.add.collider(this.laserR, this.bricks, this.shootBrick, this.clearLaser, this);
        
    }

    clearLaser(bullet){
        bullet.disableBody(true, true);
    }

    laserShooting(){
        console.log('shootin')
        var timedEvent = this.time.addEvent({
            delay: 500,
            callback: this.addLaser,
            callbackScope: this,
            repeat: 20,
        })

        var resetPaddle = this.time.addEvent({
            delay: 11000,
            callback: ()=> this.paddle.setTexture('paddle'),
            callbackScope: this,
            repeat: false
        })
        //setTimeout(()=>{this.paddle.setTexture('paddle')}, 11000)
    }

    dropBall(){
        if(gameState.onGame == true){
            
            let balls = this.activeBalls.getChildren();
            let target;
            for(let ball of balls){
                if(ball.getData('onPaddle')){
                    target = ball;
                    target.setVelocity(-75, -300)
                    target.setData('onPaddle', false)
                    break;
                }
            }
        }
    }

    hitBrick(ball, block){
        this.brickHitSound.play();
        console.log(this.bricks.countActive())
        block.hp--
        var rand = Math.random();
        if(block.hp == 0){
            gameState.score += 1
            block.disableBody(true, true);
            rand > 0.5 ? this.addBonusBalls() : (rand > 0.6 ? this.addBonusWide(): this.addBonusLaser());
        }
        if(block.frame.name === 'purple' || block.frame.name === 'red'){
            block.setTexture(`broken_${block.frame.name}`)
        }
        
        if (this.activeBlocks.countActive() === 0)
        {
            this.winSound.play();
            // gameState.lvl += 1
            this.scene.start('nextLvl');
        }
        this.saveScore()
        
    }

    shootBrick(ball, block){
        this.brickHitSound.play();
        console.log(this.bricks.countActive())
        gameState.score += 1
        block.disableBody(true, true);
        var rand = Math.random();
        rand > 0.5 ? this.addBonusBalls() : (rand > 0.6 ? this.addBonusWide(): this.addBonusLaser());
        if (this.activeBlocks.countActive() === 0)
        {
            this.winSound.play();
            // gameState.lvl += 1
            this.scene.start('nextLvl');
        }
    }

    resetBall(){
        if(this.hp!==0){
            this.ball = this.physics.add.image(900, gameHeight - 130, 'ball').setCollideWorldBounds(true).setBounce(1).setOrigin(0.5)
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, gameHeight - 130);
        this.ball.setData('onPaddle', true);
        this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);
        // this.physics.add.overlap(this.paddle, this.ball, ()=>{this.ball.setVelocity(-75,-300)}, null, this );
        this.activeBalls.add(this.ball)
        this.ball.body.maxVelocity.y = 500
        this.ball.body.maxVelocity.x = 500
        }
        
    }

   

    hitPaddle(ball, paddle){
        this.paddleHitSound.play();
        var diff = 0;

        if (ball.x < paddle.x)
        {

            // ball.setVelocityX(-250)
            diff = paddle.x - ball.x;
            ball.setVelocityX(-5 * diff);
        }
        else if (ball.x > paddle.x)
        {

            // ball.setVelocityX(250)
            diff = ball.x - paddle.x;
            ball.setVelocityX(5 * diff);
        }
        else
        {
            ball.setVelocityX(2 + Math.random() * 8);
        }
    }

    update(){
        
        this.paddle.setVelocityX(0);
        this.score.setText(`${gameState.score}`);
        if(this.hp == 0){
            this.loseSound.play();
            this.scene.stop();
            this.scene.start(gameOver);
        }

        // for(let ball of this.activeBalls.getChildren()){
        //     this.physics.add.overlap(this.paddle, ball, ()=>{ball.setVelocity(-75,-300)}, null, this );
        // }

        var balls = this.activeBalls.getChildren()
        for(var i = 0; i < balls.length; i++){
            balls[i].body.maxVelocity.x = 450;
            balls[i].body.maxVelocity.y = 450;
            if(balls[i].y > game.config.height){
                this.lostSound.play();
                balls[i].destroy()
                if (balls.length == 0)
                {
                    this.hp-=1
                    this.hpTracker[this.hp].visible = false
                    this.resetBall()
                }
            }
        }
    }
}

var arcanoid = new Arcanoid()