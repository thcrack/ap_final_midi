var socket = io.connect('http://10.232.106.34:3001/');
var slot = -1;
var MAX_VOICES = 1;
var bpm, swing;
var cc = 0;

$(document).attr("title", "WEBSEQ ADMIN");

$('body').append('<div id="main"></div>');
$('#main').append('<div id="ctrlPanel"></div>');
$('#ctrlPanel').append('<h1>ADMIN PANEL</h1>');
$('#ctrlPanel').append('<div class="ctrlModule" id="slotKicker"></div>');
$('#ctrlPanel').append('<div class="ctrlModule" id="bpmChanger"></div>');
$('#ctrlPanel').append('<div class="ctrlModule" id="swingChanger"></div>');
$('#ctrlPanel').append('<div class="ctrlModule" id="resetCaller"></div>');

$('#resetCaller').append('<h4>Set All</h4>');
$('#resetCaller').append('<button id="resetSeq"> Sequences </button>')
$('#resetCaller').append('<button id="resetSlot"> Slots </button>')
$('#resetCaller').append('<button id="setPreset"> Test Set </button>')
$('#resetCaller').append('<button id="setAllSample"> Pressure Test Sample</button>')
$('#resetCaller').append('<button id="setAllKeys"> Pressure Test Keys</button>')
$('#resetSeq').click(function(e){
	socket.emit('resetAllSeq');
})
$('#resetSlot').click(function(e){
	socket.emit('resetAllSlot');
})
$('#setPreset').click(function(e){
	for(var i = 0; i < 16; i++){
		if(i % 4 == 2){
			socket.emit('sampleChange',{seq: 10, slot: i});
		}
		if(i == 3 || i == 4 || i == 8 || i == 9 || i == 15){
			socket.emit('sampleChange',{seq: 6, slot: i});
		}
		if(i % 4 == 0){
			socket.emit('sampleChange',{seq: 0, slot: i});
		}
		if(i % 8 == 4){
			socket.emit('sampleChange',{seq: 3, slot: i});
		}
		if(i == 9 || i == 15){
			socket.emit('sampleChange',{seq: 2, slot: i});
		}
	}
})
$('#setAllSample').click(function(e){
	for(var i = 0; i < 16; i++){
		for(var j = 0; j < 16; j++){
			socket.emit('sampleChange',{seq: j, slot: i});
		}
	}
})
$('#setAllKeys').click(function(e){
	for(var i = 0; i < 16; i++){
		for(var k = 0; k < 4; k++){
			for(var l = 0; l < MAX_VOICES; l++){
				socket.emit('keyChange',{patch: k, slot: i, note: parseInt(60+l)});
			}
		}
	}
})

socket.on('slotCall', function(data){
	$('#slotKicker').empty();
	$('#slotKicker').append('<h4>Kick/Reset Slot</h4>');
	for(var i = 0; i < 16; i++){
		if(data[i]){
			$('#slotKicker').append('<div class="slot slot-on" seq="' + i + '"></div>');
		}else{
			$('#slotKicker').append('<div class="slot slot-off" seq="' + i + '"></div>');
		}
	}
	$('.slot-on').click(function(e){
		console.log("yay");
		socket.emit('kickSlot', $(this).attr('seq'));
	})
});

socket.on('bpmCall', function(data){
	bpm = data;
	$('#bpmChanger').empty();
	$('#bpmChanger').append('<h4>BPM Change</h4>');
	$('#bpmChanger').append('<button value="-" id="bpm-dec"> - </button>');
	$('#bpmChanger').append('<div id="bpm-num">' + bpm +  '</div>');
	$('#bpmChanger').append('<button value="+" id="bpm-inc"> + </button>');
	$('#bpm-inc').click(function(e){
		bpm++;
		socket.emit('bpmChange', bpm);
	})
	$('#bpm-dec').click(function(e){
		bpm--;
		socket.emit('bpmChange', bpm);
	})
});

socket.on('swingCall', function(data){
	console.log(data);
	swing = parseInt(data);
	$('#swingChanger').empty();
	$('#swingChanger').append('<h4>Swing Change</h4>');
	$('#swingChanger').append('<button value="-" id="swing-dec"> - </button>');
	$('#swingChanger').append('<div id="swing-num">' + swing +  '%</div>');
	$('#swingChanger').append('<button value="+" id="swing-inc"> + </button>');
	$('#swing-inc').click(function(e){
		if(swing<50){
			swing+=5;
			socket.emit('swingChange', swing);
		}
	})
	$('#swing-dec').click(function(e){
		if(swing>0){
			swing-=5;
			socket.emit('swingChange', swing);
		}
	})
});