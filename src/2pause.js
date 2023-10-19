class ScenePause extends Phaser.Scene{
    constructor(){
        super({key: 'pause'})
    }

    create(){
        gameState.onPause = true

        try{
            let gamePause = {
                action: 'gamePause',
                allGameSessionId: startGame.allGameSessionId,
                gameSessionId: startGame.gameSessionId,
                score: gameState.score,
                timeStamp : Date.now()
            }
    
            window?.parent.postMessage(gamePause, '*');
        }
        catch(er){
            let gamePauseError = {
                action: 'gamePauseError',
                allGameSessionId: startGame.allGameSessionId,
                gameSessionId: startGame.gameSessionId,
                score: gameState.score,
                timeStamp : Date.now()
            }
    
            window?.parent.postMessage(gamePauseError, '*');
        }

        this.pauseBg = this.add.image(game.config.width / 2, game.config.height / 2, 'pauseBg')
        this.pauseBg.setOrigin(0.5)
        this.pauseBg.setDisplaySize(game.config.width, game.config.height)

        this.pauseTitle = this.add.image(game.config.width / 2, game.config.height / 2 - 260, 'pauseTitle').setOrigin(0.5)
        this.selector = this.add.image(game.config.width / 2, game.config.height / 2+70, "selector").setOrigin(0.5)
        this.btnStart = this.add.sprite(game.config.width / 2, game.config.height / 2+70, 'resumeSelected');
        this.btnStart.setOrigin(0.5)

        this.btnClose = this.add.sprite(this.btnStart.x, this.btnStart.y + 120, 'exitEmpty');

        document.addEventListener('keydown',(e)=>{
            if(e.keyCode == 8 || e.keyCode == 10009 || e.keyCode == 461 || e.keyCode == 166 || e.keyCode == 196){
                this.exit()
            }
        })
        
        this.btnStart.setInteractive()
        this.btnClose.setInteractive()
        this.btnClose.on('pointerdown', this.exit, this)
        this.btnStart.on('pointerdown', this.resumeGame, this)

        this.input.keyboard.on('keydown-ENTER', this.gameToggle, this)
        this.loadScore();
        this.score = this.add.text(game.config.width/2-150, game.config.height - 100, `${gameState.score}`, { fontFamily:'Arial', fontStyle:'bold', fontSize: '64px', fill: '#fff' }).setOrigin(0.5);
        this.scoreTitle = this.add.text (this.score.x, this.score.y - 75, "Счет", {
            fontFamily: 'Rubik-Regular',
            fontSize: 48,
            fontStyle: 'normal',
            color: '#D0DBD1',
        }).setOrigin(0.5);
        this.controlsInfo = this.add.image(260, 100, 'controlsInfo').setOrigin(0.5)
    }

    loadScore(){
        if(localStorage.getItem('heighScore_arcnd')){
            this.heigScoreText = this.add.text(game.config.width / 2 + 150, game.config.height - 100,`${JSON.parse(localStorage.getItem('heighScore_arcnd'))}`, {
                fontFamily: 'Arial',
                fontSize: 64,
                fontStyle: 'bold',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);

            this.heigScoreTitle = this.add.text(this.heigScoreText.x, this.heigScoreText.y - 75, "Рекорд", {
                fontFamily: 'Rubik-Regular',
                fontSize: 48,
                fontStyle: 'normal',
                color: '#D0DBD1',
            }).setOrigin(0.5);

            this.line = this.add.image(game.config.width / 2, game.config.height - 100, 'line').setOrigin(0.5);
        }
    }

    selectorDown(){
        if(gameState.onPause == true){
            if(this.selector.y != this.btnClose.y){
              this.selector.y = this.btnClose.y
              this.btnClose.setTexture('exitSelected')
              this.btnStart.setTexture('resumeEmpty')
            }
        }
    }

    selectorUp(){
        if(gameState.onPause == true){
            if(this.selector.y != this.btnStart.y){
                this.selector.y = this.btnStart.y
                this.btnStart.setTexture('resumeSelected')
                this.btnClose.setTexture('exitEmpty')
            }
        }
    }

    gameToggle(){
        if(gameState.onPause == true){
            if(this.selector.y == this.btnStart.y){
                this.resumeGame()
            }
            else if(this.selector.y == this.btnClose.y){
                this.exit()
            }
        }
    }

    resumeGame(){
        gameState.onPause = false
        gameState.onGame = true

        try{
            let gameResume = {
                action: 'gameResume',
                allGameSessionId: startGame.allGameSessionId,
                gameSessionId: startGame.gameSessionId,
                score: gameState.score,
                timeStamp : Date.now()
            }

            window?.parent.postMessage(gameResume, '*');
        }
        catch(er){
            let gameResumeError = {
                action: 'gameResumeError',
                allGameSessionId: startGame.allGameSessionId,
                gameSessionId: startGame.gameSessionId,
                score: gameState.score,
                timeStamp : Date.now()
            }

            indow?.parent.postMessage(gameResumeError, '*');
        }

        this.scene.resume(arcanoid)
        this.scene.stop(scenepause)
    }
    exit(){
        if(gameState.onPause){
            let closeGameSession = {
                action: 'closeGameSession',
                allGameSessionId : sessionID,
                timeStamp : Date.now()
            }
    
            window?.parent.postMessage(closeGameSession, '*');
        }
    }
}

var scenepause = new ScenePause()