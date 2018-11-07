let game;
let cookie;

document.addEventListener('DOMContentLoaded', function(event){
  let cookie = new Cookie();
  cookie.set("API_KEY", "super_secret_key", {
    expires: 3600,
  });
	game = new Game();
	game.run();
});

function connect(){
	game.run();
}

function disconnect(){
	game.stop();
}

function send(str){
	game.send(str);
}