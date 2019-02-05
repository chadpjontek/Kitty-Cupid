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
      game(deferredPrompt);
      container.remove();
    });
  };
  return container;
}

document.body.appendChild(component());

// If servive workers are supported, register ours.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./sw.js')
    .then(function () { console.log('Service Worker Registered'); }); // eslint-disable-line no-console
  // create a modal to display when install event is triggered
  bodyElement = document.getElementsByTagName('BODY')[0];
  modalContainer = document.createElement('div');
  athsModal = document.createElement('div');
  modalInfo = document.createElement('p');
  yesBtn = document.createElement('button');
  noBtn = document.createElement('button');
  modalContainer.id = 'modalContainer';
  yesBtn.id = 'yesBtn';
  noBtn.id = 'noBtn';
  modalContainer.classList.add('modalContainer');
  athsModal.classList.add('athsModal');
  modalInfo.classList.add('modalInfo');
  yesBtn.classList.add('yesBtn');
  noBtn.classList.add('noBtn');
  yesBtn.innerHTML = 'Yes';
  noBtn.innerHTML = 'No';
  modalInfo.innerHTML = 'Would you like to add this game to your Home Screen for easy access? You will also be able to play it without an internet connection!';
  athsModal.appendChild(modalInfo);
  athsModal.appendChild(yesBtn);
  athsModal.appendChild(noBtn);
  modalContainer.appendChild(athsModal);
  bodyElement.appendChild(modalContainer);
}

// Variables to hold "add to home screen prompt" if/when it gets triggered
let deferredPrompt = null;
let bodyElement;
let modalContainer;
let athsModal;
let modalInfo;
let yesBtn;
let noBtn;

// add a listener for the beforeinstallprompt
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('prompting'); // eslint-disable-line no-console
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
});