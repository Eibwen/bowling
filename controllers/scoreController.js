var mongoose = require('mongoose'),
	Score = mongoose.model('Score'),
	scoringService = require('../services/scoringService'),
	_ = require('underscore');

// Validates an arrays of rolls by importing the roll data into a scoreFrame 
// array, and checking that each frame in the resulting array is valid.   
exports.canAcceptAnotherRoll = function (rollArray){
	var frames = scoringService.importRollsToScoreFrames(rollArray);
	// If we have any invalid frames, we shouldn't accept more data;
	if(!(_.every(frames, function(frame){ return frame.isValid();}))) return false; 
	
	// Otherwise, if we're not in the last frame, or we're in the last frame and need more data,
	// accept more rolls!
	return frames.length < 10 || !(frames[9].isComplete());
	
};
var canAcceptAnotherRoll = exports.canAcceptAnotherRoll;
// This function appends new rolls to the end of the roll array for a particular 
// score. The new data to be appended is first validated through the canAcceptAnotherRoll
// method, which checks that the game isn't already over and that the order of the rolls
// being passed in is valid.  If any invalid data is detected, the entirety of the new
// array is thrown away, and an error is returned.
exports.appendNewRollsToScore = function(scoreId, rolls, next){
	Score.findOne({_id: scoreId}, function(err, score){
		if(err) return next(err);
		if(!score) return next(null, null);

		if(!canAcceptAnotherRoll(score.rolls)) return next({msg:'This game looks like it\'s already finished'});

		for(var i = 0; i < rolls.length; i++){
			if(canAcceptAnotherRoll(score.rolls)){
				score.rolls.push(rolls[i]);
			}else{
				return next({msg: 'Incompatible roll data...'});
			}
		}
		score.save(function(err){
			if(err) return next(err); 
			return next(null, score); 
		});
	});
};

// This function returns a 'pretty' array of frames, built from a roll array.  Each frame
// in this array has firstRoll and secondRoll properties along with a score property which
// represents the running score up to that point in the game.  
//
// Spares and strikes are replaced accordingly with '/' and 'X'.
exports.getFrameByFrameScores = function(rollArray){
	var scoreFrames = scoringService.importRollsToScoreFrames(rollArray); 
	var runningFrames = [];

	for(var i = 1; i <= scoreFrames.length; i++){
		var prettyFrame = {},
			thisFrame = scoreFrames[i-1];
		if(thisFrame.isStrike()){
			prettyFrame.firstRoll = 'X';
			prettyFrame.secondRoll = ''; 
		}else if(thisFrame.isSpare()){
			prettyFrame.firstRoll = thisFrame.rolls[0] + '';
			prettyFrame.secondRoll = '/'; 
		}else{
			prettyFrame.firstRoll = thisFrame.rolls[0] + '';
			prettyFrame.secondRoll = (thisFrame.rolls[1] || '') + '';
		}
		prettyFrame.score = scoringService.getScoreAtFrame(rollArray, i); 
		
		runningFrames.push(prettyFrame);
	}
	return runningFrames; 
};