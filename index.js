var SlackBot = require('slackbots')
var api = require('axios')
var fs = require('fs')

var bot = new SlackBot({
	token: process.env.slack,
	name: 'Chester'
});

var activeGame = false
var gameLock = false

bot.on('start', function(){
	
})

function fastMathQuestionGenerator(min, max) {
	return Math.round(Math.random() * (max - min) + min);
}

async function fastMath(count, answered, currScores){
	
	var tempScores = currScores

	var botGame = new SlackBot({
		token: process.env.slack,
		name: 'Chester'
	});
	
	var params = {
		icon_emoji: ':chester:'
	}

	var questionCount = count;
	var correctAnswered = answered;
	
	if(questionCount != 11){
		var firstNum = fastMathQuestionGenerator(1, 100)
		var secondNum = fastMathQuestionGenerator(1, 100)
		var anserKey = firstNum + secondNum
		if(questionCount == 1){
			botGame.postMessageToChannel('chester', questionCount + ') What is ' + firstNum + ' + ' + secondNum + ' ?', params)
		}
		
		if(correctAnswered){
			correctAnswered = false
			var dataQuestions = {
				count:questionCount,
				first: firstNum,
				second: secondNum,
				param: params
			}

			setTimeout(function(data){
				botGame.postMessageToChannel('chester', data.count + ') What is ' + data.first + ' + ' + data.second + ' ?', data.param)
			},2000,dataQuestions)
			
		}
		
		botGame.on('message', async function(data){
			if(!isNaN(data.text)){
				if(anserKey == Number(data.text)){
					let fastMathLock = await fs.readFileSync('lockAnswer', 'utf8');
					if(botGame !== undefined){
						botGame.removeAllListeners()
						if(fastMathLock === '0'){
							botGame = new SlackBot({
								token: process.env.slack,
								name: 'Chester'
							});
							// lock the file
							fs.writeFile("lockAnswer", "1", function(err){
								if(err){
									return console.log(err)
								}
							})

							let fastUser = await botGame.getUserById(data.user)
							let users = await api.get(process.env.chesterapi + '/getallusers')
							userColl = users.data

							var found = false
							var oldScore = 0
							for(var obj of userColl){
								if(obj['ID'] === data.user){
									oldScore = obj['Score']
									found = true
									break
								}
							}

							if(tempScores === []){
								if(found){
									tempObj = {
										method: "patch",
										data: {
											ID:data.user,
											Name: fastUser.profile.real_name,
											Score: oldScore + 1
										}
									}
								}
								else{
									tempObj = {
										method: "post",
										data: {
											ID:data.user,
											Name: fastUser.profile.real_name,
											Score: oldScore + 1
										}
									}
								}
								tempScores.push(tempObj)
							}
							else{
								var k = 0
								var foundIndex = 0
								var find = false
								for(k; k<tempScores.length; k++){
									if(tempScores[k].data.ID === data.user){
										foundIndex = k
										find = true
									}
								}
								if(find){
									//save score
									oldScore = tempScores[foundIndex].data.Score
									//remove from temp array
									tempScores.splice(foundIndex, 1)
								}

								if(found){
									//save object with updated score
									tempObj = {
										method: "patch",
										data: {
											ID:data.user,
											Name: fastUser.profile.real_name,
											Score: oldScore + 1
										}
									}
								}
								else{
									//save object with updated score
									tempObj = {
										method: "post",
										data: {
											ID:data.user,
											Name: fastUser.profile.real_name,
											Score: oldScore + 1
										}
									}
								}
								
								tempScores.push(tempObj)
							}





							questionCount = questionCount + 1
							correctAnswered = true

							var dataTop = {
								bot: botGame,
								username: fastUser.profile.real_name,
								count: questionCount,
								scores: tempScores
							}
							setTimeout(function(data){
								var params = {
									icon_emoji: ':chester:'
								}
								data.bot.postMessageToChannel('chester', 'Meowwww Correct! ' + ' Good job ' + data.username + '!', params)
								
								data.bot.removeAllListeners()

								var infoForFunction = {
									count: data.count,
									scores: data.scores
								}
								setTimeout(function(data){
									fastMath(data.count, true, data.scores)
								}, 5000, infoForFunction)

							},3000, dataTop)

							
							// unlock the file
							fs.writeFile("lockAnswer", "0", function(err){
								if(err){
									return console.log(err)
								}
							})
						}
					}
				}
			}
		})
	}
	else{
		botGame.postMessageToChannel('chester', 'Well done!! Saving scores to the leaderboard. MEOW! Check your scores with "show me scores chester"', params)

		setTimeout(async function(){},2000)
		//save scores to the leaderboard
		var ii = 0
		for(ii; ii<tempScores.length; ii++){
			if(tempScores[ii].method === 'post'){
				setTimeout(async function(data){
					await api.post(process.env.chesterapi + '/saveusers', data)
				},2000,tempScores[ii].data)
			}
			else{
				setTimeout(async function(data){
					await api.patch(process.env.chesterapi + '/updatescores/' + data.ID, data)
				},2000,tempScores[ii].data)
			}
		}
	}

	if(questionCount == 11){
		return
	}
}

bot.on('message', async function(data) {
	if(activeGame == false){
		if(data.text === 'lets play chester'){
			if(gameLock == false){
				gameLock = true
				var params = {
					icon_emoji: ':chester:'
				}
				bot.postMessageToChannel('chester', '*Lets play!  you are all my :squirrel: now!*', params)
				setTimeout(function(){
					bot.postMessageToChannel('chester', 'Randomly choosing a game...', params)
		
					setTimeout(function(){
						setTimeout(function(){
							



							//randomize games here
							//Fast Math game
							bot.postMessageToChannel('chester', '*Fast Math!*', params)
							setTimeout(function(){
								bot.postMessageToChannel('chester', '~~~Rules:  I ask 10 questions, fastest person to answer them gets a point!~~~', params)
								setTimeout(function(){
									bot.postMessageToChannel('chester', 'Ready.......', params)
		
									setTimeout(function(){
										bot.postMessageToChannel('chester', 'GO!', params)
		
										setTimeout(function(){	
											fastMath(1, false, [])
											gameLock = false
										}, 2000)
		
									}, 2000)
		
								}, 10000)
							}, 2000)







						}, 2000)
					}, 2000)
		
				}, 2000)
			}
		}
	}

	if(data.text === 'show me scores chester'){
		var params = {
			icon_emoji: ':chester:'
		}
		var userColl = []
		let users = await api.get(process.env.chesterapi + '/getallusers')
		userColl = users.data
		userColl.map(obj => {
			bot.postMessageToChannel('chester', obj.Name + ' : ' + obj.Score + ' points', params)
		})
	}

	if(data.text === 'post poop time chester'){
		var params = {
			icon_emoji: ':chester:',
			attachments: [
				{
					"fallback": "Post Poop??",
					"text": "Uhh...",
					"image_url": "https://ibin.co/55YoZoPgvp72.jpg",
					"thumb_url": "https://ibin.co/55YoZoPgvp72.jpg"
				}
			]
		}
		bot.postMessageToChannel('chester', 'MEEEEEEEOWWWW', params)
	}

	if(data.text === 'want a churu chester?'){
		var params = {
			icon_emoji: ':chester:',
			attachments: [
				{
					"fallback": "HELL YEEEEEAAAAHH",
					"text": "HELL YEAAAAAAH",
					"image_url": "https://ibin.co/55Ysn8eluPbl.jpg",
					"thumb_url": "https://ibin.co/55Ysn8eluPbl.jpg"
				}
			]
		}
		bot.postMessageToChannel('chester', 'HELL YEAAAAAAH', params)
	}
});


