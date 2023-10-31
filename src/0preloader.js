class Preloader extends Phaser.Scene{
    constructor(){
        super({key:'preloader'})
    }
    preload(){
        try{
            let startDownloading = {
                action: 'startDownloading',
                allGameSessionId: sessionID,
                timeStamp: Date.now()
            }
            window?.parent.postMessage(startDownloading, parentOrigin);

        this.loadText = this.add.text(game.config.width / 2, game.config.height / 2, "Загрузка...", {
            fontFamily: 'Rubik-Medium',
            fontSize: 64,
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5)

        this.loadText2 = this.add.text(game.config.width / 2, game.config.height / 2, "Загрузка...", {
            fontFamily: 'Rubik-Regular',
            fontSize: 64,
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).alpha = 0

        this.loadText3 = this.add.text(game.config.width / 2, game.config.height / 2, "Загрузка...", {
            fontFamily: 'RubikOne-Regular',
            fontSize: 64,
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).alpha = 0

        this.loadText4 = this.add.text(game.config.width / 2, game.config.height / 2, "Загрузка...", {
            fontFamily: 'Rubik-SemiBold',
            fontSize: 64,
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'center'
        }).alpha = 0
        this.load.image('line', 'assets/line.png');
        this.load.atlas('assets', 'assets/breakout.png', 'assets/breakout.json');
        this.load.atlas('blocks', 'assets/blocks.png', 'assets/blocks.json');
        this.load.image('button', 'assets/button.png');
        this.load.image('selector', 'assets/selector.png');
        this.load.image('laser', 'assets/sprLaserPlayer.png');
        this.load.image('bonusLaser', 'assets/bonusLaser.png');
        this.load.image('bonusBalls', 'assets/bonusBalls.png');
        this.load.image('bonusWide', 'assets/bonusWide.png');
        this.load.image('paddle', 'assets/paddle.png');
        this.load.image('ball', 'assets/ball.png');
        this.load.image('background', 'assets/gameBg.png');
        this.load.image('info', 'assets/info.png');
        this.load.image('paddle_shoot', 'assets/paddle_shoot.png');

        this.load.image('background-9', 'assets/gameBg_9.png');
        this.load.image('background_1', 'assets/gameBg_1.png');
        this.load.image('background_2', 'assets/gameBg_2.png');
        this.load.image('background_3', 'assets/gameBg_3.png');
        this.load.image('background_4', 'assets/gameBg_4.png');
        this.load.image('background_5', 'assets/gameBg_5.png');
        this.load.image('background_6', 'assets/gameBg_6.png');

        this.load.image('broken_purple', 'assets/broken_purple.png');
        this.load.image('broken_red', 'assets/broken_red.png');

        this.load.image('mainBg', 'assets/mainBg.png');

        this.load.image('exitEmpty', 'assets/exitEmpty.png');
        this.load.image('exitSelected', 'assets/exitSelected.png');
        this.load.image('startSelected', 'assets/startSelected.png');
        this.load.image('startEmpty', 'assets/startEmpty.png');

        this.load.image('restartEmpty', 'assets/restartEmpty.png');
        this.load.image('restartSelected', 'assets/restartSelected.png');
        this.load.image('resumeEmpty', 'assets/resumeEmpty.png');
        this.load.image('resumeSelected', 'assets/resumeSelected.png');

        this.load.image('pauseBg', 'assets/pauseBg.png');
        this.load.image('pauseTitle', 'assets/pauseTitle.png');
        this.load.image('gameOverTitle', 'assets/gameOverTitle.png');
        this.load.image('line', 'assets/line.png');

        this.load.image('red', 'assets/particles/red.png');
        this.load.image('green', 'assets/particles/green.png');
        this.load.image('blue', 'assets/particles/blue.png');
        this.load.image('yellow', 'assets/particles/yellow.png');
        this.load.image('purple', 'assets/particles/purple.png');
        this.load.image('orange', 'assets/particles/orange.png');
        this.load.image('controlsInfo', 'assets/controlsInfo.png');
        this.load.image('ageInfo', 'assets/ageInfo.png');

        this.load.audio('bgMusick', 'assets/sounds/bgMusick.mp3');
        // this.load.audio('click', 'assets/sounds/click.mp3');
        this.load.audio('pickBonus', 'assets/sounds/bonus.mp3');
        this.load.audio('brickHit', 'assets/sounds/brickHit.mp3');
        this.load.audio('paddleHit', 'assets/sounds/paddleHit.mp3');
        this.load.audio('lose', 'assets/sounds/lose.mp3');
        this.load.audio('win', 'assets/sounds/win.mp3');
        this.load.audio('lost', 'assets/sounds/lost.mp3');
    }
    catch(er){
        let startDownloadingError = {
            action: 'startDownloadingError',
            allGameSessionId: sessionID,
            timeStamp: Date.now()
        }
        window?.parent.postMessage(startDownloadingError, parentOrigin);
    }
    }
    create(){
        try{
            let finishDownload = {
                action: 'finishDownload',
                allGameSessionId: sessionID,
                timeStamp: Date.now()
            }
            window?.parent.postMessage(finishDownload, parentOrigin)
            this.scene.start('mainmenu')

        }
        catch(er){
            let downloadError = {
                action: 'downloadError',
                allGameSessionId: sessionID,
                timeStamp: Date.now()
            }
            window?.parent.postMessage(downloadError, parentOrigin)
        }
    }
}

var preloader = new Preloader()