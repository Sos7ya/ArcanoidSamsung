class NextLvl extends Phaser.Scene{
    constructor(){
        super({key:'nextLvl'});
    }
    create(){

        let levelUp = {
        action: 'levelUp',
        allGameSessionId : sessionID,
        gameSessionId : startGame.gameSessionId,
        level : gameState.lvl,
        score : gameState.score,
        timeStamp : Date.now()
        }
        window?.parent.postMessage(levelUp, parentOrigin);

        this.sceneBG = this.add.image(game.config.width/2, game.config.height/2, 'background-9').setOrigin(0.5);
        this.sceneBG.setDisplaySize(game.config.width, game.config.height);
        this.add.particles('blue', {
            x: { min: 0, max: game.config.width },
            scale: {min: 0.1, max: 0.6},
            rotate:{start: 0, end: 360},
            speed: 150,
            lifespan: 3200,
            gravityY: 400
        });

        this.add.particles('red', {
            x: { min: 0, max: game.config.width },
            scale: {min: 0.1, max: 0.6},
            rotate:{start: 0, end: 360},
            speed: 100,
            lifespan: 3200,
            gravityY: 400
        })

        this.add.particles('green', {
            x: { min: 0, max: game.config.width },
            scale: {min: 0.1, max: 0.6},
            rotate:{start: 0, end: 360},
            speed: 150,
            lifespan: 3200,
            gravityY: 400
        })

        this.add.particles('yellow', {
            x: { min: 0, max: game.config.width },
            scale: {min: 0.1, max: 0.6},
            rotate:{start: 0, end: 360},
            speed: 100,
            lifespan: 3200,
            gravityY: 400
        })

        this.add.particles('purple', {
            x: { min: 0, max: game.config.width },
            scale: {min: 0.1, max: 0.6},
            rotate:{start: 0, end: 360},
            speed: 150,
            lifespan: 3200,
            gravityY: 400
        })

        this.add.particles('orange', {
            x: { min: 0, max: game.config.width },
            scale: {min: 0.1, max: 0.6},
            rotate:{start: 0, end: 360},
            speed: 150,
            lifespan: 3200,
            gravityY: 400
        })

        this.versionText = this.add.text(game.config.width - 60, game.config.height - 40, `${game_version}`, { fontFamily:'Rubik-Medium', fontStyle:'bold', fontSize: '30px', fill: '#fff' }).setOrigin(0.5);

        this.winSound = this.sound.add('win', {loop: false, volume: 0.5});
        this.title = this.add.text(game.config.width/2, game.config.height/2, 'Уровень пройден!', {
            fontFamily: 'Arial',
            fontSize: 48,
            color: '#fff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        var startNextLvl = this.time.addEvent({
            delay: 3000,
            callback: this.startNext,
            callbackScope: this
        });

        this.winSound.play();
    }

    startNext(){
        this.scene.start(arcanoid);
        gameState.lvl+=1
    }
}

var nextLvl = new NextLvl();