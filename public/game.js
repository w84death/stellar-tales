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
        gameLogLength: 22,
        soundSynth: true,
    },
    gameID: localStorage.getItem("stellar-tales-game-id") || false,
    stats: {
        players: 1,
        universeTime: 'N/A',
        planets: 'N/A',
        starts: 'N/A'
    },
    serverTime: 'N/A',
    audio: new (window.AudioContext || window.webkitAudioContext)(),

    // UI
    UI:{
        game: {
            html: document.getElementById('game'),
            width: 80,
            height: 34,
            aim: true,
        },
        log: {
            html: document.getElementById('log'),
            width: 50,
            height: 20,
        },
        command: {
            html: document.getElementById('command'),
            title: 'Info',
            width: 30,
            height: 20,
        }
    },
    ASCII:{
        void:       '<span class="void">.</span>',
        planet:     ['<span class="planet-1">.</span>',
                    '<span class="planet-2">*</span>',
                    '<span class="planet-3">o</span>'],
        star:       '<span class="star">@</span>',
        asteroid:   '<span class="asteroid">!</span>',
        aim:        ['<span class="aim">-</span>','<span class="aim">|</span>']

    },
    gameLog: [{
        log: 'Welcome to the <strong>Stellar Tales</strong>'
    },{
        log: 'Game by Krzysztof Jankowski, &copy; 2014 P1X'
    },{
        log: 'Use <strong>arrows to move</strong> through the universe'
    }],
    commandCenter: [],
    pos:{
        x: 0,
        y: 0,
    },
    universe: {
        static: {
            stars: {},
            planets: {},
            gates: {}
        },
        dynamic: {
            asteroids: {},
            ships: {},
        }
    },
    localUniverse: [],

    init: function(){
        // SET SOCKETS EVENTS
        this.setSockets();
        this.setKeyboardEvents();
        this.render({
            game: true,
            command: true,
            gameLog: true
        });

        // PREPARE EMPTY VIEWABLE (LOCAL) UNIVERSE
        this.prepareLocalUni();

        // START ENGINE
        this.loop();
    },

    setKeyboardEvents: function(){
        // moving view position
        document.onkeydown = function(e) {
            e = e || window.event;
            switch (e.keyCode) {
                case 37:
                    game.buttonPressed({
                        do: 'move-left',
                        to: 'server'
                    });
                    break;
                case 38:
                    game.buttonPressed({
                        do: 'move-up',
                        to: 'server'
                    });
                    break;
                case 39:
                    game.buttonPressed({
                        do: 'move-right',
                        to: 'server'
                    });
                    break;
                case 40:
                    game.buttonPressed({
                        do: 'move-down',
                        to: 'server'
                    });
                    break;
                case 32:
                    game.UI.game.aim = !game.UI.game.aim;
                    game.render({
                        game:true
                    });
                    break;
                case 65:
                    //game.setup.soundSynth = !game.setup.soundSynth;
                    if(game.setup.soundSynth) game.moogInit();
                    break;
                case 83:
                    if(game.setup.soundSynth) game.moogGenerateSynth();
                    break;
            }
        };
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
                game.pos.x = data.pos.x;
                game.pos.y = data.pos.y;
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
            if(data.type = 'uni-chunk'){
                game.pos.x = data.pos.x;
                game.pos.y = data.pos.y;
                game.render({
                    command: true
                });

                console.log(data.info)
                if(data.info){
                    game.gameLog.push({
                        log: 'You aimed at <em>'+ data.info.name+'</em>' + (data.info.size? ' of <em>size '+data.info.size+'</em>': '')
                    });

                    if(data.info.energy){
                        game.gameLog.push({
                            log: 'It has <em>'+ data.info.energy +' energy </em>'
                        });
                    }

                    if(data.info.material){
                        game.gameLog.push({
                            log: 'It has <em>'+ (data.info.material) + ' material</em>'
                        });
                    }

                    game.render({
                        gameLog: true
                    });

                    game.moog({
                        freq: 300,
                        attack: 50,
                        decay: 200,
                        oscilator: 2,
                        vol: 0.2
                    });
                }

                // this needs refactor for speed
                // full chunk for fresh load
                // one line for move
                game.universe.static = data.data;
                game.updateLocalUni();
            }
        });
    },

    moogInit: function(){
        this.moogGenerateSynth();
        this.moogLoop();
        this.moogLoop2();
    },

    moogGenerateSynth: function(){
        this.moogLoopsNoteID = 0;
        this.moogLoops = [];
        for (var i = 0; i < (24 + (Math.random()*24)<<0); i++) {

            this.moogLoops.push({
                freq: 150+(Math.random()*400)<<0,
                attack: 10,
                decay: 700+(Math.random()*700)<<0,
                oscilator: 1,
                pause: Math.random()*10 < 5,
                vol: 0.2
            });

        };

        this.moogLoopBassNoteID = 0;
        this.moogLoopsBass = [];
        for (var i = 0; i < (4 + (Math.random()*8)<<0); i++) {

            this.moogLoopsBass.push({
                freq: 10+(Math.random()*80)<<0,
                attack: 10,
                decay: 250+(Math.random()*250)<<0,
                oscilator: 1,
                pause: Math.random()*10 < 3,
                vol: 0.1
            });

        };
    },

    moogLoop: function(){
        game.moogLoopsNoteID++;
        if(game.moogLoopsNoteID >= game.moogLoops.length) game.moogLoopsNoteID = 0;
        game.moog(game.moogLoops[game.moogLoopsNoteID]);
        if(game.setup.soundSynth) window.setTimeout(game.moogLoop, 200);
    },

    moogLoop2: function(){
        game.moogLoopBassNoteID++;
        if(game.moogLoopBassNoteID >= game.moogLoopsBass.length) game.moogLoopBassNoteID = 0;
        game.moog(game.moogLoopsBass[game.moogLoopBassNoteID]);
        if(game.setup.soundSynth) window.setTimeout(game.moogLoop2, 800);
    },

    moog: function(params){
        if(params.pause) return;
        var vol = params.vol || 0.2,
            attack = params.attack || 20,
            decay = params.decay || 300,
            freq = params.freq || 30,
            oscilator = params.oscilator || 0;
            gain = this.audio.createGain(),
            osc = this.audio.createOscillator();

        // GAIN
        gain.connect(this.audio.destination);
        gain.gain.setValueAtTime(0, this.audio.currentTime);
        gain.gain.linearRampToValueAtTime(params.vol, this.audio.currentTime + attack / 1000);
        gain.gain.linearRampToValueAtTime(0, this.audio.currentTime + decay / 1000);

        // OSC
        osc.frequency.value = freq;
        osc.type = oscilator; //"square";
        osc.connect(gain);

        // START
        osc.start(0);

        setTimeout(function() {
            osc.stop(0);
            osc.disconnect(gain);
            gain.disconnect(game.audio.destination);
        }, decay)
    },

    prepareLocalUni: function(){
        this.localUniverse = [this.UI.game.width];
        for (var x = 0; x < this.UI.game.width; x++) {
            this.localUniverse[x] = [this.UI.game.height];
            for (var y = 0; y < this.UI.game.height; y++) {
                this.localUniverse[x][y] = this.ASCII.void;
            };
        };
    },

    clearLocalUni: function(){
        for (var x = 0; x < this.UI.game.width; x++) {
            for (var y = 0; y < this.UI.game.height; y++) {
                this.localUniverse[x][y] = this.ASCII.void;
            };
        };
    },

    updateLocalUni: function(){
        this.clearLocalUni();
        for (var key in this.universe.static.stars) {
            var star = this.universe.static.stars[key],
                localX = star.pos.x - this.pos.x,
                localY = star.pos.y - this.pos.y;
            this.localUniverse[localX][localY] = this.ASCII.star;
        }
        for (var key in this.universe.static.planets) {
            var planet = this.universe.static.planets[key],
                localX = planet.pos.x - this.pos.x,
                localY = planet.pos.y - this.pos.y;
            this.localUniverse[localX][localY] = this.ASCII.planet[planet.size-1];
        }
        this.render({
            game:true
        })
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
            if(this.localUniverse.length>0){
                for (var y = 0; y < this.UI.game.height; y++) {
                    for (var x = 0; x < this.UI.game.width; x++) {
                        if(!game.UI.game.aim){
                            bufferLine += this.localUniverse[x][y];
                        }else{
                            if(y == (this.UI.game.height*0.5)<<0 && x !== (this.UI.game.width*0.5)<<0 && this.localUniverse[x][y] == this.ASCII.void){
                                bufferLine += this.ASCII.aim[0];
                            }else
                            if(y !== (this.UI.game.height*0.5)<<0 && x == (this.UI.game.width*0.5)<<0 && this.localUniverse[x][y] == this.ASCII.void){
                                bufferLine += this.ASCII.aim[1];
                            }else{
                                bufferLine += this.localUniverse[x][y];
                            }
                        }
                    }
                    bufferLine += '<br/>';
                }
            }

            this.UI.game.html.innerHTML = bufferLine;
        }

        // COMMAND CENTER
        if(params.command){
            // STATS
            bufferLine = '';
            bufferLine += this.drawHeader('command',this.UI.command.title);
            bufferLine += 'Position: <em>'+(this.pos.x+((this.UI.game.width*0.5)<<0))+':'+(this.pos.y+((this.UI.game.height*0.5)<<0))+'</em><br/>';
            bufferLine += '<br/>';
            bufferLine += '<br/>';
            // COMMAND
            bufferLine += this.drawHeader('command','Command Center');
            bufferLine += '<br/>';
            bufferLine += '<br/>';
            for (var i = 0; i < this.commandCenter.length; i++) {
                bufferLine += '[<span class="button" data-do="'+this.commandCenter[i].cmd+'" data-to="'+this.commandCenter[i].to+'">'+this.commandCenter[i].label+'</span>]<br/>';
            };

            // DEBUG
            bufferLine += this.drawHeader('command','Debug info');
            bufferLine += 'gameID: [<span class="button" data-do="show-game-id">SHOW</span>] [<span class="button" data-do="change-game-id">CHANGE</span>]<br/>';
            bufferLine += 'Players online: <em>' + this.stats.players + '</em><br/>';
            bufferLine += 'Server time: <em>'+ this.serverTime +'</em><br/>';
            bufferLine += 'Universe:<br/>';
            bufferLine += '- created at: <em>' + this.stats.universeTime + '</em><br/>';
            bufferLine += '- planets: <em>' + this.stats.planets + '</em><br/>';
            bufferLine += '- stars: <em>' + this.stats.stars + '</em><br/>';

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

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
game.init();