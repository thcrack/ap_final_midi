var socket = io.connect('http://localhost:3001');
var slot = -1;
var bpm;
var cc = 0;

$(document).attr("title", "WEBSEQ ADMIN");

$('body').append('<div id="main"></div>');
$('#main').append('<div id="ctrlPanel"></div>');
$('#ctrlPanel').append('<h1>ADMIN PANEL</h1>');
$('#ctrlPanel').append('<div class="ctrlModule" id="slotKicker"></div>');
$('#ctrlPanel').append('<div class="ctrlModule" id="bpmChanger"></div>');
$('#ctrlPanel').append('<div class="ctrlModule" id="resetCaller"></div>');


$('#resetCaller').append('<h4>Reset All</h4>');
$('#resetCaller').append('<button id="resetSeq"> Sequences </button>')
$('#resetCaller').append('<button id="resetSlot"> Slots </button>')
$('#resetSeq').click(function(e){
	socket.emit('resetAllSeq');
})
$('#resetSlot').click(function(e){
	socket.emit('resetAllSlot');
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