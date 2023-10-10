class GameOver extends Phaser.Scene{
    constructor(){
        super({key: 'gameOver'})
    }

    create(){
        let gameOver = {
            action: 'gameOver',
            allGameSessionId : sessionID,
            gameSessionId : gameId,
            score : gameState.score,
            timeStamp : Date.now()
        }

        window?.parent.postMessage(gameOver, '*');

        gameState.isOver = true
        gameState.onGame = false
        this.gameOverBg = this.add.image(game.config.width / 2, game.config.height / 2, 'pauseBg').setOrigin(0.5)
        this.gameOverBg.setDisplaySize(game.config.width, game.config.height)

        this.gameOverTitle = this.add.image(game.config.width / 2, game.config.height / 2-260, 'gameOverTitle').setOrigin(0.5)
        this.selector = this.add.sprite(game.config.width / 2, game.config.height / 2+70, 'selector')
        this.selector.setOrigin(0.5)
        this.btnRestart = this.add.sprite(game.config.width / 2, game.config.height / 2+70, 'restartSelected')
        this.btnRestart.setOrigin(0.5)
        this.btnClose = this.add.sprite(this.btnRestart.x, this.btnRestart.y + 120, 'exitEmpty')
        this.btnClose.setOrigin(0.5)

        

        this.btnRestart.setInteractive()
        this.btnClose.setInteractive()

        
        document.addEventListener('keydown',(e)=>{
            if(e.keyCode == 8 || e.keyCode == 10009 || e.keyCode == 461 || e.keyCode == 166 || e.keyCode == 196){
                this.exit()
            }
        })
        

        this.btnRestart.on('pointerdown', this.startGame, this)
        this.btnClose.on('pointerdown', this.exit, this)

        this.input.keyboard.on('keydown-ENTER', this.gameToggle, this)

        this.saveScore();
        this.loadScore();
        this.versionText = this.add.text(game.config.width - 60, game.config.height - 40, `${game_version}`, { fontFamily:'Arial', fontStyle:'bold', fontSize: '30px', fill: '#fff' }).setOrigin(0.5);
        this.score = this.add.text(game.config.width/2-150, game.config.height - 100, `${gameState.score}`, { fontFamily:'Rubik-Medium', fontStyle:'bold', fontSize: '64px', fill: '#fff' }).setOrigin(0.5);
        this.scoreTitle = this.add.text (this.score.x, this.score.y - 75, "Счет", {
            fontFamily: 'Rubik-Regular',
            fontSize: 48,
            fontStyle: 'normal',
            color: '#D0DBD1',
        }).setOrigin(0.5);

        this.controlsInfo = this.add.image(260, 100, 'controlsInfo').setOrigin(0.5)
    }

    saveScore(){
        this.heighScore = gameState.score;
        this.oldScore = JSON.parse(localStorage.getItem('heighScore_arcnd'));
        this.heighScore > this.oldScore ? localStorage.setItem('heighScore_arcnd', JSON.stringify(this.heighScore)) : this.heighScore = this.oldScore;
        localStorage.setItem('lvl_arcnd', JSON.stringify(gameState.lvl))
    }

    loadScore(){
        if(localStorage.getItem('heighScore_arcnd')){
            this.heigScoreText = this.add.text(game.config.width / 2 + 150, game.config.height - 100,`${JSON.parse(localStorage.getItem('heighScore_arcnd'))}`, {
                fontFamily: 'Rubik-Medium',
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
        if(gameState.isOver==true){
            if(this.selector.y != this.btnClose.y){
              this.selector.y = this.btnClose.y
              this.btnClose.setTexture('exitSelected')
              this.btnRestart.setTexture('restartEmpty')
            }
        }
    }

    selectorUp(){
        if(gameState.isOver==true){
            if(this.selector.y != this.btnRestart.y){
                this.selector.y = this.btnRestart.y
                this.btnRestart.setTexture('restartSelected')
                this.btnClose.setTexture('exitEmpty')
            }
        }
    }

    gameToggle(){
        if(gameState.isOver == true){
            if(this.selector.y == this.btnRestart.y){
                this.startGame()
            }
            else if(this.selector.y == this.btnClose.y){
                window?.parent.postMessage('gameOver', '*')
                this.exit()
            }
        }
    }

    startGame(){
        gameState.isOver = false
        gameState.score = 0
        startGame.gameSessionId = uid();
        startGame.allGameSessionId = sessionID;
        window?.parent.postMessage(startGame, '*');
        this.scene.start(arcanoid)
    }
    exit(){
        if(gameState.isOver){
            let closeGameSession = {
                action: 'closeGameSession',
                allGameSessionId : sessionID,
                timeStamp : Date.now()
            }
    
            window?.parent.postMessage(closeGameSession, '*');
        }
    }
}

var gameOver = new GameOver()