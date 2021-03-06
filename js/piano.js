var Piano = (function(){
  var blackKey = [true, false, true, true, false, true, true];

             // A   B   C   D   E   F   G
  var notes = [33, 35, 36, 38, 40, 41, 43,
               45, 47, 48, 50, 52, 53, 55,
               57, 59, 60, 62, 64, 65, 67,
               69, 71, 72, 74, 76, 77, 79,
               81, 83, 84, 86, 88, 89]
  var halfNotes = [];

  var score = [[60,500],[60,500],[67,500],[67,500],[69,500],[69,500],[67,500],[67,500],[65,500],[65,500],[64,500],[64,500],[62,500],[62,375],[64,125],[60,1000],[67,500],[67,500],[65,500],[65,500],[64,500],[64,500],[62,500],[62,500],[67,500],[67,500],[65,500],[65,500],[64,350],[65,50],[64,50],[62,50],[64,375],[65,125],[64,500],[62,500],[60,500],[60,500],[67,500],[67,500],[69,500],[69,500],[67,500],[67,500],[65,500],[65,500],[64,500],[64,500],[62,350],[64,50],[62,50],[60,50],[62,375],[64,125],[60,1000],[62,125],[60,125],[59,125],[60,125],[59,125],[60,125],[59,125],[60,125],[69,125],[67,125],[66,125],[67,125],[66,125],[67,125],[66,125],[67,125],[68,125],[69,125],[72,125],[71,125],[74,125],[72,125],[71,125],[69,125],[69,125],[67,125],[76,125],[74,125],[72,125],[71,125],[69,125],[67,250],[65,125],[74,125],[72,125],[71,125],[69,125],[67,125],[65,250],[64,125],[72,125],[71,125],[69,125],[67,125],[65,125],[64,125],[62,250],[69,250],[67,250],[59,250],[60,1000],[69,125],[67,125],[66,125],[67,125],[66,125],[67,125],[69,125],[67,125],[67,125],[65,125],[64,125],[65,125],[64,125],[65,125],[67,125],[65,125],[65,125],[64,125],[63,125],[64,125],[63,125],[64,125],[65,125],[64,125],[64,125],[62,125],[61,125],[62,125],[61,125],[62,125],[64,125],[62,125],[69,125],[67,125],[66,125],[67,125],[76,125],[72,125],[69,125],[67,125],[67,125],[65,125],[64,125],[65,125],[74,125],[71,125],[67,125],[65,125],[65,125],[64,125],[63,125],[64,125],[72,125],[67,125],[65,125],[64,125],[67,375],[64,125],[62,500],[62,125],[60,125],[59,125],[60,125],[59,125],[60,125],[59,125],[60,125],[69,125],[67,125],[66,125],[67,125],[66,125],[67,125],[66,125],[67,125],[68,125],[69,125],[72,125],[71,125],[74,125],[72,125],[71,125],[69,125],[69,125],[67,125],[76,125],[74,125],[72,125],[71,125],[69,125],[67,250],[65,125],[74,125],[72,125],[71,125],[69,125],[67,125],[65,250],[64,125],[72,125],[71,125],[69,125],[67,125],[65,125],[64,125],[62,250],[69,250],[67,250],[59,250],[60,1000]];

  var keyboardTop   = 175;
  var keyboardDepth = 100;
  var blackKeyDepth = 0;
  var maxVolume     = 127;

  var keyWidth      = 512 / notes.length;
  var blackKeyWidth = keyWidth;

  function Piano(){
    this.playingNotes = [];
    this.scoreIndex = 0;

    for(var i=notes[0]; i<notes[notes.length-1]; i++){
      if(notes.indexOf(i) < 0){
        halfNotes.push(i);
      }
    }
  }

  Piano.prototype.onMoveFinger = function(finger){
    if(finger.tipPosition[1] > keyboardTop || finger.tipPosition[2] > keyboardDepth) {
      this.playEnd(finger.id);
      return false;
    }
    if(finger.tipVelocity[1] > 0){ // 上への移動
      return true;
    }

    var volume = this.getVolume(finger);
    if(volume === null){ return false; }

    var note = this.getNote(finger);
    if(note !== null && this.playingNotes[finger.id] === note){ return true; }
    this.playEnd(finger.id);
    this.play(finger.id, note, volume);

    return true;
  }

  Piano.prototype.getVolume = function(finger){
    var velocity = finger.tipVelocity[1];
    if(isNaN(velocity)) { return null; }
    velocity = Math.abs(velocity);

    var volume = velocity / 300 * maxVolume;
    if(volume < 0)         { volume = 0; }
    if(volume > maxVolume) { volume = maxVolume; }

    return volume;
  }

  Piano.prototype.getNote = function(finger){
    var x = finger.tipPosition[0] + 256;

    var index = ~~(x / keyWidth);
    var note = notes[index];

    if(finger.tipPosition[2] < blackKeyDepth){
      var blackKeyX, existsHalfNote;

      existsHalfNote = blackKey[index % 7];
      if(existsHalfNote){
        blackKeyX = keyWidth * index + keyWidth * 0.6;
        if(blackKeyX < x && blackKeyX + blackKeyWidth > x){
          return note + 1;
        }
      }

      existsHalfNote = blackKey[(index-1) % 7];
      if(existsHalfNote || existsHalfNote === undefined){
        blackKeyX = keyWidth * index - keyWidth * 0.4;
        if(blackKeyX < x && blackKeyX + blackKeyWidth > x){
          return note - 1;
        }
      }

      return null;
    }

    return note;
  }

  Piano.prototype.play = function(fingerId, note, volume, duration, channel){
    var root = this;
    channel = channel || 0;

    this.playingNotes[fingerId] = note;
    MIDI.noteOn(channel, note, volume, 0);
    if(duration){
      MIDI.noteOff(channel, note, duration);
    }

    if(this.onPlay) {
      var isHalfNote = halfNotes.indexOf(note) >= 0;
      if(isHalfNote){ note--; }
      this.onPlay(notes.indexOf(note), isHalfNote); }
  }

  Piano.prototype.playEnd = function(fingerId){
    var note = this.playingNotes[fingerId];
    if(!note){ return; }
    MIDI.noteOff(0, note, 0);
    this.playingNotes.splice(fingerId, 1);

    if(this.onPlayEnd) {
      var isHalfNote = halfNotes.indexOf(note) >= 0;
      if(isHalfNote){ note--; }
      this.onPlayEnd(notes.indexOf(note), isHalfNote);
    }
  }

  Piano.prototype.allPlayEnd = function(){
    for(var index in this.playingNotes){
      this.playEnd(index);
    }
  }

  Piano.prototype.addPlayListener = function(callback){
    this.onPlay = callback;
  }

  Piano.prototype.addPlayEndListener = function(callback){
    this.onPlayEnd = callback;
  }

  Piano.prototype.autoPlay = function(){
    var note     = score[this.scoreIndex][0];
    var duration = score[this.scoreIndex][1];

    var time = +new Date;

    if(!this.nextPlayTime || this.nextPlayTime < time){
      this.playEnd(0);
      this.play(0, note, maxVolume, duration / 1000, 1);

      this.playEnd(1);
      this.play(1, note-12, maxVolume / 2, duration / 1000, 1);

      this.nextPlayTime = time + duration;

      this.scoreIndex++;
      if(this.scoreIndex >= score.length){ this.scoreIndex = 0; }
    }
  }

  return Piano;
})();
