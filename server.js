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

var express     =   require('express'),
    app         =   express(),
    http        =   require('http').Server(app),
    io          =   require('socket.io')(http),
    uuid        =   require('uuid');

var server = {

    setup: {
        fps: 1,
        synchroTime: 10,
    },
    players: [],
    time: new Date(),
    tick: 0,
    world: {},

    init: function(){
        // WEB
        app.get('/', function(req, res){
          res.sendfile('public/index.html');
        });

        app.use(express.static(__dirname + '/public'));

        console.log('Loading world..');
        this.loadWorld();

        // connections
        io.on('connection', function(client){
            var id = uuid.v4();
            // conencted
            server.addPlayer(client.id);

            // disconnected
            client.on('disconnect', function(){
                server.removePlayer(client.id);
            });

            client.on('command', function(data){

            });
        });

        // server
        http.listen(1337, function(){
            console.log('http server started!');
        });

        // STRAT LOP
        setInterval(server.loop, 1000/this.setup.fps);
    },

    loadWorld: function(){
        // load from file
    },

    addPlayer: function(id){
        server.players.push({
            id: id,
            time: new Date()
        });

        console.log('new player connected [ID: '+id+' ]');
        console.log('Total players: '+server.getTotalPlayers());

        io.emit('log', {
            id: id,
            log: 'new player connected'
        });

        io.emit('system', {
            cmd: 'server-fps',
            val: server.setup.fps
        });

        io.emit('system', {
            cmd: 'server-time',
            val: server.getServerTime()
        });

        io.emit('system', {
            cmd: 'total-players',
            val: server.getTotalPlayers()
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

        console.log('player disconnected [ID: '+id+' ]');
        console.log('Total players: '+server.getTotalPlayers());

        io.emit('log', {
            id: id,
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
        return time.getHours() + ':'+time.getMinutes() + ':' + time.getSeconds() + ' ['+this.tick+']';
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
    }
}

server.init();