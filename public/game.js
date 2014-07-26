/*
*
*   Stellar Tales
*   -------------
*
*   Massive multiplayer space simulator
*   by Krzysztof Jankowski
*   (c) 2014 P1X
*
*/

var socket = io();

var game = {

    setup:{
        fps:1,
        gameLogLength: 12,
    },
    gameID: localStorage.getItem("stellar-tales-game-id") || false,
    stats: {
        players: 1,
        universeTime: 'N/A',
        planets: 'N/A',
        starts: 'N/A'
    },
    serverTime: 'N/A',

    // UI
    UI:{
        game: {
            html: document.getElementById('game'),
            width: 80,
            height: 40,
        },
        log: {
            html: document.getElementById('log'),
            width: 50,
            height: 20,
        },
        command: {
            html: document.getElementById('command'),
            width: 30,
            height: 20,
        }
    },
    ASCII:{
        void:'',
    },
    gameLog: [{
        log: 'Welcome to the <strong>Stellar Tales</strong>'
    },{
        log: 'Game by Krzysztof Jankowski, &copy; 2014 P1X'
    }],
    commandCenter: [{
        label: 'SEND PING',
        cmd: 'debug-ping',
        to: 'server'
    },{
        label: 'REQUEST UUID',
        cmd: 'debug-uuid',
        to: 'server'
    },{
        label: 'REQUEST GAME-ID',
        cmd: 'debug-game-id',
        to: 'server'
    }],


    init: function(){
        console.log(this.gameID)
        // SET SOCKETS EVENTS
        this.setSockets();

        this.render({
            game: true,
            command: true,
            gameLog: true
        });
        // START ENGINE
        this.loop();
    },

    setSockets: function(){
        // THE LOG EVENT
        socket.on('log', function(data){
            game.gameLog.push({
                time: data.time,
                log: data.log
            });
            game.render({
                gameLog: true
            });
        });

        // THE SYSTEM EVENT
        socket.on('system', function(data){
            // gameID
            if(data.cmd == 'game-id'){
                if(!game.gameID){
                    game.setNewGameID({
                        id: data.val,
                        emit: false
                    });
                }else{
                    game.setNewGameID({
                        id: game.gameID,
                        emit: true
                    });
                }
            }

            // SETTINGS
            if(data.cmd == 'server-settings'){
                game.setup.fps = data.fps;
            }

            // STATS
            if(data.cmd == 'server-stats'){
                game.stats.universeTime = data.universeTime;
                game.stats.planets = data.universePlanets;
                game.stats.stars = data.universeStars;
                game.stats.players = data.totalPlayers;
                game.serverTime = data.serverTime;
            }

            // TIME
            if(data.cmd == 'server-time'){
                game.serverTime = data.val;
            }

            // TOTAL PLAYERS
            if(data.cmd == 'total-players'){
                game.stats.players = data.val;
            }
            game.render({
                command: true
            });
        });

        // THE GAME EVENT
        socket.on('game', function(data){

        });
    },

    drawHeader: function(ui, title){
        var bufferLine = '',
            len = this.UI[ui].width - title.length - 5;

        bufferLine += '+';
        for (var i = 0; i < len; i++) {
            if(i == (len*0.5)<<0){
                bufferLine += '|<strong> ' + title + ' </strong>|';
            }else{
                bufferLine += '-';
            }
        };
        bufferLine += '+<br/>';
        return bufferLine;
    },

    buttonPressed: function(data){
        if(data.to == 'server'){
            socket.emit('system', {
                cmd: data.do
            });
        }else{
            if(data.do == 'show-game-id'){
                window.alert('Your gameID is '+game.gameID);
            }
            if(data.do == 'change-game-id'){
                var newGameID = window.prompt('Enter your gameID (20 characters)', '');
                if(newGameID != null && newGameID.length == 20){
                    game.setNewGameID({
                        id: newGameID,
                        emit: true
                    });
                }
            }
        }
    },

    setNewGameID: function(params){
        game.gameID = params.id;
        localStorage.setItem("stellar-tales-game-id", game.gameID);
        if(params.emit){
            socket.emit('system', {
                cmd: 'change-game-id',
                val: game.gameID
            });
        }
    },

    render: function(params){
        var bufferLine = '';

        this.removeEvents(params);

        // GAME WINDOW
        if(params.game){
            // FRAME
            bufferLine += this.drawHeader('game','Stellar Tales - game world');

            // GAME
            /*
            for (var y = 0; y < game.height; y++) {
                for (var x = 0; x < game.width; x++) {
                    var t = game.ASCII.void;
                    for (var i = 0; i < game.universe.length; i++) {
                        if(game.universe[i].x === x && game.universe[i].y === y){
                            t = game.universe[i].ASCII;
                        }
                    };
                    bufferLine += t;
                }
                bufferLine += '<br/>';
            }
            */
            this.UI.game.html.innerHTML = bufferLine;
        }

        // COMMAND CENTER
        if(params.command){
            // STATS
            bufferLine = '';
            bufferLine += this.drawHeader('command','Stats');
            bufferLine += 'gameID: [<span class="button" data-do="show-game-id">SHOW</span>] [<span class="button" data-do="change-game-id">CHANGE</span>]<br/>';
            bufferLine += 'Players online: <em>' + this.stats.players + '</em><br/>';
            bufferLine += 'Server time: <em>'+ this.serverTime +'</em><br/>';
            bufferLine += 'Universe:<br/>';
            bufferLine += '- created at: <em>' + this.stats.universeTime + '</em><br/>';
            bufferLine += '- planets: <em>' + this.stats.planets + '</em><br/>';
            bufferLine += '- stars: <em>' + this.stats.stars + '</em><br/>';

            // COMMAND
            bufferLine += this.drawHeader('command','Command Center');
            for (var i = 0; i < this.commandCenter.length; i++) {
                bufferLine += '[<span class="button" data-do="'+this.commandCenter[i].cmd+'" data-to="'+this.commandCenter[i].to+'">'+this.commandCenter[i].label+'</span>]<br/>';
            };
            this.UI.command.html.innerHTML = bufferLine;
        }

        // GAME LOG
        if(params.gameLog){
            bufferLine = '';
            bufferLine += this.drawHeader('log','System log');
            for (var i = this.gameLog.length-1; (i > this.gameLog.length-this.setup.gameLogLength && i >= 0); i--) {
                bufferLine += (this.gameLog[i].time? this.gameLog[i].time + ' ' : '') + this.gameLog[i].log + '<br/>';
            };
            this.UI.log.html.innerHTML = bufferLine;
        }
        this.registerEvents(params);
    },

    removeEvents: function(params){
        if(params.game){
            var anchors = this.UI.game.html.getElementsByClassName("button");
            for (var i = 0; i < anchors.length ; i++) {
                anchors[i].removeEventListener('click');
            }
        }

        if(params.command){
            var anchors = this.UI.command.html.getElementsByClassName("button");
            for (var i = 0; i < anchors.length ; i++) {
                anchors[i].removeEventListener('click');
            }
        }
    },

    registerEvents: function(params){
        if(params.game){
            var anchors = this.UI.game.html.getElementsByClassName("button");
            for (var i = 0; i < anchors.length ; i++) {
                anchors[i].addEventListener('click',function () {
                    game.buttonPressed(this.dataset);
                },false);
            }
        }
        if(params.command){
            var anchors = this.UI.command.html.getElementsByClassName("button");
            for (var i = 0; i < anchors.length ; i++) {
                anchors[i].addEventListener('click',function () {
                    game.buttonPressed(this.dataset);
                },false);
            }
        }
    },

    loop: function(){
        window.setTimeout(game.loop, 1000/game.setup.fps);

        game.render({
            game: true
        });
    },

};

game.init();