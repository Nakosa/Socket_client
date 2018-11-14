let game;


document.addEventListener('DOMContentLoaded', function(event){
  Cookie.set("X-Authorization", '3JUB4FK2IZMKVK1S1J0GPW7HV7NXRKHS8XQXHNGRAGXFUK1BOIL6QZERFT1TT8WI3JUB4FK2IZMKVK1S1J0GPW7HV7NXRKHS8XQXHNGRAGXFUK1BOIL6QZERFT1TT8WI', {
    expires: 2592000,
    path: '/',
  });
	game = new Game();
	game.run();
	//game.network_testing(100, 1024);
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