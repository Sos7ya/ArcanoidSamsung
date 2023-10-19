var startGame = {
    action: 'startGame',
    allGameSessionId : sessionID,
    gameSessionId: gameId,
    timeStamp: Date.now()
}

class MainMenu extends Phaser.Scene{
    constructor(){
        super({key: 'mainmenu'})
    }

    create(){
        gameState.onMenu = true
        this.mainBg = this.add.image(game.config.width / 2, game.config.height / 2, 'mainBg').setOrigin(0.5)
        this.mainBg.setDisplaySize(game.config.width, game.config.height)
        this.bgMusik = this.sound.add('bgMusick', {loop: true, volume: 0.3});
        

        this.selector = this.add.image(game.config.width / 2, game.config.height / 2 + 70, "selector").setOrigin(0.5)
        this.btnStart = this.add.sprite(game.config.width / 2, game.config.height / 2 + 70, 'startSelected');
        this.btnStart.setOrigin(0.5)

        this.btnClose = this.add.sprite(this.btnStart.x, this.btnStart.y + 120, 'exitEmpty').setOrigin(0.5);

        this.btnStart.setInteractive()
        this.btnClose.setInteractive()
        this.btnClose.on('pointerdown', this.exit, this)
        this.btnStart.on('pointerdown', this.startGame, this)

        //this.versionText = this.add.text(game.config.width - 60, game.config.height - 40, `${game_version}`, { fontFamily:'Arial', fontStyle:'bold', fontSize: '30px', fill: '#fff' }).setOrigin(0.5);
        this.loadScore();

        document.addEventListener('keydown',(e)=>{
            if(e.keyCode == 8 || e.keyCode == 10009 || e.keyCode == 461 || e.keyCode == 166 || e.keyCode == 196){
                this.exit()
            }
        })
        this.versionText = this.add.text(game.config.width - 60, game.config.height - 40, `${game_version}`, { fontFamily:'Arial', fontStyle:'bold', fontSize: '30px', fill: '#fff' }).setOrigin(0.5);
        this.checkStorage()

        this.ageInfo = this.add.image(game.config.width - 150, 100, 'ageInfo');
        this.controlsInfo = this.add.image(260, 100, 'controlsInfo').setOrigin(0.5)
    }

    loadScore(){
        if(localStorage.getItem('heighScore_arcnd')){
            if(JSON.parse(localStorage.getItem('heighScore_arcnd')) === undefined){
                localStorage.setItem('heighScore_arcnd', JSON.stringify(0))
            }
            this.heigScoreText = this.add.text(game.config.width / 2, game.config.height - 100, `${JSON.parse(localStorage.getItem('heighScore_arcnd'))}`, {
                fontFamily: 'Rubik-Medium',
                fontSize: 64,
                fontStyle: 'normal',
                color: '#ffffff',
            }).setOrigin(0.5)
            this.heigScoreTitle = this.add.text(this.heigScoreText.x, this.heigScoreText.y - 75, "Рекорд", {
                fontFamily: 'Rubik-Regular',
                fontSize: 48,
                fontStyle: 'normal',
                color: '#D0DBD1',
            }).setOrigin(0.5)
        }
    }

    selectorDown(){
        if(gameState.onMenu == true){
            if(this.selector.y != this.btnClose.y){
              this.selector.y = this.btnClose.y
              this.btnClose.setTexture('exitSelected')
              this.btnStart.setTexture('startEmpty')
            }
        }
    }

    selectorUp(){
        if(gameState.onMenu == true){
            if(this.selector.y != this.btnStart.y){
                this.selector.y = this.btnStart.y
                this.btnStart.setTexture('startSelected')
                this.btnClose.setTexture('exitEmpty')
            }
        }
    }

    gameToggle(){
        if(gameState.onMenu == true){
            if(this.selector.y == this.btnStart.y){
                this.startGame()
            }
            else if(this.selector.y == this.btnClose.y){
                this.exit()
            }
        }
    }

    startGame(){
        gameState.onMenu = false
        this.bgMusik.play();
        startGame.gameSessionId = generateUUID();
        startGame.allGameSessionId = sessionID;
        window?.parent.postMessage(startGame, '*');
        this.scene.start('arcanoid')
    }
    exit(){
        if(gameState.onMenu){
            let closeGameSession = {
                action: 'closeGameSession',
                allGameSessionId : sessionID,
                timeStamp : Date.now()
            }
    
            window?.parent.postMessage(closeGameSession, '*');
        }
    }

    checkStorage(){
        if(localStorage.getItem('lvl_arcnd')){
            //localStorage.lvl_arcnd = localStorage.lvl_arcnd == undefined ? 1 : localStorage.lvl_arcnd
            return localStorage.getItem('lvl_arcnd') === 'undefined' ? localStorage.setItem('lvl_arcnd', JSON.stringify(1)) : console.log(`Все отлично! Вас ждет уровень: ${localStorage.getItem('lvl_arcnd')}!`)
        }
    }
}

var mainmenu = new MainMenu()