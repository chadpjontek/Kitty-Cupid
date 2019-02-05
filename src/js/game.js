import Phaser from 'phaser';
import cupidImg from '../images/cupid.png';
import arrowImg from '../images/arrow.png';
import bgImg from '../images/ts01.png';
import kittyImg from '../images/kitty-normal.png';
import cryImg from '../images/kitty-cry.png';
import blushImg from '../images/kitty-blush.png';
import happyImg from '../images/kitty-happy.png';
import brokenHeartImg from '../images/brokenHeart.png';
import redHeartImg from '../images/redHeart.png';
import whiteHeartImg from '../images/whiteHeart.png';
import thoughtImg from '../images/thought.png';
import arrowMp3 from '../audio/arrow.mp3';
import clickMp3 from '../audio/click.mp3';
import cryMp3 from '../audio/cry.mp3';
import gameOverMp3 from '../audio/gameOver.mp3';
import levelUpMp3 from '../audio/levelUp.mp3';
import meowMp3 from '../audio/meow.mp3';
import pickUpMp3 from '../audio/pickUp.mp3';
import purrMp3 from '../audio/purr.mp3';

export default (deferredPrompt) => {

  // Variables used by module
  const textStyle = {
    fontSize: '64px',
    color: '#a00',
    fontFamily: 'Comic Sans MS, sans-serif, Helvetica, serif'
  };
  const scoreTextStyle = {
    fontSize: '64px',
    color: '#fff',
    fontFamily: 'Comic Sans MS, sans-serif, Helvetica, serif'
  };
  const STARTING_ARROW_COUNT = 20;
  let arrowSound;
  let clickSound;
  let crySound;
  let gameOverSound;
  let levelUpSound;
  let meowSound;
  let pickUpSound;
  let purrSound;
  let kittyGroup;
  let playerContainer;
  let arrowGroup;
  let playerImg;
  let scene;
  let goScene;
  let arrowsLeft = STARTING_ARROW_COUNT;
  let arrowText;
  let kittyArr = [];
  let currentKitty = 0;
  let nextKittySpawnTime = 0;
  let lastColor;
  let lastLikes;
  let lastArrowHit = null;
  let level = 1;
  let isGameOver = false;
  let matches = 0;
  let matchesText;
  let kittiesPerLevel = 4;
  let kittySpawnSpeed = 2000;
  let levelText;
  let kittiesOnScreen = 0;
  let arrowMessage;
  let endScoreText = null;

  // Classes used by module
  /**
   * A class that extends Phaser.Scene and wraps up the core logic for the game.
   */
  class MainScene extends Phaser.Scene {

    constructor() {
      super('MainScene');
    }
    preload() {
      this.load.image('cupid', cupidImg);
      this.load.image('bgImg', bgImg);
      this.load.image('kitty', kittyImg);
      this.load.image('cry', cryImg);
      this.load.image('blush', blushImg);
      this.load.image('happy', happyImg);
      this.load.image('arrow', arrowImg);
      this.load.image('thought', thoughtImg);
      this.load.image('redHeart', redHeartImg);
      this.load.image('whiteHeart', whiteHeartImg);
      this.load.image('brokenHeart', brokenHeartImg);
      this.load.audio('arrowSound', arrowMp3);
      this.load.audio('clickSound', clickMp3);
      this.load.audio('crySound', cryMp3);
      this.load.audio('gameOverSound', gameOverMp3);
      this.load.audio('levelUpSound', levelUpMp3);
      this.load.audio('meowSound', meowMp3);
      this.load.audio('pickUpSound', pickUpMp3);
      this.load.audio('purrSound', purrMp3);
    }

    create() {
      // store the main scene in a global variable for other functions outside this class.
      scene = this;
      // Add the sounds to the game
      arrowSound = this.sound.add('arrowSound');
      clickSound = this.sound.add('clickSound');
      crySound = this.sound.add('crySound');
      gameOverSound = this.sound.add('gameOverSound');
      levelUpSound = this.sound.add('levelUpSound');
      meowSound = this.sound.add('meowSound');
      pickUpSound = this.sound.add('pickUpSound');
      purrSound = this.sound.add('purrSound');
      // Create a group for the kitties and add physics to them
      kittyGroup = this.physics.add.group({
        classType: Kitty
      });
      // Add the background image
      this.add.image(0, 0, 'bgImg').setOrigin(0, 0);
      // Add the player to a physics enabled container and place in middle of game
      playerImg = this.add.image(0, 0, 'cupid');
      playerContainer = this.add.container(game.config.width / 2, game.config.height / 2, [playerImg]);
      this.physics.world.enable(playerContainer);
      playerContainer.body.setCircle(64, -64, -64);
      // Create event listener to rotate player on mouse move
      this.input.on('pointermove', function (pointer) {
        playerImg.rotation = (Phaser.Math.Angle.Between(playerContainer.x, playerContainer.y, pointer.x + this.cameras.main.scrollX, pointer.y + this.cameras.main.scrollY));
      }, this);
      // Make arrow pool
      arrowGroup = this.physics.add.group({
        classType: Arrow,
        maxSize: 1,
        runChildUpdate: true
      });
      // handle collision
      this.physics.add.overlap(kittyGroup, arrowGroup, handleCollision);
      // create random kitties and their perfect match by making the next kitty the color they like and have their match like their color
      createKitties();
      // Add text objects for arrows, score, and messages
      arrowText = scene.add.text(20, 20, `Arrows: ${arrowsLeft}`, textStyle);
      matchesText = scene.add.text(1050, 20, `Matches: ${matches}`, textStyle);
      arrowMessage = scene.add.text(525, 20, '+ 10 arrows', scoreTextStyle).setVisible(false);
      // Handle pointer down (aka fire arrows)
      this.input.on('pointerdown', function (pointer) {
        // first rotate the player as a mobile touch event might not give the current correct angle desired
        playerImg.rotation = (Phaser.Math.Angle.Between(playerContainer.x, playerContainer.y, pointer.x + this.cameras.main.scrollX, pointer.y + this.cameras.main.scrollY));
        if (!isGameOver) {
          if (arrowGroup) {
            // get an arrow from the arrow pool if it is available
            let arrow = arrowGroup.get();
            if (arrow) {
              // lower the player's arrow count and update text
              arrowsLeft--;
              arrowText.setText(`Arrows: ${arrowsLeft}`);
              if (arrowsLeft < 0) {
                // the game is over when the arrows are gone but doesn't immediately trigger the end game function
                isGameOver = true;
              }
              // game will error if attempting to play sounds that have not been downloaded. This is a handler for 'offline' PWA usage.
              if (arrowSound.audioBuffer !== undefined) {
                arrowSound.play();
              }
              // Now actually call the fire method of the Arrow class passing in player coordinates
              arrow.fire(playerContainer.x, playerContainer.y);
            }
          }
        }
      }, this);
    }

    update(time) {
      // Spawn kitties every 2 seconds if there is one to spawn and not more than 20 on screen
      if (!isGameOver && time > nextKittySpawnTime && currentKitty < kittyArr.length && kittiesOnScreen < 20) {
        let kitty = kittyArr[currentKitty];
        kittyGroup.add(kittyArr[currentKitty], true);
        if (kitty) {
          kitty.body.setCircle(64);
          kitty.startFollow({
            duration: kitty.speed,
            repeat: -1
          });
          currentKitty += 1;
          kittiesOnScreen += 1;
          nextKittySpawnTime = time + kittySpawnSpeed - (level * 100);
        }
      }
    }
  }

  /**
 * @classdesc
 * A class that creates a Kitty
 * @class Kitty
 * @extends Phaser.GameObjects.PathFollower
 * @constructor
 * @param {Phaser.Scene} scene - The Scene to which this Kitty belongs.
 * @param {Phaser.Curves.Path} path - The Path this Kitty is following. It can only follow one Path at a time.
 * @param {number} x - The horizontal position of this Game Object in the world.
 * @param {number} y - The vertical position of this Game Object in the world.
 * @param {number} color - The color of this kitty.
 * @param {number} likes - The color this kitty likes.
 * @param {number} id - The id of this kitty.
 * @param {number} speed - The speed of this kitty.
 */
  class Kitty extends Phaser.GameObjects.PathFollower {
    constructor(scene, path, x, y, color, likes, id, speed) {
      super(scene, path, x, y, 'kitty');
      this.id = id;
      this.likes = likes;
      this.color = color;
      this.setTint(color);
      this.speed = speed;
    }
  }

  /**
   * @classdesc
   * A class that creates an Arrow
   * @class Arrow
   * @extends Phaser.GameObjects.Image
   */
  class Arrow extends Phaser.GameObjects.Image {
    constructor() {
      super(scene, 0, 0, 'arrow');
      this.speed = Phaser.Math.GetSpeed(750, 1);
    }
    fire(x, y) {
      this.body.setSize(16, 16);
      this.rotation = playerImg.rotation;
      this.setPosition(x, y);
      this.setActive(true);
      this.setVisible(true);
      // End game if no more arrows left
      if (isGameOver) {
        this.destroy();
        scene.input.stopPropagation();
        scene.cameras.main.fade(1000, 0, 0, 0);
        scene.cameras.main.once('camerafadeoutcomplete', () => {
          gameOver();
        });
      }
    }
    update(time, delta) {
      // Change the position of this arrow based on vector/time
      this.x += this.speed * delta * Math.cos(this.rotation);
      this.y += this.speed * delta * Math.sin(this.rotation);
      // deactivate arrow once out of bounds so it can be resused by arrow pool
      if (this.y < -50 || this.y > game.config.height + 50 || this.x < -50 || this.x > game.config.width + 50) {
        this.setActive(false);
        this.setVisible(false);
      }
    }
  }

  /**
   * @classdesc
   * A class that extends Phaser.Scene and displays the end of game text and buttons.
   * @class GameOverScene
   * @extends Phaser.Scene
   */
  class GameOverScene extends Phaser.Scene {
    constructor() {
      super('GameOverScene');
    }
    create() {
      // Add the game over scene to a global variable to be used outside this class
      goScene = this;
      // Add the game over text, images, and buttons to scene
      this.add.text(550, 100, 'Game Over', textStyle);
      endScoreText = this.add.text(390, 250, `You made ${matches} matches!`, scoreTextStyle);
      let redHeart = this.add.image(360, 500, 'redHeart');
      let whiteHeart = this.add.image(1100, 500, 'whiteHeart');
      this.add.text(190, 600, 'try again?', scoreTextStyle);
      this.add.text(900, 600, 'Share score!', textStyle);
      let r1 = new Phaser.Geom.Rectangle(-150, -35, 380, 170);
      let r2 = new Phaser.Geom.Rectangle(-180, -35, 400, 170);
      redHeart.setInteractive(r1, Phaser.Geom.Rectangle.Contains);
      redHeart.on('pointerup', restartGame);
      whiteHeart.setInteractive(r2, Phaser.Geom.Rectangle.Contains);
      whiteHeart.on('pointerup', shareScore);
    }
  }

  // Helper functions used by module
  /**
   * A function that creates the kitties for the current level
   */
  function createKitties() {
    kittyArr = [];
    currentKitty = 0;
    for (let i = 0; i < kittiesPerLevel * level; i++) {
      let kitty;
      let id = kittyArr.length;
      // get the starting location, path, and colors for the kitties
      let { x, y, path } = makePath(scene);
      if (i % 2 == 0) {
        lastColor = getKittyColor(level);
        lastLikes = getKittyColor(level);
        kitty = new Kitty(scene, path, x, y, lastColor.color, lastLikes.color, id, lastColor.speed);
        kittyArr.push(kitty);
        // for every other kitty, make it a potential match of the first one (i.e. they like each other)
      } else {
        kitty = new Kitty(scene, path, x, y, lastLikes.color, lastColor.color, id, lastLikes.speed);
        kittyArr.push(kitty);
      }
    }
    // To increase difficulty, shuffle the array to make them spawn in a random order
    shuffle(kittyArr);
  }

  /**
   * A function that handles the collision event between an arrow and a kitty
   * @param {Kitty} kitty - A Kitty class instance
   * @param {Arrow} arrow - An Arrow class instance
   */
  function handleCollision(kitty, arrow) {
    arrow.destroy();
    // Check the target of the last arrow fired
    if (lastArrowHit !== null && kittyGroup.contains(kittyArr[lastArrowHit])) {
      // Display who the kitty likes again if the last arrow struck was him
      if (kitty.id === kittyArr[lastArrowHit].id) {
        let thoughtCloud = scene.add.image(kitty.x + 70, kitty.y - 90, 'thought');
        let likedKitty = scene.add.image(kitty.x + 70, kitty.y - 110, 'happy').setScale(.5).setTint(kitty.likes);
        kitty.setTexture('blush');
        if (meowSound.audioBuffer !== undefined) {
          meowSound.play();
        }
        kitty.pauseFollow();
        setTimeout(() => {
          kitty.resumeFollow();
          thoughtCloud.destroy();
          likedKitty.destroy();
        }, 2000);
        // It's a match!
      } else if (kittyArr[lastArrowHit].color === kitty.likes && kittyArr[lastArrowHit].likes === kitty.color) {
        if (purrSound.audioBuffer !== undefined) {
          purrSound.play();
        }
        // make heart animation
        const points = [
          50, 300, 179, 449, 394, 498, 593, 455,
          701, 338, 692, 190, 603, 76, 423, 41,
          272, 78, 181, 186, 230, 328, 416, 395,
          565, 327, 550, 202, 467, 149, 355, 164,
          343, 254, 428, 303
        ];
        const points2 = [
          -50, 300, -179, 449, -394, 498, -593, 455,
          -701, 338, -692, 190, -603, 76, -423, 41,
          -272, 78, -181, 186, -230, 328, -416, 395,
          -565, 327, -550, 202, -467, 149, -355, 164,
          -343, 254, -428, 303
        ];
        const curve = new Phaser.Curves.Spline(points);
        const curve2 = new Phaser.Curves.Spline(points2);
        for (let i = 0; i < 5; i++) {
          const follower = scene.add.follower(curve, 150, 320 + (30 * i), 'redHeart');
          const follower2 = scene.add.follower(curve2, 1290, 320 + (30 * i), 'whiteHeart');

          follower.startFollow({
            duration: 2000,
            ease: 'Sine.easeInOut',
            _delay: i * 200,
            delay: i * 100,
          });
          follower2.startFollow({
            duration: 2000,
            ease: 'Sine.easeInOut',
            _delay: i * 200,
            delay: i * 100,
          });
          setTimeout(() => {
            follower.destroy();
            follower2.destroy();
          }, 2500);
        }
        // bring kitties to middle
        kitty.stopFollow();
        scene.tweens.add({
          targets: kitty,
          x: game.config.width / 2 + 64,
          y: game.config.height / 2,
          duration: 2500,
          ease: 'Cubic'
        });
        kittyArr[lastArrowHit].stopFollow();
        scene.tweens.add({
          targets: kittyArr[lastArrowHit],
          x: game.config.width / 2 - 64,
          y: game.config.height / 2,
          duration: 2500,
          ease: 'Cubic'
        });
        kitty.setTexture('blush');
        kittyArr[lastArrowHit].setTexture('happy');
        // clean up objects and add 1 to score
        kittiesOnScreen = kittiesOnScreen - 2;
        kitty.body.setEnable(false);
        kittyArr[lastArrowHit].body.setEnable(false);
        let lastId = lastArrowHit;
        setTimeout(() => {
          if (kittyArr[lastId] !== null && kittyArr[lastId] !== undefined) {
            kittyArr[lastId].removeAllListeners();
            kittyArr[lastId].destroy();
            kittyArr.splice(lastId, 1, null);
            matches++;
            matchesText.setText(`Matches: ${matches}`);
            // if this is the 5th match give bonus arrows
            if (matches % 4 === 0) {
              if (pickUpSound.audioBuffer !== undefined) {
                pickUpSound.play();
              }
              arrowsLeft += 10;
              arrowText.setText(`Arrows: ${arrowsLeft}`);
              arrowMessage.setVisible(true);
              setTimeout(() => {
                arrowMessage.setVisible(false);
              }, 2000);
            }
          }
          let id = kittyArr.indexOf(kitty);
          kitty.removeAllListeners();
          kitty.destroy();
          kittyArr.splice(id, 1, null);
          // If this is the last kitty on the level move to next one
          let isArrAllNull = kittyArr.every(checkIfNull);
          if (isArrAllNull) {
            if (levelUpSound.audioBuffer !== undefined) {
              levelUpSound.play();
            }
            kittiesOnScreen = 0;
            level++;
            levelText = scene.add.text(590, 205, `Level: ${level}`, scoreTextStyle);
            setTimeout(() => {
              levelText.setVisible(false);
            }, 2000);
            createKitties();
          }
        }, 2500);
        lastArrowHit = null;
        // If these kitties are not a match
      } else {
        if (crySound.audioBuffer !== undefined) {
          crySound.play();
        }
        let thoughtCloud = scene.add.image(kitty.x + 70, kitty.y - 90, 'thought');
        let brokenHeart = scene.add.image(kittyArr[lastArrowHit].x, kittyArr[lastArrowHit].y - 80, 'brokenHeart');
        let likedKitty = scene.add.image(kitty.x + 70, kitty.y - 110, 'happy').setScale(.5).setTint(kitty.likes);
        kittyArr[lastArrowHit].setTexture('cry');
        kitty.pauseFollow();
        kittyArr[lastArrowHit].pauseFollow();
        let lastId = lastArrowHit;
        setTimeout(() => {
          likedKitty.destroy();
          thoughtCloud.destroy();
          brokenHeart.destroy();
          kitty.resumeFollow();
          kittyArr[lastId].resumeFollow();
        }, 2000);
        lastArrowHit = kittyArr.indexOf(kitty);
      }
      // If this is the first kitty hit by an arrow
    } else {
      if (meowSound.audioBuffer !== undefined) {
        meowSound.play();
      }
      let thoughtCloud = scene.add.image(kitty.x + 70, kitty.y - 90, 'thought');
      let likedKitty = scene.add.image(kitty.x + 70, kitty.y - 110, 'happy').setScale(.5).setTint(kitty.likes);
      kitty.setTexture('blush');
      kitty.pauseFollow();
      setTimeout(() => {
        likedKitty.destroy();
        kitty.resumeFollow();
        thoughtCloud.destroy();
      }, 2000);
      lastArrowHit = kittyArr.indexOf(kitty);
    }
  }

  /**
   * A function to check if a value is null
   * @param {*} value - any value
   */
  function checkIfNull(value) {
    return value === null;
  }

  /**
   * A function that runs at game end reseting variables and switching scenes
   */
  function gameOver() {
    kittyGroup = null;
    arrowGroup = null;
    arrowsLeft = STARTING_ARROW_COUNT;
    arrowText = null;
    kittyArr = [];
    currentKitty = 0;
    nextKittySpawnTime = 0;
    lastColor = null;
    lastLikes = null;
    lastArrowHit = null;
    level = 1;
    isGameOver = false;
    kittiesOnScreen = 0;
    scene.scene.restart();
    if (gameOverSound.audioBuffer !== undefined) {
      gameOverSound.play();
    }
    if (endScoreText !== null) {
      endScoreText.setText(`You made ${matches} matches!`);
    }
    scene.scene.switch('GameOverScene');
  }

  /**
   * A function to start a new game
   */
  function restartGame() {
    if (deferredPrompt !== null) {
      // show the modal to inform user they can add the game to home screen
      console.log(deferredPrompt); // eslint-disable-line no-console
      let modalContainer = document.getElementById('modalContainer');
      let yesBtn = document.getElementById('yesBtn');
      let noBtn = document.getElementById('noBtn');
      modalContainer.style.display = 'block';
      yesBtn.addEventListener('click', () => {
        // hide the modal after selection
        modalContainer.style.display = 'none';
        // Show the prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the A2HS prompt'); // eslint-disable-line no-console
          } else {
            console.log('User dismissed the A2HS prompt'); // eslint-disable-line no-console
          }
          if (clickSound.audioBuffer !== undefined) {
            clickSound.play();
          }
          deferredPrompt = null;
          switchToMainScene();
        });
      });
      noBtn.addEventListener('click', () => {
        // hide the modal after selection
        modalContainer.style.display = 'none';
        if (clickSound.audioBuffer !== undefined) {
          clickSound.play();
        }
        deferredPrompt = null;
        switchToMainScene();
      });
    } else {
      switchToMainScene();
    }
  }

  /**
   * A function reset matches and switch to main scene
   */
  function switchToMainScene() {
    matches = 0;
    matchesText.setText(`Matches: ${matches}`);
    goScene.scene.switch('MainScene');
  }

  /**
   * A function to open a Facebook share diaolog
   */
  function shareScore() {
    if (clickSound.audioBuffer !== undefined) {
      clickSound.play();
    }
    FB.ui({ // eslint-disable-line no-undef
      method: 'share',
      mobile_iframe: true,
      href: 'https://fb.me/KittyCupid',
      hashtag: '#kittycupid'
    });
  }

  /**
  * A function that creates and returns a random path and starting coordinates from a predefined list.
  * @param {Phaser.Scene} scene - The scene to which this path should be made on.
  */
  function makePath(scene) {
    // return a random path with starting location
    const randNum = Math.floor(Math.random() * 8);
    const topLeftPath = {
      x: 145,
      y: -100,
      path: scene.add.path(145, -100)
        .lineTo(145, 625)
        .lineTo(1295, 625)
        .lineTo(1295, 145)
        .lineTo(-100, 145)
    };
    const topRightPath = {
      x: 1295,
      y: -100,
      path: scene.add.path(1295, -100)
        .lineTo(1295, 625)
        .lineTo(145, 625)
        .lineTo(145, 145)
        .lineTo(1540, 145)
    };
    const leftTopPath = {
      x: -100,
      y: 145,
      path: scene.add.path(-100, 145)
        .lineTo(1295, 145)
        .lineTo(1295, 625)
        .lineTo(145, 625)
        .lineTo(145, -100)
    };
    const rightTopPath = {
      x: 1540,
      y: 145,
      path: scene.add.path(1540, 145)
        .lineTo(145, 145)
        .lineTo(145, 625)
        .lineTo(1295, 625)
        .lineTo(1295, -100)
    };
    const leftBottomPath = {
      x: -100,
      y: 625,
      path: scene.add.path(-100, 625)
        .lineTo(1295, 625)
        .lineTo(1295, 145)
        .lineTo(145, 145)
        .lineTo(145, 870)
    };
    const rightBottomPath = {
      x: 1540,
      y: 625,
      path: scene.add.path(1540, 625)
        .lineTo(145, 625)
        .lineTo(145, 145)
        .lineTo(1295, 145)
        .lineTo(1295, 870)
    };
    const bottomLeftPath = {
      x: 145,
      y: 870,
      path: scene.add.path(145, 870)
        .lineTo(145, 145)
        .lineTo(1295, 145)
        .lineTo(1295, 625)
        .lineTo(-100, 625)
    };
    const bottomRightPath = {
      x: 1295,
      y: 870,
      path: scene.add.path(1295, 870)
        .lineTo(1295, 145)
        .lineTo(145, 145)
        .lineTo(145, 625)
        .lineTo(1540, 625)
    };
    const paths = [
      topLeftPath,
      topRightPath,
      leftTopPath,
      rightTopPath,
      leftBottomPath,
      rightBottomPath,
      bottomLeftPath,
      bottomRightPath
    ];
    return paths[randNum];
  }

  /**
   * A function that returns a random color code not exceeding the number of colors and speed that goes with that color
   */
  function getKittyColor(level) {
    let kittyColors = [
      0xdddddd,//light gray
      0x444444,//dark gray
      0xff0000,//red
      0x00ff00,//green
      0x0000ff,//blue
      0xffff00,//yellow
      0xff00ff,//magenta
      0x00ffff,//cyan
      0xFF7F00,//orange
      0x00FF7F,//spring green
      0x7F00FF,//violet
      0xFF89CC,//princess perfume
      0x99CCFF,//baby blue eyes
      0xFF007F,//rose
    ];
    let randNum = Math.floor(Math.random() * (4 + level));
    if (randNum > kittyColors.length - 1) {
      return { color: kittyColors[kittyColors.length - 1], speed: 60000 - ((kittyColors.length - 1) * 3000) };
    }
    return { color: kittyColors[randNum], speed: 60000 - (randNum * 3000) };
  }

  /**
   * Shuffle the order of the kitty array
   * @param {array} array - The kitty array to be shuffled
   */
  function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  // The configuration object for the game.
  const config = {
    type: Phaser.AUTO,
    width: 1440,
    height: 768,
    backgroundColor: '#010101',
    parent: 'game-canvas-container',
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
        gravity: {
          y: 0
        }
      }
    },
    scene: [MainScene, GameOverScene],
    callbacks: {
      postBoot: function (game) {
        game.canvas.style.width = '100%';
        game.canvas.style.height = '100%';
      }
    }
  };
  // Create the game using the config
  const game = new Phaser.Game(config);
};

// // If servive workers are supported, register ours.
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker
//     .register('./sw.js')
//     .then(function () { console.log('Service Worker Registered'); }); // eslint-disable-line no-console
//   // create a modal to display when install event is triggered
//   bodyElement = document.getElementsByTagName('BODY')[0];
//   modalContainer = document.createElement('div');
//   athsModal = document.createElement('div');
//   modalInfo = document.createElement('p');
//   yesBtn = document.createElement('button');
//   noBtn = document.createElement('button');
//   modalContainer.classList.add('modalContainer');
//   athsModal.classList.add('athsModal');
//   modalInfo.classList.add('modalInfo');
//   yesBtn.classList.add('yesBtn');
//   noBtn.classList.add('noBtn');
//   yesBtn.innerHTML = 'Yes';
//   noBtn.innerHTML = 'No';
//   modalInfo.innerHTML = 'Would you like to add this game to your Home Screen for easy access? You will also be able to play it without an internet connection!';
//   athsModal.appendChild(modalInfo);
//   athsModal.appendChild(yesBtn);
//   athsModal.appendChild(noBtn);
//   modalContainer.appendChild(athsModal);
//   bodyElement.appendChild(modalContainer);
// }

// // Variables to hold "add to home screen prompt" if/when it gets triggered
// let deferredPrompt = null;
// let bodyElement;
// let modalContainer;
// let athsModal;
// let modalInfo;
// let yesBtn;
// let noBtn;

// // add a listener for the beforeinstallprompt
// window.addEventListener('beforeinstallprompt', (e) => {
//   console.log('prompting'); // eslint-disable-line no-console
//   // Prevent Chrome 67 and earlier from automatically showing the prompt
//   e.preventDefault();
//   // Stash the event so it can be triggered later.
//   deferredPrompt = e;
// });