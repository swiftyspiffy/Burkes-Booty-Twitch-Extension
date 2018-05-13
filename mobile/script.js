var panel_token;
var payload;
var announce = true;
var authenticated = false;
var version = 12;
var welcomeMessage = "This release brings bug fixes, UI changes for connection errors, and support for Passing giveaways! - <b>swiftyspiffy</b>";
var platform = "mobile";
var username;
var userid;
var twitch = window.Twitch.ext;
var base_api = "https://burkeblack.tv/extensions/burkes_booty/api.php";
var initialRender = false;

twitch.onAuthorized(function(auth) {
    panel_token = auth.token;
    var sections = auth.token.split('.');
    payload = JSON.parse(window.atob(sections[1]));
    if(payload.user_id) {
		if(!initialRender) {
			$('#onboarding').hide();
			$('#intro').html("Logging you in...");
			initialRender = true;
			setTimeout(authing, 2000);
		}
    }
});

twitch.onError(function(error) {
    //console.log("Burke's Booty Error:" + error);
});

twitch.listen('broadcast', function (target, contentType, payload) {
	if(username == null)
		return;
	dataStr = atob(payload);
	data = JSON.parse(dataStr);
	actionPayload = data['data'];
	switch(data['action']) {
		case "giveaway_new":
			handleGiveawayNew(actionPayload);
			break;
		case "giveaway_claim":
			handleGiveawayClaim(actionPayload);
			break;
		case "giveaway_clear":
			handleGiveawayClear(actionPayload);
			break;
		default:
			break;
	}
});

$(document).ready(function() {
	platform = getPlatform(getUrlVars());
	showUI("onboarding", false);
	$('#user_stats_link').click(function() {
		showUI("user_stats");
	});
	$('#settings_link').click(function() {
		showUI("settings");
	});
	$('#soundbytes_link').click(function() {
		showUI("soundbytes");
	});
	$('#submit_giveaway_link').click(function() {
		showUI("submit_giveaway");
	});
	$('#time_tracker_link').click(function() {
		showUI("time_tracker");
	});
	$('#raffle_wins_link').click(function() {
		showUI("raffle_wins");
	});
	$('#past_redemptions_link').click(function() {
		showUI("past_redemptions");
	});
	$('#redeem_now_link').click(function() {
		showUI("redeem_now");
	});
	$('#subathon_link').click(function() {
		showUI("subathon");
	});
	$('#about_link').click(function() {
		showUI("about");
	});
	$('#feedback_link').click(function() {
		showUI("feedback");
	});
	$('#realtime_giveaway_action').click(function() {
		handleGiveawayNewAction();
	});
	$('#realtime_giveaway_claim_action').click(function() {
		handleGiveawayClaimAction();
	});
	$('#realtime_giveaway_claim_pass').click(function() {
		handleGiveawayClaimPass();
	});
	$('#checkServer').click(function() {
		checkServerStatus();
	});
	$('#soundbyte_search').keyup(function(e) {
		if(e.keyCode == 13) {
			$('#page').html("1");
			getSoundbytes($('#soundbyte_search').val(), $('#soundbyte_genre').val(), 1);
		}
	});
	$('#soundbyte_genre').on('change', function() {
		$('#page').html("1");
		getSoundbytes($('#soundbyte_search').val(), $('#soundbyte_genre').val(), 1);
	});
	$('body').on('click', '.btn_send', function() {
		var sbId = getSbIdFromId(this.id);
		sendSoundbyte(sbId);
	});
	
	$('#pagination_left').click(function() {
		var curPage = parseInt($('#page').html());
		var prevPage = curPage - 1;
		$('#page').html(prevPage);
		getSoundbytes($('#soundbyte_search').val(), $('#soundbyte_genre').val(), curPage);
	});
	$('#pagination_right').click(function() {
		var curPage = parseInt($('#page').html());
		var nextPage = curPage + 1;
		$('#page').html(nextPage);
		getSoundbytes($('#soundbyte_search').val(), $('#soundbyte_genre').val(), nextPage);
	});
	
	$('#announce_yes').click(function() {
		$('#announce_yes').addClass("btn-success");
		$('#announce_yes').removeClass("btn-secondary");
		$('#announce_no').removeClass("btn-success");
		$('#announce_no').addClass('btn-secondary');
		handleAnnounce(true);
	});
	$('#announce_no').click(function() {
		$('#announce_no').addClass("btn-success");
		$('#announce_no').removeClass("btn-secondary");
		$('#announce_yes').removeClass("btn-success");
		$('#announce_yes').addClass('btn-secondary');
		handleAnnounce(false);
	});
	
	$('#feedback_submit').click(function() {
		handleFeedbackSubmit();
	});
});

function loadSettings() {
	if (!(localStorage.getItem("announce") === null)) {
		if(localStorage.getItem("announce") == "true") {
			handleAnnounce(true, false);
		} else {
			handleAnnounce(false, false);
		}
	}
	if(!(localStorage.getItem("entry_message_version") === null)) {
		if(parseInt(localStorage.getItem("entry_message_version")) < version) {
			localStorage.setItem('entry_message_version', version);
			showDialog("Welcome!", welcomeMessage);
		}
	} else {
		localStorage.setItem('entry_message_version', version);
		showDialog("Welcome!", welcomeMessage);
	}
}

function handleAnnounce(res, set = true) {
	if(res) {
		$('#announce_yes').addClass("btn-success");
		$('#announce_yes').removeClass("btn-secondary");
		$('#announce_no').removeClass("btn-success");
		$('#announce_no').addClass('btn-secondary');
		if(set)
			localStorage.setItem('announce', 'true');
	} else {
		$('#announce_no').addClass("btn-success");
		$('#announce_no').removeClass("btn-secondary");
		$('#announce_yes').removeClass("btn-success");
		$('#announce_yes').addClass('btn-secondary');
		if(set)
			localStorage.setItem('announce', 'false');
	}
	announce = res;
}

function authing() {
	getUIs();
    getStats();
	showUI("user_stats", false);
}

var checkServerInterval;
function checkServerStatus(callback = false) {
	if(!callback) {
		$('#checkServer').html("Checking...");
		$('#checkServer').addClass('disabled');
		$('#checkServer').prop("disabled",true);
		getStats(true);
	} else {
		$('#checkServer').html("Server not available...[30]");
		checkServerInterval = setInterval(checkServerTick, 1000);
		$('#checkServer').addClass('disabled');
		$('#checkServer').prop("disabled",true);
	}
}

var currentTick = 30;
function checkServerTick() {
	if(currentTick == 0) {
		clearInterval(checkServerInterval);
		currentTick = 30;
		$('#checkServer').removeClass("disabled");
		$('#checkServer').html("Check Server Status...");
		$('#checkServer').prop("disabled",false);
	} else {
		$('#checkServer').html("Server not available...[" + currentTick + "]");
	}
	currentTick = currentTick - 1;
}

function getSbIdFromId(id) {
	return parseInt(id.split("_")[1]);
}

var UIs = ["onboarding", "user_stats", "settings", "soundbytes", "submit_giveaway", "time_tracker", "raffle_wins", "past_redemptions", "redeem_now", "subathon", "about", "feedback", "realtime_giveaway"];
function showUI(uiName, toggle = true) {
	$.each(UIs, function(ind, ui) {
		var el = $('#' + ui + "_link");
		var par = el.parent();
		if(ui == uiName) {
			$('#' + ui).show();
			par.addClass("active");
		} else {
			$('#' + ui).hide();
			par.removeClass("active");
		}
	});
	if(toggle)
		$('#toggle_button').click();
}



function authed(_username, _doubloons, _soundbyte_credits, _userid, _subscriber) {
	$('#toggle_button').show();
	username = _username;
	userid = _userid;
	$('#intro').html("Hello " + username + "!");
	$('#doubloon_total').html("Through all of your trials and tribulations on the Dirty Skull (as well as mopping up that poop deck, you've collected <b>" + _doubloons.toLocaleString() + "</b> doubloons!");
	$('#soundbyte_credit_total').html("Through your excellent work at contributing to the stream, you've accumulated <b>" + _soundbyte_credits.toLocaleString() + "</b> soundbyte credits!");
	if(!_subscriber)
		$('#subscription_status').html("Our most recent records show that you have not joined the Dirty Skull! The poopdeck isn't going to swab itself!");
	else
		$('#subscription_status').html("Our most recent records show that you have joined the Dirty Skull! Thank you for supporting BurkeBlack and his crew!");
	getFollowDate(_userid)
	getGenres();
	getSoundbytes("", "all", "1");
	getWinnings();
}

function getStats(check = false) {
    if(panel_token == null)
        return;
    $.ajax({
        url: base_api + '?action=stats',
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json",
            version: version,
			platform: platform
        },
        dataType: 'json',
        success: function(data) {;
            if(data.successful) {
				$('#modalCaptive').modal('hide');
				$('#checkServer').prop("disabled",false);
				$('#checkServer').removeClass("disabled");
				loadSettings();
                username = data.username;
                authed(data.username, data.doubloons, data.soundbyte_credits, data.userid, data.subscriber);
            } else {
				handleErrorCodes(data);
				checkServerStatus(true);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			launchCaptive("Unable to connect to server. Too busy?");
		}
    });
}

function getUIs() {
    if(panel_token == null)
        return;
    $.ajax({
        url: base_api + '?action=ui',
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json",
            version: version,
			platform: platform
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
                var uis = data.uis;
				uis['user_stats'] ? $('#user_stats_link').show() : $('#user_stats_link').hide();
				uis['settings'] ? $('#settings_link').show() : $('#settings_link').hide();
				uis['soundbytes'] ? $('#soundbytes_link').show() : $('#soundbytes_link').hide();
				uis['submit_giveaway'] ? $('#submit_giveaway_link').show() : $('#submit_giveaway_link').hide();
				uis['time_tracker'] ? $('#time_tracker_link').show() : $('#time_tracker_link').hide();
				uis['raffle_wins'] ? $('#raffle_wins_link').show() : $('#raffle_wins_link').hide();
				uis['past_redemptions'] ? $('#past_redemptions_link').show() : $('#past_redemptions_link').hide();
				uis['redeem_now'] ? $('#redeem_now_link').show() : $('#redeem_now_link').hide();
				uis['subathon'] ? $('#subathon_link').show() : $('#subathon_link').hide();
				uis['about'] ? $('#about_link').show() : $('#about_link').hide();
				if(!uis['past_redemptions'] && !uis['redeem_now'])
					$('#exgame_dropdown').hide();
            } else {
				handleErrorCodes(data);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			launchCaptive("Unable to connect to server. Too busy?");
		}
    });
}

function getGenres() {
    if(panel_token == null)
        return;
    $.ajax({
        url: base_api + '?action=genres',
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json",
            version: version,
			platform: platform
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
                var genres = data.genres;
                $('#soundbyte_genre').empty();
                $('#soundbyte_genre').append('<option selected="selected" value="all">All</option>');
                $.each(genres, function(ind, genre) {
                    $('#soundbyte_genre').append('<option value="' + genre.text + '">' + genre.text +'</option>');
                });
            } else {
				handleErrorCodes(data);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			launchCaptive("Unable to connect to server. Too busy?");
		}
    });
}

function getWinnings() {
	if(panel_token == null)
        return;
    $.ajax({
        url: base_api + '?action=winnings',
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json",
            version: version,
			platform: platform
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
				$('#raffle_wins_table').empty();
				$('#exgame_redemptions_table').empty();
                var raffleWins = data['raffle_wins'];
				var exgameRedemptions = data['exgame_redemptions'];
				$.each(raffleWins, function(id, win) {
					insertWinIntoTable('raffle_wins_table', win['game'], win['key'], win['date']);
				});
				$.each(exgameRedemptions, function(id, win) {
					insertWinIntoTable('exgames_redemptions_table', win['game'], win['key'], win['date']);
				});
            } else {
				handleErrorCodes(data);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			launchCaptive("Unable to connect to server. Too busy?");
		}
    });
}

function insertWinIntoTable(table, game, key, date) {
	var row = "<tr><td>" + game + "</td><td>" + key + "</td></tr>";
	$('#' + table).append(row);
}

function configurePagination(left = false, right = false) {
	if(left && parseInt($('#page').html()) != 1)
		$('#pagination_left').show();
	else
		$('#pagination_left').hide();
	if(right)
		$('#pagination_right').show();
	else
		$('#pagination_right').hide();
}

function getSoundbytes(searchText, searchGenre, page) {
    $.ajax({
        url: base_api + '?action=soundbytes&search_text=' + searchText + '&search_genre=' + searchGenre + '&page=' + page,
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json",
            version: version,
			platform: platform
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
                $('#soundbytes_table').empty();
                var soundbytes = data.soundbytes;
				configurePagination(data.page_left, data.page_right);
                $.each(soundbytes, function(ind, soundbyte) {
					var soundbyteData = '<tr><td class="text-center soundbyte_listing">' + soundbyte.text + '</td><td><button class="btn-sm btn-success btn_send" id="sb_' + soundbyte.id + '">Send!</button></td></tr>';
                    $('#soundbytes_table').append(soundbyteData);
                });
            } else {
				handleErrorCodes(data);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			launchCaptive("Unable to connect to server. Too busy?");
		}
    });
}

function getFollowDate(userid) {
	//According to our logs, you enlisted to join this scurvy crew on <b>January 1st, 2018</b>!
	$.ajax({
        url: 'https://api.twitch.tv/kraken/users/' + userid + '/follows/channels/44338537?api_version=5&client_id=b0brhnzpw67833877v3uo8cf0k8o7p',
        type: 'get',
        dataType: 'json',
        success: function(data) {
            if(data.hasOwnProperty("error")) {
				$('#followed_date').html("According to our logs you have failed to join the scurvy crew! To do so, hit that follow button!");
			} else {
				var date = new Date(data["created_at"]);
				var dateStr = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
				$('#followed_date').html("According to our logs, you enlisted to join the scurvy crew on <b>" + dateStr + "</b>!");
			}
        },
		error: function() {
			$('#followed_date').html("According to our logs you have failed to join the scurvy crew! To do so, hit that follow button!");
		}
    });
}

function sendSoundbyte(soundbyteId) {
    var url = base_api + '?action=sendSoundbyte&soundbyteId=' + soundbyteId + '&announce=';
	var url = announce ? url + "1" : url + "0";

    $.ajax({
        url: url,
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json",
            version: version,
			platform: platform
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
                getStats();
				showDialog("Soundbyte Sent!", data.message);
            } else {
				if(data.hasOwnProperty("code") && data.code == "1")
					handleErrorCodes(data);
				else
					showDialog("Soundbyte Send Error!", "Your soundbyte was not sent to the stream because: \n" + data.message, false);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			launchCaptive("Unable to connect to server. Too busy?");
		}
    });
}

function getActiveRaffle() {
	$.ajax({
        url: base_api + '?action=active_raffle',
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json",
            version: version,
			platform: platform
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
                if(data.raffle != null) {
					var name = data.raffle['name'];
					var donator = data.raffle['donator'];
					var state = data.raffle['state']; // unentered, entered, winner, non_winner, finished
					var entryCount = data.raffle['entry_count'];
					$('#raffle_active_name').html(name);
					$('#raffle_active_donator').html(donator);
					switch(state) {
						case "unentered":
							
							break;
						case "entered":
							break;
						case "winner":
							break;
						case "non_winner":
							break;
						case "finished":
							break;
					}
					$('#raffle_active').show();
					$('#raffle_inactive').hide();
				} else {
					$('#raffle_active').hide();
					$('#raffle_inactive').show();
				}
            } else {
				handleErrorCodes(data);
            }
        }
    });
}

function handleErrorCodes(data) {
	switch(data.code) {
		case 1:
			launchCaptive(data.custom);
			break;
		default:
			break;
	}
}

function launchCaptive(custom) {
	$('#modalCaptive_message').html("This extension is currently disabled. Reason: \n" + custom);
	$('#modalCaptive').modal({backdrop: 'static', keyboard: false});
}

function underMaintenance(message, custom) {
	showDialog("Maintenance", "Extension under maintenance:\n" + custom, false);
}

function showDialog(title, message, good = true) {
	if(good) {
		$('.modal-header').addClass("modal_success");
		$('.modal-header').removeClass("modal_error");
	} else {
		$('.modal-header').addClass("modal_error");
		$('.modal-header').removeClass("modal_success");
	}
	$('#modal_title').html(title);
	$('#modal_message').html(message);
	$('#modal').modal('show');
}

function handleFeedbackSubmit() {
	var os = "ios";
	os = ($('#android').is(':checked') ? "android" : os);
	os = ($('#other').is(':checked') ? "other" : os);
	var feedback = $('#feedback_msg').val();
	if(feedback.length < 10) {
		showDialog("Feedback Error", "Please provide feedback longer than 10 characters!", false);
		return;
	}
	if(feedback.length > 1000) {
		showDialog("Feedback Error", "Please provide feedback shorter than 1000 characters!", false);
		return;
	}

	$.ajax({
        url: base_api + '?action=feedback&os=' + os + '&msg=' + encodeURI(feedback),
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json",
            version: version,
			platform: platform
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
				$('#feedback_submit').addClass("disabled");
				$('#feedback_submit').html("Sent!");
				$('#feedback_submit').prop("disabled",true);
				$('#feedback_msg').prop("disabled", true);
				showDialog("Feedback Successful", "Your feedback has been sent to BurkeBlack and the moderators! Thanks again for taking the time to submit useful information!");
            } else {
				handleErrorCodes(data);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			launchCaptive("Unable to connect to server. Too busy?");
		}
    });
}

function giveawayEnter(giveawayId) {
	var url = base_api + '?action=giveaway_enter&giveaway_id=' + giveawayId;
	
	$.ajax({
        url: url,
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json",
            version: version,
			platform: platform
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
                showDialog("Enter Giveaway", "Successfully entered the giveaway", true)
            } else {
				handleErrorCodes(data);
                showDialog("Enter Giveaway", data.message, false);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			launchCaptive("Unable to connect to server. Too busy?");
		}
    });
}

function giveawayLeave(giveawayId) {
	var url = base_api + '?action=giveaway_leave&giveaway_id=' + giveawayId;
	
	$.ajax({
        url: url,
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json",
            version: version,
			platform: platform
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
                showDialog("Left Giveaway", "Successfully left giveaway!", false);
            } else {
				handleErrorCodes(data);
                showDialog("Left Giveaway", data.message, false);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			launchCaptive("Unable to connect to server. Too busy?");
		}
    });
}

function giveawayPass(giveawayId) {
	var url = base_api + '?action=giveaway_pass&giveaway_id=' + giveawayId;
	
	$.ajax({
        url: url,
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json",
            version: version,
			platform: platform
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
				showDialog("Giveaway Pass", "Successfully passed giveaway!", true);
            } else {
				handleErrorCodes(data);
				showDialog("Giveaway Pass", data.message, false);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			launchCaptive("Unable to connect to server. Too busy?");
		}
    });
}

function giveawayClaim(giveawayId) {
	var url = base_api + '?action=giveaway_claim&giveaway_id=' + giveawayId;
	
	$.ajax({
        url: url,
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json",
            version: version,
			platform: platform
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
				showDialog("Giveaway Claim", "Successfully claimed giveaway! Congrats!", true);
            } else {
				handleErrorCodes(data);
				showDialog("Giveaway Claim", data.message, false);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			launchCaptive("Unable to connect to server. Too busy?");
		}
    });
}

var cooldownTimer;
var cooldown = 20;
function giveawayNewActionCooldown() {
	if(cooldown == 0) {
		clearInterval(cooldownTimer);
		cooldown = 20;
		if($('#realtime_giveaway_action').hasClass("btn-success")) {
			$('#realtime_giveaway_action').html("Enter Giveaway!");
		} else {
			$('#realtime_giveaway_action').html("Leave Giveaway!")
		}
		$('#realtime_giveaway_action').prop("disabled", false);
	} else {
		cooldown -= 1;
		if($('#realtime_giveaway_action').hasClass("btn-success")) {
			$('#realtime_giveaway_action').html("Enter Giveaway! [" + cooldown + "]");
		} else {
			$('#realtime_giveaway_action').html("Leave Giveaway! [" + cooldown + "]")
		}
	}
}
function handleGiveawayNewAction() {
	if($('#realtime_giveaway_action').html() == "Enter Giveaway!") {
		giveawayEnter(giveawayId);
		$('#realtime_giveaway_action').removeClass("btn-success");
		$('#realtime_giveaway_action').addClass("btn-danger");
		$('#realtime_giveaway_action').html("Leave Giveaway!");
		
	} else {
		giveawayLeave(giveawayId);
		$('#realtime_giveaway_action').removeClass("btn-danger");
		$('#realtime_giveaway_action').addClass("btn-success");
		$('#realtime_giveaway_action').html("Enter Giveaway!");
	}
	$('#realtime_giveaway_action').prop("disabled", true);
	cooldownTimer = setInterval(function() { giveawayNewActionCooldown(); }, 1000);
}

function handleGiveawayClaimAction() {
	giveawayClaim(giveawayId);
}

function handleGiveawayClaimPass() {
	giveawayPass(giveawayId);
}

function hideAllUIs() {
	UIs.forEach(function(ui) {
		$('#' + ui).hide();
	});
}

var giveawayEndsIn = 0;
var giveawayEndsInTimer;
var giveawayEndsInTimerRunning = false;
var giveawayId = 0;
function giveawayEndsInCountdown() {
	if(giveawayEndsIn == 0) {
		clearInterval(giveawayEndsInTimer);
		giveawayEndsInTimerRunning = false;
	} else {
		giveawayEndsIn -= 1;
		$('#realtime_giveaway_remaining').html(getTimeStringRawSeconds(giveawayEndsIn));
	}
}

function handleGiveawayNew(payload) {
	giveawayId = payload['id'];
	giveawayEndsIn = parseInt(payload['ends_in']);
	$('#realtime_giveaway_title').html(payload['name']);
	$('#realtime_giveaway_donator').html(payload['author']);
	hideAllUIs();
	$('#main_nav').hide();
	$('#realtime_giveaway_new').show();
	$('#realtime_giveaway_claim').hide();
	$('#realtime_giveaway').show();
	if(giveawayEndsInTimerRunning == false) {
		giveawayEndsInTimer = setInterval(function() { giveawayEndsInCountdown(); }, 1000);
		giveawayEndsInTimerRunning = true;
	}
}

var claimEndsIn = 0;
var claimEndsInTimer;
var claimEndsInTimerRunning = false;
function claimNewCountdown() {
	if(claimEndsIn == 0) {
		clearInterval(claimEndsInTimer);
		claimEndsInTimerRunning = false;
	} else {
		claimEndsIn -= 1;
		$('#realtime_giveaway_claim_remaining').html(getTimeStringRawSeconds(claimEndsIn));
	}
}

function handleGiveawayClaim(payload) {
	giveawayId = payload['id'];
	claimEndsIn = parseInt(payload['ends_in']);
	$('#realtime_giveaway_claim_title').html(payload['name']);
	$('#realtime_giveaway_claim_donator').html(payload['author']);
	$('#realtime_giveaway_claim_winner').html(payload['winner']);
	if(payload['winner'].toLowerCase() == username.toLowerCase()) {
		$('#realtime_giveaway_claim_action').show();
		$('#realtime_giveaway_claim_pass').show();
	} else {
		$('#realtime_giveaway_claim_action').hide();
		$('#realtime_giveaway_claim_pass').hide();
	}
	hideAllUIs();
	$('#main_nav').hide();
	$('#realtime_giveaway_new').hide();
	$('#realtime_giveaway_claim').show();
	$('#realtime_giveaway').show();
	if(claimEndsInTimerRunning == false) {
		claimEndsInTimer = setInterval(function() { claimNewCountdown(); }, 1000);
		claimEndsInTimerRunning = true;
	}
}

function handleGiveawayClear(payload) {
	clearInterval(claimEndsInTimer);
	claimEndsInTimerRunning = false;
	clearInterval(giveawayEndsInTimer);
	giveawayEndsInTimerRunning = false;
	claimEndsIn = 0;
	giveawayEndsIn = 0;
	giveawayId = 0;
	hideAllUIs();
	$('#realtime_giveaway_action').removeClass("btn-danger");
	$('#realtime_giveaway_action').addClass("btn-success");
	$('#realtime_giveaway_action').html("Enter Giveaway!");
	$('#main_nav').show();
	showUI("soundbytes");
	if(payload.hasOwnProperty("optional_arg")) {
		var arg = payload["optional_arg"];
		var val = payload["optional_arg_value"];
		switch(arg) {
			case "won":
				showDialog("Giveaway Ended", val + " has won and claimed the giveaway! Congratulate them!", true);
				break;
			default:
				// do nothing
				break;
		}
	} else {
		// do nothing
	}
}

// source: https://stackoverflow.com/questions/4656843/jquery-get-querystring-from-url
function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function getPlatform(queryStringArr) {
	if(queryStringArr.hasOwnProperty("platform")) {
		switch(queryStringArr["platform"]) {
			case "mobile":
				return "mobile";
			case "web":
				return "web";
			default:
				return "unknown";
		}
	} else {
		return "not_set";
	}
}

function getTimeStringRawSeconds(seconds) {
	var hours;
	var minutes;
	
	if(seconds >= 3600) {
		var remainder = seconds % 3600;
		hours = (seconds - remainder) / 3600;
		seconds -= hours * 3600;
	}
	if(seconds >= 60) {
		var remainder = seconds % 60;
		minutes = (seconds - remainder) / 60;
		seconds -= minutes * 60;
	}
	
	var retStr = "";
	if(hours > 0) {
		retStr = hours + " hour(s)";
	}
	if(minutes > 0) {
		if(retStr == "")
			retStr = minutes + " min(s)";
		else
			retStr += ", " + minutes + " min(s)";
	}
	if(seconds > 0) {
		if(retStr == "")
			retStr = seconds + " sec(s)";
		else
			retStr += "," + seconds + " sec(s)";
	}
	return retStr;
}