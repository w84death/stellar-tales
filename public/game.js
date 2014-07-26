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
    id: localStorage.getItem("stellar-tales-uuid") || false,
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
                time: data.time,
                log: data.log
            });
        });

        // THE SYSTEM EVENT
        socket.on('system', function(data){
            // UUID
            if(data.cmd == 'uuid'){
                if(!game.id){
                    game.id = data.val;
                    localStorage.setItem("stellar-tales-uuid", game.id);
                }else{
                    socket.emit('system', {
                        cmd: 'new-uuid',
                        val: game.id
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
        bufferLine += 'UUID: <em>' + this.id + '</em><br/>';
        bufferLine += 'Players online: <em>' + this.stats.players + '</em><br/>';
        bufferLine += 'Server time: <em>'+ this.serverTime +'</em><br/>';
        bufferLine += 'Universe:<br/>';
        bufferLine += '- created at: <em>' + this.stats.universeTime + '</em><br/>';
        bufferLine += '- planets: <em>' + this.stats.planets + '</em><br/>';
        bufferLine += '- stars: <em>' + this.stats.stars + '</em><br/>';

        // CENTER
        bufferLine += this.drawHeader('command','Command Center');
        bufferLine += 'N/A';
        this.UI.command.html.innerHTML = bufferLine;

        // GAME LOG
        bufferLine = '';
        bufferLine += this.drawHeader('log','System log');
        for (var i = this.gameLog.length-1; (i > this.gameLog.length-this.setup.gameLogLength && i >= 0); i--) {
            bufferLine += (this.gameLog[i].time? this.gameLog[i].time + ' ' : '') + this.gameLog[i].log + '<br/>';
        };
        this.UI.log.html.innerHTML = bufferLine;
    },

    loop: function(){
        window.setTimeout(game.loop, 1000/game.setup.fps);

        game.render();
    },

};

game.init();