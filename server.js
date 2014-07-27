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
console.log('Welcome to the Stellar Tales server');
console.log('(c) 2014 P1X\n\n');
console.log('Server starting..');

var fs          =   require('fs'),
    express     =   require('express'),
    app         =   express(),
    http        =   require('http').Server(app),
    io          =   require('socket.io')(http),
    idgen       =   require('idgen');;

var server = {

    setup: {
        fps: 1,
        synchroTime: 10,
        saveUniverseTime: 10*60,
        universeDevMode: true,
        universeSize: 100,
    },
    players: {},
    time: new Date(),
    tick: 0,
    universe: {},

    init: function(){
        app.use(express.static(__dirname + '/public'));

        // WEB
        app.get('/', function(req, res){
          res.sendfile('public/index.html');
        });

        console.log(this.getServerTime() + ' Loading universe..');
        if(!this.setup.universeDevMode){
            this.loadUniverse();
        }else{
            this.loadDevUniverse();
        }

        // connections
        io.on('connection', function(client){
            // conencted
            var gameID = server.addPlayer(client.id, client);

            // disconnected
            client.on('disconnect', function(){
                server.removePlayer(client.id);
            });

            client.on('system', function(data){
                if(data.cmd == 'change-game-id'){
                    server.setPlayerGameID({
                        id: client.id,
                        gameID: data.val
                    })

                    client.join(data.val);

                    io.to(data.val).emit('log', {
                        time: server.getServerTime(),
                        log: 'Successfully changed gameID'
                    });

                }
                if(data.cmd == 'debug-ping'){
                    io.to(server.players[client.id].gameID).emit('log', {
                        time: server.getServerTime(),
                        log: 'pong!'
                    });
                    console.log(server.getServerTime() + ' Debug: ping-pong sent to [ID: ' + client.id+ ' ]');
                }
                if(data.cmd == 'debug-uuid'){
                    io.to(server.players[client.id].gameID).emit('log', {
                        time: server.getServerTime(),
                        log: 'Your UUID is ' + client.id
                    });
                    console.log(server.getServerTime() + ' Debug: client requested UUID [ID: ' + client.id+ ' ]');
                }
                if(data.cmd == 'debug-game-id'){
                    io.to(server.players[client.id].gameID).emit('log', {
                        time: server.getServerTime(),
                        log: 'Your gameID is ' + server.players[client.id].gameID
                    });
                    console.log(server.getServerTime() + ' Debug: client requested gameID ' + server.players[client.id].gameID);
                }
            });

            client.on('game', function(data){
                // request for universe visible chunk
                if(data.cmd == 'set-pos'){
                    var player = server.players[client.id];
                    player.position = {
                        x: data.x,
                        y: data.y,
                    };
                    player.width = data.w;
                    player.height = data.h;
                    console.log(server.getServerTime() + ' Player [gameID: '+player.gameID+' ] set position at ' + player.position.x + ':' + player.position.y +' and view size ' +player.width+'x'+player.height);
                }

            });
        });

        // server
        http.listen(1337, function(){
            console.log(server.getServerTime() + ' Http server started!');
        });

        // STRAT LOOP
        setInterval(server.loop, 1000/this.setup.fps);
    },

    loadDevUniverse: function(){
        // CREATE CLEAR UNIVERSE
        var devUni = {
            // time of univers creation
            time: this.getServerDate(),

            // all static entities
            // server will only
            static: {
                stars: [],
                planets: [],
                gates: []
            },

            // all dynamic entities
            // server will simulate movements of those
            dynamic: {
                asteroids: [],
                ships: [],
            }
        };

        // CREATE STARTS
        for (var i = 0; i < 4 + (Math.random()*12)<<0; i++) {
            devUni.static.stars.push({
                energy: 1024,
                pos: {
                    x: -this.setup.universeSize + (Math.random()*this.setup.universeSize*2)<<0,
                    y: -this.setup.universeSize + (Math.random()*this.setup.universeSize*2)<<0
                }
            });
        };

        // CERATE PLANETS
        for (var i = 0; i < 64 + (Math.random()*128)<<0; i++) {
            devUni.static.planets.push({
                size: 1,
                material: 64,
                pos: {
                    x: -this.setup.universeSize + (Math.random()*this.setup.universeSize*2)<<0,
                    y: - this.setup.universeSize + (Math.random()*this.setup.universeSize*2)<<0
                }
            });
        }

        //
        server.universe = devUni;
    },

    loadUniverse: function(){
        fs.readFile('./universe.json', 'utf8', function (err,data) {
          if (err) {
            return console.log(err);
          }
          server.universe = JSON.parse(data);
          console.log(server.getServerTime() + ' Universe loaded successfully.');
        });
    },

    saveUniverse: function(){
        var universe = JSON.stringify(this.universe);

        fs.writeFile('./universe.json', universe, function (err) {
            if (err) {
                console.log(err.message);
                return;
            }
            console.log(server.getServerTime() + ' Universe saved successfully.');
        });
    },

    setPlayerGameID: function(params){
        this.players[params.id].gameID = params.gameID;
        console.log(this.getServerTime() + ' player changed gameID [ID: '+params.id+' ] => [gameID: '+params.gameID+' ]');
    },

    addPlayer: function(id, client){
        var gameID = idgen(20);

        server.players[id] = {
            gameID: gameID,
            time: server.getServerTime(),
            position: {
                x: 80 + (Math.random()*this.universe.size-80)<<0,
                y: 40 + (Math.random()*this.universe.size-40)<<0
            },
            width: 80,
            height: 40
        };

        client.join(gameID);

        console.log(this.getServerTime() + ' Player connected [ID: '+id+' ] [gameID: '+gameID+' ]');
        console.log(this.getServerTime() + ' Total players: '+server.getTotalPlayers());

        // SENT TO EVERYINE

        io.emit('log', {
            time: server.getServerTime(),
            log: 'Player connected'
        });

        io.emit('system', {
            cmd: 'total-players',
            val: server.getTotalPlayers()
        });

        // SEND ONLY TO CLIENT

        io.to(id).emit('system', {
            cmd: 'game-id',
            val: gameID
        });

        // SEND SETTINGS
        io.to(id).emit('system', {
            cmd: 'server-settings',
            fps: server.setup.fps,
            pos: {
                x: server.players[id].position.x,
                y: server.players[id].position.y
            }
        });

        // SEND STATS
        io.to(id).emit('system', {
            cmd: 'server-stats',
            universeTime: server.universe.time,
            universePlanets: server.universe.static.planets.length,
            universeStars: server.universe.static.stars.length,
            totalPlayers: server.getTotalPlayers(),
            serverTime: server.getServerTime()
        });
        return gameID;
    },

    removePlayer: function(id){

        delete this.players[id];

        console.log(this.getServerTime() + ' Player disconnected [ID: '+id+' ]');
        console.log(this.getServerTime() + ' Total players: '+server.getTotalPlayers());

        io.emit('log', {
            time: server.getServerTime(),
            log: 'Player disconnected'
        });

        io.emit('system', {
            cmd: 'total-players',
            val: server.getTotalPlayers()
        });

        return false;
    },

    getTotalPlayers: function(){
        var total = 0;
        for (var key in this.players) {
            total += 1;
        }
        return total;
    },

    getServerTime: function(){
        var time = this.time;
        return z(time.getHours(),2) + ':'+z(time.getMinutes(),2) + ':' + z(time.getSeconds(),2);
    },

    getServerDate: function(){
      var time = this.time;
        return time.getFullYear() + '-'+z(time.getMonth()+1,2) + '-' + z(time.getDate(),2);
    },

    simulateUniverse: function(){
        // do some awesome procedural calculations
    },

    loop: function(){
        server.tick += 1;
        server.time = new Date();

        if(server.tick % server.setup.synchroTime == 0){
            io.emit('system', {
                cmd: 'server-time',
                val: server.getServerTime()
            });
            console.log('time: '+server.getServerTime());
        }

        if(server.tick % server.setup.saveUniverseTime == 0){
            server.saveUniverse();
        }

        server.simulateUniverse();
    }
}

function z(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}
server.init();