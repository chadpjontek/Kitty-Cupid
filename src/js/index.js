import '../styles/game.css';
import kittyImg from '../images/kitty-blush.png';
import arrowImg from '../images/arrow.png';

// Create and load just the homepage
function component() {
  const container = document.createElement('div');
  const startButton = document.createElement('button');
  const title = document.createElement('h1');
  const titleInfo = document.createElement('p');
  const kitty = new Image();
  const arrow = new Image();

  kitty.src = kittyImg;
  arrow.src = arrowImg;
  title.innerHTML = 'Kitty Cupid';
  titleInfo.innerHTML = 'How many matches can you make?';
  startButton.innerHTML = 'Start!';
  kitty.alt = 'A cute cartoon kitty blushing';
  arrow.alt = 'Cupid\'s arrow';
  kitty.classList.add('kitty-img');
  arrow.classList.add('arrow-img');
  container.classList.add('container');
  title.classList.add('title');
  titleInfo.classList.add('title-info');
  startButton.classList.add('start-button');
  container.appendChild(title);
  container.appendChild(titleInfo);
  container.appendChild(kitty);
  container.appendChild(arrow);
  container.appendChild(startButton);

  // When start is clicked show a spinner until game loads then remove the home page
  startButton.onclick = () => {
    arrow.style.animation = 'spin 2s linear infinite';
    import(/* webpackChunkName: "game" */ './game').then(module => {
      const game = module.default;
      game();
      container.remove();
    });
  };
  return container;
}

document.body.appendChild(component());