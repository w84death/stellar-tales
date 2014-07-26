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
    uuid        =   require('uuid');

var server = {

    setup: {
        fps: 1,
        synchroTime: 10,
        saveUniverseTime: 10*60,
        universeDevMode: true,
        universeSize: 100,
    },
    players: [],
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
            var id = uuid.v4();
            // conencted
            client.join(client.id);
            server.addPlayer(client.id);

            // disconnected
            client.on('disconnect', function(){
                server.removePlayer(client.id);
            });

            client.on('system', function(data){
                if(data.cmd == 'new-uuid'){
                    server.setNewPlayerUUID({
                        oldId: client.id,
                        newId: data.val
                    });
                    client.id = data.val;
                }
            });

            client.on('game', function(data){
                // request for universe visible chunk

            });
        });

        // server
        http.listen(1337, function(){
            console.log(server.getServerTime() + ' http server started!');
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
                    x: (Math.random()*this.setup.universeSize)<<0,
                    y: (Math.random()*this.setup.universeSize)<<0
                }
            });
        };

        // CERATE PLANETS
        for (var i = 0; i < 64 + (Math.random()*128)<<0; i++) {
            devUni.static.planets.push({
                size: 1,
                material: 64,
                pos: {
                    x: (Math.random()*this.setup.universeSize)<<0,
                    y: (Math.random()*this.setup.universeSize)<<0
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

    setNewPlayerUUID: function(params){
        for (var i = 0; i < this.players.length; i++) {
            if(this.players[i].id === params.oldId){
                this.players[i].id = params.newId;
                console.log(this.getServerTime() + ' player changed UUID [ID: '+params.oldId+' ] => [ID: '+params.newId+' ]');
                return true;
            }
        };
        return false;
    },

    addPlayer: function(id){
        server.players.push({
            id: id,
            time: server.getServerTime()
        });

        console.log(this.getServerTime() + ' player connected [ID: '+id+' ]');
        console.log(this.getServerTime() + ' total players: '+server.getTotalPlayers());

        // SENT TO EVERYINE

        io.emit('log', {
            time: server.getServerTime(),
            log: 'player connected'
        });

        io.emit('system', {
            cmd: 'total-players',
            val: server.getTotalPlayers()
        });

        // SEND TONLY O CLIENT

        io.to(id).emit('system', {
            cmd: 'uuid',
            val: id
        });

        // SEND SETTINGS
        io.to(id).emit('system', {
            cmd: 'server-settings',
            fps: server.setup.fps
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
        return true;
    },

    removePlayer: function(id){
        for (var i = 0; i < this.players.length; i++) {
            if(this.players[i].id === id){
                this.players.splice(i, 1);
                i = this.players.length;
            }
        };

        console.log(this.getServerTime() + ' player disconnected [ID: '+id+' ]');
        console.log(this.getServerTime() + ' total players: '+server.getTotalPlayers());

        io.emit('log', {
            time: server.getServerTime(),
            log: 'player disconnected'
        });

        io.emit('system', {
            cmd: 'total-players',
            val: server.getTotalPlayers()
        });

        return false;
    },

    getTotalPlayers: function(){
        return this.players.length;
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