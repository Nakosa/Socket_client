class Game{

	constructor(){
		this.error = false;
		this.is_run = true;
		if(!this.__is_parent()){
			return;
		}
	}

	run(){
		console.clear();
		this.is_run = true;
		this.__connect_to_server();
		if(!this.__is_connect()){
			return;
		}
		this.__create_shell();
	}

	stop(){
		this.is_run = false;
		this.__disconnect_from_server();
		this.__clear_shell();
	}

	send(msg = ''){
		if(this.is_run && this.socket && this.socket.connected && msg != ''){
			this.socket.send(msg);
		}
	}

	__connect_to_server(){
		if(!this.is_run || this.__is_connect()){
			return;
		}
		this.socket = new SocketConnection('localhost', 5554, this);
		this.socket.connect();
	}

	__disconnect_from_server(){
		if(this.socket){
			this.socket.disconnect();
		}
		this.socket = null;	
	}


	__is_parent(){
		this.parent = document.getElementById('main_game');
		if(!this.parent){
			this.__set_error(' ');
			return false;
		}
		return true;
	}
	
	__is_connect(){
		return this.socket ? (this.socket.connected ? true : false) : false;
	}

	__set_error(_error_msg = ''){
		if(_error_msg === ''){
			this.error = false;
		}else{
			this.error = true;
			this.error_msg = _error_msg
		}
	}

	__create_shell(){
		console.log(this.parent);
	}

	__clear_shell(){

	}

	receive_data(data){
		console.log(data);
	}





	debug(){
		console.log(this);
	}

	network_testing(timeout = 1000, len = 512){
		let timeout_delta = Math.ceil(timeout * 0.25);
		let text = this.random(len);
		let THIS = this;
		
		setInterval(function(){
			THIS.send(text);
		}, THIS.getRandomInt(timeout - timeout_delta, timeout + timeout_delta));
	}

	random(len = 8, s = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"){
		return Array(len).join().split(',').map(function() { return s.charAt(Math.floor(Math.random() * s.length)); }).join('');
	}

	getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
	}
}



class SocketConnection{

	constructor(_host, _port, _parent){
		if(!_host || !_port){
			this.__set_error(' ');
			return;
		}

		if(!this.__is_supported()){
			this.__set_error(' ');
			return;
		}

		this.parent = _parent;

		this.message_box = document.getElementById('connection');
		this.states = new SocketConnectionState();
		this.state = this.states.COMMON;
		this.message_type = new SocketMessagesType();

		this.host = 'ws://' + _host + ':' + _port + '/';
		this.socket = null;
		this.connected = false;
		this.timeoutid;

		this.failed_attempts = 0;
		this.failed_attempts_brake_medium = 5;
		this.failed_attempts_brake_long = this.failed_attempts_brake_medium + 5;
		this.error_reconnect_timeout_default = 5000;
		this.error_reconnect_timeout_medium = 30000;
		this.error_reconnect_timeout_long = 60000;
		this.reboot_reconnect_timeout = 60000;
		this.error_reconnect_timeout = this.error_reconnect_timeout_default;
		

		this.__hide_connection_box();
	}

	connect(){
		if(this.connected){
			return;
		}

		this.__show_connection_try();
		this.socket = new WebSocket(this.host);
		
		let THIS = this;

		this.socket.onopen = function() {
			THIS.failed_attempts = 0;
			THIS.error_reconnect_timeout = THIS.error_reconnect_timeout_default;
			THIS.__validate_connetion();
			THIS.connected = true;
			THIS.__show_connection_good();
		};

		this.socket.onclose = function(event){
			console.log(event);

			THIS.connected = false;
			if(!event.wasClean){
				THIS.__reconnect();
			}else{
				THIS.__show_connection_close();
			}
		}

		this.socket.onmessage = function(event) {
			console.log(event);

			THIS.parent.receive_data(event.data);
		};

		this.socket.onerror = function(error) {
			console.log(error);

			switch(THIS.failed_attempts){
				case THIS.failed_attempts_brake_medium:
					THIS.error_reconnect_timeout = THIS.error_reconnect_timeout_medium;
					break;
				case THIS.failed_attempts_brake_long:
					THIS.error_reconnect_timeout = THIS.error_reconnect_timeout_long;
					break;
			}
			THIS.failed_attempts++;
			THIS.__show_connection_error(error);
		};
	}

	disconnect(){
		clearTimeout(this.timeoutid);
		this.socket.close();
		this.socket = null;
		this.__show_connection_close();
	}

	send(msg){
		this.socket.send(msg);
	}

	__validate_connetion(){

	}

	__reconnect(rebot = false){
		if(!this.parent.is_run){
			return;
		}
		if(rebot){
			this.__show_connection_reboot();
		}
		let s = rebot ? this.reboot_reconnect_timeout : this.error_reconnect_timeout;
		let THIS = this;
		this.timeoutid = setTimeout(function(){
			THIS.connect();
		}, s);
	}

	__set_error(_error_msg = ''){
		if(_error_msg === ''){
			this.error = false;
		}else{
			this.error = true;
			this.error_msg = _error_msg
		}
	}

	__is_supported(){
		let sup = "WebSocket" in window ? true : false;
		this.error = !sup;
		return sup;
	}

	__show_connection_close(){
		this.__refresh_connection_box(this.states.DIS);
	}

	__show_connection_good(){
		this.__refresh_connection_box(this.states.GOOD);
		this.__hide_connection_box(4250);
	}

	__show_connection_reboot(){
		this.__refresh_connection_box(this.states.REBOOT);
	}

	__show_connection_error(error){
		this.__refresh_connection_box(this.states.ERROR);
	}

	__show_connection_try(){
		this.__refresh_connection_box(this.states.TRY);
	}

	__refresh_connection_box(_state){
		this.__hide_connection_box();
		this.state = _state ? _state : this.states.COMMON;
		if(this.state.class != ''){
			this.message_box.classList.add(this.state.class);
		}
		this.message_box.innerText = this.state.text;
	}

	__hide_connection_box(timeout = 0){
		if(timeout > 0){
			let THIS = this;
			this.timeoutid = setTimeout(function(){
				THIS.__hide_connection_box_code();
			}, timeout);
		}else{
			this.__hide_connection_box_code();
		}
	}

	__hide_connection_box_code(){
		this.message_box.classList.remove(...[...this.message_box.classList].filter(c => c != 'connection'));
		this.message_box.innerText = '';
	}
}



class SocketConnectionState{

	constructor(){
		this.COMMON = {
			'class': '',
			'text': '',
		}
		this.TRY = {
			'class': 'try',
			'text': 'Попытка переподключения к серверу...',
		}
		this.ERROR = {
			'class': 'error',
			'text': 'Ошибка подключения. Через несколько секунд мы попробуем подключиться ...',
		}
		this.REBOOT = {
			'class': 'reboot',
			'text': 'Сервер перезагружается. Через пару минут связь восстановится.',
		}
		this.DIS = {
			'class': 'dis',
			'text': 'Вы отключены от сервера. Обновите страницу.',
		}
		this.GOOD = {
			'class': 'good',
			'text': 'Соединение установлено.',
			
		}
		this.NONE = {
			'class': 'none',
			'text': 'Соединение установлено.',
		}
	}
}

class SocketMessagesType{

	on_connect(_api_key){
		return this.__return({
			type: 'connect',
			data: {
				api_key: _api_key,
			},
		});
	}

	__return(_obj){
		console.log(_obj);
		return JSON.stringify(_obj);
	}
}





































class Ping{

	constructor(_host = 'localhost', port){
		this.host = 'http://' + _host + (port ? (':'+port) : '');
		console.log(this.host);
		this.img = new Image();
		this.inUse = true;
		let THIS = this;

        this.img.onload = function(){
        	THIS.inUse = false;
            console.log('responded');
        }
        this.img.onerror = function(e){
        	if(THIS.inUse){
        		THIS.inUse = false;
        		console.log('responded');
        		console.log(e);
        	}
        	//console.log(THIS);
        }

        this.img.src = this.host;

        this.timer = setTimeout(function () {
            if (THIS.inUse) {
                THIS.inUse = false;
                console.log('timeout');
            }
            //console.log(THIS);
        }, 1500);
        //console.log(this);
	}
}



class Cookie{

	static set(name, value, options){
		Cookie._setCookie(name, value, options);
	}

	static get(name = ''){
		var matches = document.cookie.match(new RegExp(
			"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
		));
		return matches ? decodeURIComponent(matches[1]) : undefined;
	}

	static delete(name){
		Cookie._setCookie(name, '', {
			expires: -1
		});
	}

	static _setCookie(name, value, options){
		options = options || {};

		var expires = options.expires;

		if (typeof expires == "number" && expires) {
			var d = new Date();
			d.setTime(d.getTime() + expires * 1000);
			expires = options.expires = d;
		}
		if (expires && expires.toUTCString) {
			options.expires = expires.toUTCString();
		}

		value = encodeURIComponent(value);

		var updatedCookie = name + "=" + value;

		for (var propName in options) {
			updatedCookie += "; " + propName;
			var propValue = options[propName];
			if (propValue !== true) {
				updatedCookie += "=" + propValue;
			}
		}

		document.cookie = updatedCookie;
	}

}