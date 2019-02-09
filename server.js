const mongo = require('mongodb').MongoClient;
const io = require('socket.io').listen(3000).sockets;

// Connect to mongo
mongo.connect('mongodb://127.0.0.1', { useNewUrlParser: true },function(err, db){
    if(err){
        throw err;
    }
    console.log('MongoDB Connected to Port: ' + 3000);

    // Connect to Socket.io
    io.on('connection', function(socket){
        let chat = db.collection('chats');

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        //Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input event
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            // Check for name and message
            if(name =='' || message == '') {
                sendStatus('Please provide a name and message');
            } else {
                // Insert message
                chat.insert({name: name, message: message}, function(){
                    io.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                })
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                socket.emit('Cleared');
            })
        })
    });
});
