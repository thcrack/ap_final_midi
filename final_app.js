var express = require('express')
  , io = require('socket.io');

var app = module.exports = express.createServer(),
    io = io.listen(app);

app.set('view engine','pug');
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(__dirname + '/public'));

app.get('/',function(req,res){
	res.render('index');
});

app.get('/adm',function(req,res){
	res.render('admin');
});

var MAX_VOICES = 1;

var sampleArray = [];
var slotArray = [];
var keyArray = [];
var currentStep = 0;
var event = require('events');
var globalEvent = new event.EventEmitter();

// init functions

function initState(){
	
	for(var i = 0; i<16; i++){
		sampleArray[i] = [];
		for(var j = 0; j < 16; j++){
			//sampleArray[i].push();
			sampleArray[i][j] = false;
		}
	}
	
	// keyArray: [PATCH][SLOT][NOTES]
	
	for(var i = 0; i<4; i++){
		keyArray[i] = [];
		for(var j = 0; j < 16; j++){
			keyArray[i][j] = [];
			for(var k = 0; k < MAX_VOICES; k++){
				keyArray[i][j][k] = -1;
			}
		}
	}
	
	console.log(keyArray);
	
}

function initSlot(){
	
	for(var i = 0; i<16; i++){
		slotArray[i] = false;
	}
	
}

initState();
initSlot();

// midi setup

var midi = require('midi'),
	midiOut = new midi.output(),
	midiKB = [];

midiOut.openPort(1);
for(var i = 0; i < 4; i++){
	midiKB[i] = new midi.output();
	midiKB[i].openPort(2+i);
}

// sequencer

var seq;
var bpm = 128;
var swing = 10;
var time = Date.now();

function seqRun(e){
	
	var getInt = Math.floor(15000/parseInt(e));
	var msInt = getInt - 2;
	
	clearInterval(seq);
	seq = setInterval(function(){
		currentStep++;
		currentStep %= 16;
		if(currentStep % 2 == 1){
			
			//apply delay for swing
			
			setTimeout(function(){
				
				for(var i = 0; i < 16; i++){
					if(sampleArray[currentStep][i]){
						midiOut.sendMessage([144,60+i,100]);
					}
				}
				for(var j = 0; j < 4; j++){
					for(var k = 0; k < MAX_VOICES; k++){
						if(keyArray[j][currentStep][k] != -1){
							midiKB[j].sendMessage([144,keyArray[j][currentStep][k],100]);
						}
					}
				}
				
				setTimeout(function(){
					
					midiOut.sendMessage([176,123,0]);
					
					for(var j = 0; j < 4; j++){
						midiKB[j].sendMessage([176,123,0]);
					}
				},msInt*(1-(swing/100)) - 20);
				
			},msInt*(swing/100));
			
		}else{
			
			//no swing
			
			for(var i = 0; i < 16; i++){
				if(sampleArray[currentStep][i]){
					midiOut.sendMessage([144,60+i,100]);
				}
			}
			for(var j = 0; j < 4; j++){
				for(var k = 0; k < MAX_VOICES; k++){
					if(keyArray[j][currentStep][k] != -1){
						midiKB[j].sendMessage([144,keyArray[j][currentStep][k],100]);
					}
				}
			}
			
			setTimeout(function(){
				
				midiOut.sendMessage([176,123,0]);
				
				for(var j = 0; j < 4; j++){
					midiKB[j].sendMessage([176,123,0]);
				}
			},msInt - 20);
			
		}
		console.log("Offset: " + (Date.now()-time-getInt));
		time = Date.now();
		
		globalEvent.emit('stepForward');
	},msInt);
}

seqRun(bpm);

// socket

io.sockets.on('connection', function (socket) {

	console.log("CONNECTED");
	
	socket.emit('sampleCall',sampleArray);
	socket.emit('keyCall',keyArray);
	socket.emit('slotCall',slotArray);
	socket.emit('bpmCall',bpm);
	socket.emit('swingCall',swing);
	
	socket.on('userLogout',function(data){
		slotArray[data] = false;
		globalEvent.emit('slotUpdate');
		socket.emit('slotCall',slotArray);
	});
	
	socket.on('userLogin',function(data){
		slotArray[data] = true;
		socket.emit('sampleCall',sampleArray);
		socket.emit('keyCall',keyArray);
		globalEvent.emit('slotUpdate');
	});
	
	// note
	
	socket.on('sampleChange',function(data){
		console.log("LISTENED: " + data.slot + "/" + data.seq);
		sampleArray[data.slot][data.seq] = !sampleArray[data.slot][data.seq];
		socket.emit('sampleCall',sampleArray);
	});
	
	socket.on('keyChange',function(data){
		console.log("LISTENED: " + data.patch + "/" + data.slot + "/" + data.note);
		for(var i = 0; i < MAX_VOICES; i++){
			if(keyArray[data.patch][data.slot][i] == data.note){
				keyArray[data.patch][data.slot][i] = -1;
				socket.emit('keyCall',keyArray);
				return;
			}
		}
		for(var i = 0; i < MAX_VOICES; i++){
			if(keyArray[data.patch][data.slot][i] == -1){
				keyArray[data.patch][data.slot][i] = data.note;
				socket.emit('keyCall',keyArray);
				return;
			}
		}
		keyArray[data.patch][data.slot].splice(0,1);
		keyArray[data.patch][data.slot].push(data.note);
		socket.emit('keyCall',keyArray);
	});
	
	socket.on('reqKeyArray',function(e){
		
		socket.emit('keyCall',keyArray);
		
	});
	
	// cc
	
	socket.on('ccUpdate',function(data){
		console.log("LISTENED CC: " + data);
		midiOut.sendMessage([176,0,data]);
	});
	
	// adm
	
	socket.on('kickSlot',function(data){
		globalEvent.emit('kick',data);
		slotArray[data] = false;
		globalEvent.emit('slotUpdate');
	});
	
	socket.on('bpmChange',function(data){
		bpm = data;
		seqRun(bpm);
		socket.emit('bpmCall',bpm);
	});
	
	socket.on('swingChange',function(data){
		console.log(data);
		swing = parseInt(data);
		socket.emit('swingCall',swing);
	});
	
	socket.on('resetAllSeq',function(data){
		initState();
		globalEvent.emit('allAlert',"Admin has reset all sequences.");
		globalEvent.emit('sampleUpdate');
		globalEvent.emit('keyUpdate');
	});
	
	socket.on('resetAllSlot',function(data){
		initSlot();
		globalEvent.emit('allKick');
		globalEvent.emit('slotUpdate');
	});
	
	//global events
	
	globalEvent.on('stepForward',function(){
		socket.emit('currentCall',currentStep);
	});
	
	globalEvent.on('sampleUpdate',function(){
		socket.emit('sampleCall',sampleArray);
	});
	
	globalEvent.on('keyUpdate',function(){
		socket.emit('keyCall',keyArray);
	});
	
	globalEvent.on('slotUpdate',function(){
		socket.emit('slotCall',slotArray);
	});
	
	globalEvent.on('kick',function(data){
		socket.emit('kickCommand',data);
	});
	
	globalEvent.on('allKick',function(data){
		socket.emit('kickCommand',"all");
	});
	
	globalEvent.on('allAlert',function(data){
		socket.emit('notify',data);
	});
});

app.listen(3001);