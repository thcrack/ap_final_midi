var socket = io.connect('http://10.232.106.34:3001/');
var slot = -1;
var MAX_VOICES = 1;
var patchSwitch = 0;
var octSwitch = 0;
var cc = 0;

$('body').append('<div id="main"></div>');
$('#main').append('<div id="loginPanel"></div>');
$('#main').append('<div id="ctrlPanel"></div>');
$('#ctrlPanel').hide();
$('#ctrlPanel').append('<div id="seqTitle"></div>');
$('#ctrlPanel').append('<div id="seqCtrl"></div>');
$('#ctrlPanel').append('<div id="seqCtrlKeys"></div>');
$('#ctrlPanel').append('<div id="seqCtrlKeysPatch"></div>');
$('#ctrlPanel').append('<div id="seqSign"></div>');
$('#ctrlPanel').append('<div id="test"><input id="testSlider" type="range" min="0" max="127" step="1" /></div>');
$('#ctrlPanel').append('<div id="logout"></div>');

$('#testSlider').on('input',function(e){
	cc = $(this).val();
	socket.emit('ccUpdate',cc);
});

$('#logout').click(logOut);

function logOut(){
	
	socket.emit('userLogout',slot);
	slot = -1;
	$('#loginPanel').show();
	$('#ctrlPanel').hide();
	$('#seqTitle').empty();
	
}

$('#loginPanel').append('<h1>Web Interactive Sequencer</h1>');
$('#loginPanel').append('<h2>Pick a slot!</h2>');
$('#loginPanel').append('<div id="slotPicker"></div>');

socket.on('slotCall', function(data){
	$('#slotPicker').empty();
	for(var i = 0; i < 16; i++){
		if(data[i]){
			$('#slotPicker').append('<div class="slot slot-on" seq="' + i + '"></div>');
		}else{
			$('#slotPicker').append('<div class="slot slot-off" seq="' + i + '"></div>');
		}
	}
	$('.slot-off').click(function(e){
		slot = $(this).attr('seq');
		socket.emit('userLogin',slot);
		$('#seqTitle').append('<h1>Control Panel ' + (parseInt(slot)+1) + '</h1>');
		$('#loginPanel').hide();
		$('#ctrlPanel').show();
	})
});

socket.on('sampleCall', function(data){
	
	if(slot!=-1){
		
		// seq sample part
		
		$('#seqCtrl').empty();
		for(var i = 0; i < 16; i++){
			if(data[slot][i]){
				$('#seqCtrl').append('<div class="grid grid-on" seq="' + i + '"></div>');
			}else{
				$('#seqCtrl').append('<div class="grid grid-off" seq="' + i + '"></div>');
			}
		}
		$('.grid').click(function(e){
			socket.emit('sampleChange',{seq: $(this).attr('seq'), slot: slot});
		});
	}
});

socket.on('keyCall', function(data){
	
	if(slot!=-1){
		
		
		$('#seqCtrlKeys').empty();
		$('#seqCtrlKeys').append('<div class="key key-oct" id="octDown" seq="0"></div>');
		$('#octDown').css("opacity",0.5 + 0.25 * Math.max(0,-octSwitch));
		for(var i = 1; i < 15; i++){
			
			var success = false;
			
			for(var j = 0; j < MAX_VOICES; j++){
				if(data[patchSwitch][slot][j] == ((58+i)+12*octSwitch) ){
					$('#seqCtrlKeys').append('<div class="key key-on" seq="' + i + '"></div>');
					success = true;
					break;
				}
			}
			
			if(!success){
				switch(i){
				case 3:
				case 5:
				case 8:
				case 10:
				case 12:
					$('#seqCtrlKeys').append('<div class="key key-b" seq="' + i + '"></div>');
					break;
				default:
					$('#seqCtrlKeys').append('<div class="key key-w" seq="' + i + '"></div>');
				}
			}
		}
		
		$('#seqCtrlKeys').append('<div class="key key-oct" id="octUp" seq="15"></div>');
		$('#octUp').css("opacity",0.2 + 0.4 * Math.max(0,octSwitch));
		$('.key').click(function(e){
			var seqNo = parseInt($(this).attr('seq'));
			console.log(typeof(octSwitch));
			
			if(seqNo > 0 && seqNo < 15){
				socket.emit('keyChange',{patch: patchSwitch, slot: slot, note: ((58+seqNo)+12*octSwitch)});
			}else if(seqNo == 0 && octSwitch > -2){
				octSwitch --;
				socket.emit('reqKeyArray');
			}else if(seqNo == 15 && octSwitch < 2){
				octSwitch ++;
				socket.emit('reqKeyArray');
			}
		});
		$('#seqCtrlKeysPatch').empty();
		for(var i = 0; i < 4; i++){
			if(i == patchSwitch){
				$('#seqCtrlKeysPatch').append('<div class="patch patch-on" seq="' + i + '"></div>');
			}else{
				$('#seqCtrlKeysPatch').append('<div class="patch patch-off" seq="' + i + '"></div>');
			}
		}
		
		$('.patch').click(function(e){
			var seqNo = parseInt($(this).attr('seq'));
			patchSwitch = seqNo;
			socket.emit('reqKeyArray');
		});
	}
});

socket.on('kickCommand', function(data){

	if(data == slot){
		logOut();
		alert("You are kicked by the admin.");
	}else if(data == "all" && slot != -1){
		logOut();
		alert("Admin has reset all slots.");
	}
	
});

socket.on('notify', function(data){

	alert(data);
	
});

socket.on('currentCall', function(data){
	$('#seqSign').empty();
	for(var i = 0; i < 16; i++){
		if(i == slot){
			$('#seqSign').append('<div class="seq-grid seq-grid-self" seq="' + i + '"></div>');
		}else if(i === data){
			$('#seqSign').append('<div class="seq-grid seq-grid-on" seq="' + i + '"></div>');
		}else{
			$('#seqSign').append('<div class="seq-grid seq-grid-off" seq="' + i + '"></div>');
		}
	}
})


// idle timer

var t;
window.onload = resetTimer;
document.onmousemove = resetTimer;
document.onkeypress = resetTimer;

function idleCall() {
    logOut();
    alert("You are kicked due to inactivity.");
}

function resetTimer() {
    clearTimeout(t);
    if(slot!=-1){
    	t = setTimeout(idleCall, 120000)
    }
    // 1000 milisec = 1 sec
}