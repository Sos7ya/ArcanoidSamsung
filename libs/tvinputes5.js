//console.log = function(message) {
  //document.getElementById('divlog').innerHTML += message + ' ';
//};
//console.warn = console.log;
window.addEventListener('load', function() {

  SpatialNavigation.init();
  SpatialNavigation.add({
    selector: '.focusable'
  });

  if (typeof AndroidBridge !== 'undefined') {
    initializeAndroidTVInput();
}
 
  // All valid events.
  var validEvents = [
      'sn:willmove',
      'sn:enter-down',
      'sn:enter-up',
    ];

    var eventHandler = function(evt) {
      if(evt.type == 'sn:enter-down'){
        scenepause.gameToggle()
        mainmenu.gameToggle()
        arcanoid.dropBall()
        gameOver.gameToggle()
      }
      //document.getElementById('divlog').innerHTML += evt.detail.direction + '\n';
      switch(evt.detail?.direction){
        case 'up':
          mainmenu.selectorUp()
          scenepause.selectorUp()
          gameOver.selectorUp()
          break;
          case 'down':
          mainmenu.selectorDown()
          scenepause.selectorDown()
          gameOver.selectorDown()
          break;
          case 'left':
            arcanoid.goLeft()
          break;
          case 'right':
            arcanoid.goRight()
          break;
      }
     
    };

    validEvents.forEach(function(type) {
      window.addEventListener(type, eventHandler);
    });
  
  SpatialNavigation.makeFocusable();
  SpatialNavigation.focus();
});

function initializeAndroidTVInput(){
AndroidBridge.onKeyEvent(function(event) {

if (event.isTVKeyEvent) {
    var keyCode = event.keyCode;
    switch (keyCode) {
        case AndroidBridge.KEYCODE_DPAD_CENTER:
            scenepause.gameToggle()
            mainmenu.gameToggle()
            arcanoid.dropBall()
            gameOver.gameToggle()
            break;
        case AndroidBridge.KEYCODE_DPAD_UP:
            scenepause.selectorUp()
            mainmenu.selectorUp()
            gameOver.selectorUp()
            break;
        case AndroidBridge.KEYCODE_DPAD_DOWN:
            scenepause.selectorDown()
            mainmenu.selectorDown()
            gameOver.selectorDown()
            break;
        case AndroidBridge.KEYCODE_DPAD_LEFT:
            arcanoid.goLeft()
            break;
        case AndroidBridge.KEYCODE_DPAD_RIGHT:
            arcanoid.goRight()
            break;
        case AndroidBridge.KEYCODE_BACK:
            arcanoid.pause()
            break;
        default:
            break;
    }
}
});
}