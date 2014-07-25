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
    },
    id:null,
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
    totalPlayers: 1,
    ASCII:{
        void:'',
    },
    gameLog: [{
        id: false,
        log: '<strong>Welcome to the Stellar Tales</strong>'
    }],
    serverTime: false,

    init: function(){
        // SET SOCKETS EVENTS
        this.setSockets();

        // START ENGINE
        this.loop();
    },

    setSockets: function(){
        // THE LOG EVENT
        socket.on('log', function(data){
            game.gameLog.push({
                id: data.id,
                log: data.log
            });
        });

        // THE SYSTEM EVENT
        socket.on('system', function(data){
            if(data.cmd == 'total-players'){
                game.totalPlayers = data.val;
            }
            if(data.cmd == 'server-time'){
                game.serverTime = data.val;
            }
            if(data.cmd == 'server-fps'){
                game.setup.fps = data.val;
            }
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

    render: function(){
        var bufferLine = '';

        // GAME WINDOW

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

        // COMMAND CENTER
        // STATS
        bufferLine = '';
        bufferLine += this.drawHeader('command','Stats');
        bufferLine += 'Players online: <em>' + this.totalPlayers + '</em><br/>';
        bufferLine += 'Server time: <em>'+ (this.serverTime? this.serverTime : 'N/A') +'</em><br/>';

        // CENTER
        bufferLine += this.drawHeader('command','Command Center');
        bufferLine += 'N/A';
        this.UI.command.html.innerHTML = bufferLine;

        // GAME LOG
        bufferLine = '';
        bufferLine += this.drawHeader('log','System log');
        for (var i = game.gameLog.length-1; (i > game.gameLog.length-12 && i >= 0); i--) {
            bufferLine += this.gameLog[i].log;
            if(this.gameLog[i].id){
                bufferLine += ' [ID: <em>'+this.gameLog[i].id+'</em>]';
            }
            bufferLine += '<br/>';
        };
        this.UI.log.html.innerHTML = bufferLine;
    },

    loop: function(){
        window.setTimeout(game.loop, 1000/game.setup.fps);

        game.render();
    },

};

game.init();