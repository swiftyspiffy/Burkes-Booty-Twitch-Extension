var panel_token;
var payload;
var announce = true;
var authenticated = false;
var version = 14;
var platform = "web";
var username;
var initialRender = false;
var base_api = "https://burkeblack.tv/extensions/burkes_booty/api.php";

window.Twitch.ext.onAuthorized(function(auth) {
    panel_token = auth.token;
    var sections = auth.token.split('.');
    payload = JSON.parse(window.atob(sections[1]));
    if(payload.user_id) {
		if(!initialRender) {
			$('#auth').fadeOut();
			$('#welcome').html("Logging you in...");
			initialRender = true;
			setTimeout(authing, 2000);
		}
    } else {
        $('#stats').fadeOut();
        $('#welcome').fadeIn();
        $('#auth').fadeIn();
        $('#auth_welcome').fadeOut();
        $('#soundbytes').fadeOut();
    }
});

window.Twitch.ext.onError(function(error) {
    //console.log("Burke's Booty Error:" + error);
});

window.Twitch.ext.listen('broadcast', function (target, contentType, payload) {
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
	$(document).on('click', '.listing_redeem', function(el) {
		handleExGameRedeem(el.target.id);
	});
	$('#auth_link').click(function() {
		window.Twitch.ext.actions.requestIdShare();
	});
	$('#redemptions_toggle').click(function() {
		handleRedeemToggle();
	});
	$('#under_maintenance_retry').click(function() {
		handleRetryClick();
	});
    $('#giveaway_clear').click(function() {
        clearGiveawaySubmissionInputs();
    });
    $('#giveaway_submit').click(function() {
        submitGiveaway($('#giveaway_name').val(), $('#giveaway_donator').val(), $('#giveaway_type').val(), $('#giveaway_data').val(), $('#giveaway_doubloons').val(), $('#giveaway_non_sub').is(':checked'));
    });
	$('#wins_link').click(function() {
		handleMenuLinks('wins');
	});
    $('#credit_link').click(function() {
        handleMenuLinks('credit');
    });
    $('#giveaway_submission_link').click(function() {
        handleMenuLinks('giveaway_submission');
    });
    $('#settings_link').click(function() {
        handleMenuLinks('settings');
    });
	$('#time_link').click(function() {
		handleMenuLinks('time', getStreamStatus);
	});
	$('#leaderboards_link').click(function() {
		handleMenuLinks('leaderboards', getLeaderboards);
	});
    $('#announce_yes_button').click(function() {
        handleAnnounce(true);
    });
    $('#announce_no_button').click(function() {
        handleAnnounce(false);
    });
	$('#giveaway_new_action').click(function() {
		handleGiveawayNewAction();
	});
	$('#giveaway_claim_claim').click(function() {
		handleGiveawayClaimClaim();
	});
	$('#giveaway_claim_pass').click(function() {
		handleGiveawayClaimPass();
	});
	$('#soundbyte_search').on('keypress', function (e) {
        if(e.which === 13){
            $('#page').val("1");
            getSoundbytes($('#soundbyte_search').val(), $('#soundbyte_genre').val(), 1);
        }
    });
    $("#soundbyte_genre").change(function () {
        $('#soundbyte_search').val("");
        $('#page').html("1");
        $('#pag_left_button').fadeOut();
        $('#pag_right_button').fadeIn();
        getSoundbytes($('#soundbyte_search').val(), $('#soundbyte_genre').val(), 1);
    })
    $("#pag_left_button").click( function() {
        var page = parseInt($('#page').html());
        page -= 1;
        $('#page').html(page);
        getSoundbytes($('#soundbyte_search').val(), $('#soundbyte_genre').val(), page);
    });
    $("#pag_right_button").click( function() {
        var page = parseInt($('#page').html());
        page += 1;
        $('#page').html(page);
        getSoundbytes($('#soundbyte_search').val(), $('#soundbyte_genre').val(), page);
    });
    $('#refresh_stats').click(function(){
		if($("#soundbytes").is(':visible')) {
			getStats(true);
			alertSuccess("Doubloons & Soundbyte Credits Refreshed");
		} else if($('#wins_info').is(':visible')) {
			getWinnings();
			alertSuccess("Wins and !Games refreshed!");
		}
    });
	$("#leaderboard_type").change(function () {
		handleLeaderboardType($(this).children(":selected").attr("id"));
	});
});

var countdown;
function retryAuth() {
	if(payload.user_id) {
        $('#auth').fadeOut();
        $('#welcome').html("Logging you in...");
		$('#under_maintenance').fadeOut();
        setTimeout(authing(false), 2000);
    } else {
        $('#stats').fadeOut();
        $('#welcome').fadeIn();
        $('#auth').fadeIn();
        $('#auth_welcome').fadeOut();
        $('#soundbytes').fadeOut();
    }
}

function underMaintenance(entry, custom) {
	var divs = ['wins', 'credit', 'settings', 'giveaway_submission', 'auth_welcome', 'credit_info', 'giveaway_submission_info', 'wins_info', 'settings_info', 'time', 'soundbytes', 'leaderboards', 'messages', 'stats', 'welcome', 'leaderboards_info'];
	$.each(divs, function(ind, val) {
		$('#' + val).fadeOut();
	});
	$('#under_maintenance').fadeIn();
	$('#under_maintenance_entry').html(entry);
	$('#under_maintenance_custom').html(custom);
}

function handleRetryClick() {
	$('#under_maintenance_retry').attr("disabled", "disabled");
	countdown = setInterval(retryAuthCountdown, 1000);
	if(payload.user_id) {
        $('#auth').fadeOut();
        $('#welcome').html("Logging you in...");
        setTimeout(authing, 2000);
    } else {
        $('#stats').fadeOut();
        $('#welcome').fadeIn();
        $('#auth').fadeIn();
        $('#auth_welcome').fadeOut();
        $('#soundbytes').fadeOut();
    }
}

var cur = 30;
function retryAuthCountdown() {
	if(cur == 0) {
		clearInterval(countdown);
		cur = 30;
		$('#under_maintenance_retry').html("RETRY");
		$('#under_maintenance_retry').removeAttr("disabled");
	} else {
		cur -= 1;
		$('#under_maintenance_retry').html("RETRY(" + cur + ")");
	}
}

function authing(register = true) {
    getStats(false);
}

function authed(username, doubloons, soundbyte_credits, skipMsg) {
    authenticated = true;
    $('#stats').fadeIn();
    $('#welcome').fadeOut();
    $('#auth').fadeOut();
    $('#auth_welcome').fadeIn();
    $('#auth_welcome_msg').html("Hi " + username + "!");
    $('#doubloon_count').html(doubloons);
    $('#soundbyte_credit_count').html(soundbyte_credits);
    $('#soundbytes').fadeIn();
    $('#messages').fadeIn();
    $('#giveaway_submission_img').fadeIn();
    $('#giveaway_donator').val(username);
	$('#wins_img').fadeIn();
	$('#settings_img').fadeIn();
	$('#time_img').fadeIn();
	$('#leaderboards_img').fadeIn();
	$('#under_maintenance').fadeOut();
	$('#wins').fadeIn();
	$('#credit').fadeIn();
	$('#settings').fadeIn();
	$('#leaderboards').fadeIn();
	$('#time').fadeIn();
	$('#giveaway_submission').fadeIn();
    if(!skipMsg)
        alertSuccess("Successfully connected to your account!");
    getGenres();
    getSoundbytes("", "all", 1);
	getWinnings();
	if (!(localStorage.getItem("announce") === null)) {
		if(localStorage.getItem("announce") == "true") {
			handleAnnounce(true, false);
		} else {
			handleAnnounce(false, false);
		}
	}
}

function getStats(skipMsg) {
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
        success: function(data) {
            if(data.successful) {
                $('#pagination').fadeIn();
                username = data.username;
                authed(data.username, data.doubloons, data.soundbyte_credits, skipMsg);
            } else {
				handleErrorCodes(data);
                $('#pagination').fadeOut();
                alertFail(data.message);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			underMaintenance("Request to server failed.", "Unable to contact server. Too busy?")
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
                $('#pagination').fadeIn();
                var genres = data.genres;
                $('#soundbyte_genre').empty();
                $('#soundbyte_genre').append('<option selected="selected" value="all">All</option>');
                $.each(genres, function(ind, genre) {
                    $('#soundbyte_genre').append('<option value="' + genre.text + '">' + genre.text +'</option>');
                });
            } else {
				handleErrorCodes(data);
                $('#pagination').fadeOut();
                alertFail(data.message);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			underMaintenance("Request to server failed.", "Unable to contact server. Too busy?")
		}
    });
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
                $('#pagination').fadeIn();
                $('#soundbyte_table').empty();
                var soundbytes = data.soundbytes;
                if(data.page_left)
                    $('#pag_left_button').fadeIn();
                else
                    $('#pag_left_button').fadeOut();
                if(data.page_right)
                    $('#pag_right_button').fadeIn();
                else
                    $('#pag_right_button').fadeOut();
                $.each(soundbytes, function(ind, soundbyte) {
                    var soundbyteData = '<tr>\n' +
                        '                    <td class="info_cell">' + soundbyte.text + '</td>\n' +
                        '                    <td class="send_cell"><button type="button" class="btn_send" id="sb_' + soundbyte.id + '">Send!</button></td>\n' +
                        '                </tr>';
                    $('#soundbyte_table').append(soundbyteData);
                    $('#sb_' + soundbyte.id).on('click', function() {
                        sendSoundbyte(soundbyte.id);
                    });
                });
            } else {
				handleErrorCodes(data);
                $('#pagination').fadeOut();
                alertFail(data.message);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			underMaintenance("Request to server failed.", "Unable to contact server. Too busy?")
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
                alertSuccess("Soundbyte[" + soundbyteId + "] successfully sent!");
                getStats(true);
            } else {
				handleErrorCodes(data);
                alertFail(data.message);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			underMaintenance("Request to server failed.", "Unable to contact server. Too busy?")
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
				$('#raffle_wins').empty();
				$('#exgame_redemptions').empty();
                var raffleWins = data['raffle_wins'];
				var exgameRedemptions = data['exgame_redemptions'];
				$.each(raffleWins, function(id, win) {
					insertWinIntoTable('raffle_wins', win['game'], win['key'], win['date']);
				});
				$.each(exgameRedemptions, function(id, win) {
					insertWinIntoTable('exgame_redemptions', win['game'], win['key'], win['date']);
				});
            } else {
				handleErrorCodes(data);
                alertFail(data.message);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			underMaintenance("Request to server failed.", "Unable to contact server. Too busy?")
		}
    });
}

function insertWinIntoTable(table, game, key, date) {
	var row = "<tr><td><b>Name: </b>" + game + "<br><b>Key: </b>" + key + "<br><b>Date: </b>" + date + "</td></tr>";
	$('#' + table).append(row);
}

function insertExGamesIntoTable(id, game, donator) {
	var row = "<tr><td><b>Game: </b>" + game + "<br><b>Donator: </b>" + donator + "<br><b>Redeem: </b><a id=\"listing_" + id + "\" class=\"listing_redeem\" href=\"#\">Click Here...</a></td></tr>";
	$('#exgame_redeem').append(row);
}

var alertSuccessTimer;
function alertSuccess(msg) {
    $('#success_msg').html(msg);
    $('#fail').fadeOut();
    $('#success').fadeIn();
	alertSuccessTimer = setInterval(function() {
		clearInterval(alertSuccessTimer);
		$('#success').fadeOut();
	}, 10000);
}

var alertFailTimer;
function alertFail(msg) {
    $('#fail_msg').html(msg);
    $('#success').fadeOut();
    $('#fail').fadeIn();
	alertFailTimer = setInterval(function() {
		clearInterval(alertFailTimer);
		$('#fail').fadeOut();
	}, 10000);
}

function clearGiveawaySubmissionInputs() {
    $("#giveaway_name").val("");
    $("#giveaway_donator").val(username);
    $("#giveaway_data").val("");
    $("#giveaway_doubloons").val("0");
}

function submitGiveaway(name, donator, type, data, doubloons, non_sub_only) {
    name = btoa(name);
    donator = btoa(donator);
    data = btoa(data);
    $.ajax({
        url: base_api + "?action=giveawaySubmission&name=" + name + "&donator=" + donator + "&type=" + type + "&data=" + data + "&doubloons=" + doubloons + "&non_sub_only=" + non_sub_only,
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
                alertSuccess("Giveaway successfully submitted!");
                clearGiveawaySubmissionInputs();
            } else {
				handleErrorCodes(data);
                alertFail(data.message);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			underMaintenance("Request to server failed.", "Unable to contact server. Too busy?")
		}
    });
}

function getStreamStatus() {
	$.ajax({
	    url: "https://api.twitch.tv/kraken/streams/44338537",
	    dataType: 'json',
        headers: {
            'Client-ID': 'b0brhnzpw67833877v3uo8cf0k8o7p',
            'Accept': 'application/vnd.twitchtv.v5+json'
        },
        success: function(data) {
			if(data['stream'] == null)
				showStreamSchedule();
			else
				showStreamUptime(data['stream']['created_at'], data['stream']['game']);
		}
	});
}

var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function ordinal_suffix_of(i) {
    var j = i % 10,
        k = i % 100;
    if (j == 1 && k != 11) {
        return i + "st";
    }
    if (j == 2 && k != 12) {
        return i + "nd";
    }
    if (j == 3 && k != 13) {
        return i + "rd";
    }
    return i + "th";
}

function addDays(date, days) {
	var result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

function setStreamTime(date) {
	var result = new Date(date);
	result.setHours(22);
	result.setMinutes(0);
	result.setSeconds(0);
	return result;
}

function showStreamSchedule() {
	$('#time_stream').fadeOut();
	streamScheduleUpdate();
	if(upDownTimer == null)
		scheduleTimer = setInterval(streamScheduleUpdate, 1000);
	$('#time_schedule').fadeIn();
}

var scheduleTimer;
function streamScheduleUpdate() {
	//EST
    var offset = -5.0

    var clientDate = new Date();
    var utc = clientDate.getTime() + (clientDate.getTimezoneOffset() * 60000);

    var estDate = new Date(utc + (3600000*offset));
	
	if(estDate.getDay() == 0) {
		estDate = addDays(estDate, 1);
		startStr = monthNames[estDate.getMonth()] + " " + ordinal_suffix_of(estDate.getDate()) + ", " + estDate.getFullYear();
	} else {
		startStr = monthNames[estDate.getMonth()] + " " + ordinal_suffix_of(estDate.getDate()) + ", " + estDate.getFullYear();
		
	}
	
	var futureEstDate = setStreamTime(new Date(utc + (3600000*offset)));
	var diff = futureEstDate - estDate;
	
	var countdown = getTimeStringRawSeconds(parseInt(diff / 1000));
	
	$('#time_schedule_date').html(startStr);
	$('#time_schedule_countdown').html(countdown);
}

var streamStartUTCDate;
function showStreamUptime(streamCreatedDate, game) {
	$('#time_schedule').fadeOut();
	$('#time_stream_game').html("Loading...");
	$('#time_stream_duration').html("Loading...");
	$('#time_stream_completion_in').html("Loading...");
	var streamStartDate = new Date(streamCreatedDate);
	streamStartUTCDate = new Date(streamStartDate.getUTCFullYear(), streamStartDate.getUTCMonth(), streamStartDate.getUTCDate(),  streamStartDate.getUTCHours(), streamStartDate.getUTCMinutes(), streamStartDate.getUTCSeconds());
	
	if(upDownTimer == null) {
		displayUpAndDownTimes();
		upDownTimer = setInterval(displayUpAndDownTimes, 1000);
	}
	$('#time_stream_game').html(game);
	
	$('#time_stream').fadeIn();
}

var upDownTimer;
function displayUpAndDownTimes() {
	var expectedStreamDuration = (10 * 60 * 60 * 1000); // 10 hours
	var uptime = getUptimeDiff();
	var uptimeStr = getTimeString(uptime);
	var timeTillDown = expectedStreamDuration - uptime.getTime();
	var timeTillDownStr = (timeTillDown >= 0 ? getTimeString(new Date(timeTillDown)) : "Unknown");
	
	$('#time_stream_duration').html(uptimeStr);
	$('#time_stream_completion_in').html(timeTillDownStr);
}

function getUptimeDiff() {
	var streamCurrentDate = new Date(Date.now());
	var streamUTCDate = streamUTCDate = new Date(streamCurrentDate.getUTCFullYear(), streamCurrentDate.getUTCMonth(), streamCurrentDate.getUTCDate(),  streamCurrentDate.getUTCHours(), streamCurrentDate.getUTCMinutes(), streamCurrentDate.getUTCSeconds());
	
	return new Date(streamUTCDate.getTime() - streamStartUTCDate.getTime());
}

function getTimeString(seconds) {
	var hours = seconds.getUTCHours();
	var mins = seconds.getUTCMinutes();
	var secs = seconds.getUTCSeconds();
	
	var retStr = "";
	if(hours > 0)
		retStr = hours + " hour(s)";
	if(mins > 0) {
		if(retStr == "")
			retStr = mins + " minute(s)";
		else
			retStr += ",<br>" + mins + " minute(s)";
	}
	if(secs > 0) {
		if(retStr == "")
			retStr = secs + " second(s)";
		else
			retStr += ",<br>" + secs + " second(s)";
	}
	return retStr;
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
		retStr = hours + " hrs";
	}
	if(minutes > 0) {
		if(retStr == "")
			retStr = minutes + " mins";
		else
			retStr += ",<br>" + minutes + " mins";
	}
	if(seconds > 0) {
		if(retStr == "")
			retStr = seconds + " secs";
		else
			retStr += ",<br>" + seconds + " secs";
	}
	return retStr;
}

function handleAnnounce(res, set = true) {
	if(res) {
		$('#announce_yes_button').addClass("settings_button_selected");
		$('#announce_no_button').removeClass("settings_button_selected");
		$('#announce_yes_button').prop('disabled', true);
		$('#announce_no_button').prop('disabled', false);
		if(set)
			localStorage.setItem('announce', 'true');
	} else {
		$('#announce_no_button').addClass("settings_button_selected");
        $('#announce_yes_button').removeClass("settings_button_selected");
        $('#announce_yes_button').prop('disabled', false);
        $('#announce_no_button').prop('disabled', true);
		if(set)
			localStorage.setItem('announce', 'false');
	}
	announce = res;
}

function cleanMenuIcons() {
	$('#wins').find('img').attr('src', '../shared_assets/wins.png');
	$('#credit').find('img').attr('src', '../shared_assets/clippy.jpg');
	$('#settings').find('img').attr('src', '../shared_assets/gear.png');
	$('#giveaway_submission').find('img').attr('src', '../shared_assets/giveaway.png');
	$('#time').find('img').attr('src', '../shared_assets/clock.png');
	$('#leaderboards').find('img').attr('src', '../shared_assets/leaderboard.png');
	$('#stats').fadeIn();
	$('#messages').fadeIn();
}

function handleMenuLinks(clicked_on, callback = null) {
	var clicked_data = '#' + clicked_on + '_info';
	if($(clicked_data).is(':visible')) {
		if(clicked_data == "#wins_info") {
			$(clicked_data).hide();
		} else {
			$(clicked_data).fadeOut();
		}
		if(authenticated) {
			$('#soundbytes').fadeIn();
			cleanMenuIcons();
		}
	} else {
		$('#wins_info').fadeOut();
		$('#credit_info').fadeOut();
		$('#giveaway_submission_info').fadeOut();
		$('#settings_info').fadeOut();
		$('#time_info').fadeOut();
		$('#leaderboards_info').fadeOut();
		if(clicked_data == "#wins_info") {
			$('#soundbytes').hide();
		} else {
			$('#soundbytes').fadeOut();
		}
		$(clicked_data).fadeIn();
		cleanMenuIcons();
		$('#' + clicked_on).find('img').attr('src', '../shared_assets/soundbytes.png');
		if(clicked_on == "credit") {
			$('#stats').fadeOut();
			$('#messages').fadeOut();
		}
		if(callback != null)
			callback();
	}
}

function hideAllUIs() {
	$('#wins_info').fadeOut();
	$('#credit_info').fadeOut();
	$('#giveaway_submission_info').fadeOut();
	$('#settings_info').fadeOut();
	$('#soundbytes').fadeOut();
	$('#time_info').fadeOut();
	$('#soundbytes').fadeOut();
	$('#giveaway_new_info').fadeOut();
	$('#giveaway_claim_info').fadeOut();
}

function hideMenuLinks() {
	$('#wins').fadeOut();
	$('#credit').fadeOut();
	$('#giveaway_submission').fadeOut();
	$('#settings').fadeOut();
	$('#time').fadeOut();
	$('#leaderboards').fadeOut();
}

function showMenuLinks() {
	$('#wins').fadeIn();
	$('#credit').fadeIn(); 
	$('#giveaway_submission').fadeIn();
	$('#settings').fadeIn();
	$('#time').fadeIn();
	$('#leaderboards').fadeIn();
}

function handleErrorCodes(data) {
	switch(data.code) {
		case 1:
			underMaintenance(data.message, data.custom);
			break;
		default:
			break;
	}
}

var prevSoundbyteCreditCount = 0;
function handleRedeemToggle() {
	if($('#exgame_redemptions').is(':visible'))
		showExGames();
	else
		showExGameRedemptions();
}

function showExGames() {
	$('#soundbyte_credits').html("!Game Credits");
	prevSoundbyteCreditCount = $('#soundbyte_credit_count').html();
	$('#soundbyte_credit_count').html("");
	getAvailableExGames();
	$('#exgame_redemptions').fadeOut();
	$('#giveaway_wins_title').fadeOut();
	$('#exgame_redeem').removeClass("exgame_redeem_important");
	$('#exgame_redeem').addClass("exgame_redeem_height_important");
	$('#exgame_redeem').addClass("exgame_redeem");
	$('#raffle_wins').fadeOut();
	$('#redemptions_toggle').html("View !Game Redemptions");
	$('#exgames_title').html("Available !Games");
}

function showExGameRedemptions() {
	$('#soundbyte_credits').html("Soundbyte Credits");
	$('#soundbyte_credit_count').html(prevSoundbyteCreditCount);
	getWinnings();
	$('#exgame_redeem').addClass("exgame_redeem_important");
	$('#exgame_redeem').removeClass("exgame_redeem_height_important");
	$('#exgame_redeem').removeClass("exgame_redeem");
	$('#exgame_redemptions').fadeIn();
	$('#giveaway_wins_title').fadeIn();
	$('#raffle_wins').fadeIn();
	$('#redemptions_toggle').html("Redeem !Game");
	$('#exgames_title').html("!Game Redemptions");
}

function getAvailableExGames() {
	if(panel_token == null)
        return;
    $.ajax({
        url: base_api + '?action=available_exgames',
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
				$('#exgame_redemptions').empty();
                var availableExGames = data['available_exgames'];
				$.each(availableExGames, function(id, game) {
					insertExGamesIntoTable(game['id'], game['name'], game['donator']);
				});
				$('#soundbyte_credit_count').html(data['!game_credits']);
            } else {
				handleErrorCodes(data);
                alertFail(data.message);
            }
        }
    });
}

function handleExGameRedeem(idStr) {
	var id = idStr.slice(8);
	$.ajax({
        url: base_api + '?action=redeem_exgame&id=' + id,
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
				alertSuccess("Successfully redeemed !Game");
				showExGameRedemptions();
            } else {
				handleErrorCodes(data);
                alertFail(data.message);
            }
        }
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
		alertFail("Awaiting update from orchestrator...");
	} else {
		giveawayEndsIn -= 1;
		$('#giveaway_new_remaining').html(getTimeStringRawSeconds(giveawayEndsIn));
	}
}

function handleGiveawayNew(payload) {
	giveawayId = payload['id'];
	giveawayEndsIn = parseInt(payload['ends_in']);
	hideAllUIs();
	hideMenuLinks();
	$('#giveaway_new_name').html(payload['name']);
	$('#giveaway_claim_name').html(payload['name']);
	$('#giveaway_new_author').html(payload['author']);
	$('#giveaway_claim_author').html(payload['author']);
	$('#giveaway_new_remaining').html(getTimeStringRawSeconds(payload['ends_in']));
	$('#giveaway_new_info').fadeIn();
	if(giveawayEndsInTimerRunning == false) {
		giveawayEndsInTimer = setInterval(function() { giveawayEndsInCountdown(); }, 1000);
		giveawayEndsInTimerRunning = true;
	}
}

var claimEndsIn = 0;
var claimEndsInTimer;
var claimEndsInTimerRunning = false;
function claimEndsInCountdown() {
	if(claimEndsIn == 0) {
		clearInterval(claimEndsInTimer);
		claimEndsInTimerRunning = false;
		alertFail("Awaiting update from orchestrator...");
	} else {
		claimEndsIn -= 1;
		$('#giveaway_claim_remaining').html(getTimeStringRawSeconds(claimEndsIn));
	}
}

function handleGiveawayClaim(payload) {
	hideAllUIs();
	giveawayId = payload['id'];
	$('#giveaway_claim_name').html(payload['name']);
	$('#giveaway_claim_author').html(payload['author']);
	claimEndsIn = parseInt(payload['ends_in']);
	$('#giveaway_claim_winner').html(payload['winner']);
	$('#giveaway_claim_remaining').html(getTimeStringRawSeconds(claimEndsIn));
	if(payload['winner'].toLowerCase() == username.toLowerCase()) {
		$('#giveaway_claim_claim').fadeIn();
		$('#giveaway_claim_pass').fadeIn();
		alertSuccess("You won the raffle! Claim it!");
	} else {
		$('#giveaway_claim_claim').fadeOut();
		$('#giveaway_claim_pass').fadeOut();
		alertFail(payload['winner'] + " won the raffle!");
	}
	$('#giveaway_claim_info').fadeIn();
	if(claimEndsInTimerRunning == false) {
		claimEndsInTimer = setInterval(function() { claimEndsInCountdown(); }, 1000);
		claimEndsInTimerRunning = true;
	}
}

function handleGiveawayClear(payload) {
	clearInterval(claimEndsInTimer);
	clearInterval(giveawayEndsInTimer);
	claimEndsInTimerRunning = false;
	giveawayEndsInTimerRunning = false;
	claimEndsIn = 0;
	giveawayEndsIn = 0;
	$('#giveaway_claim_claim').fadeOut();
	$('#giveaway_claim_pass').fadeOut();
	hideAllUIs();
	$('#giveaway_new_action').removeClass("giveaway_new_action_leave");
	$('#giveaway_new_action').addClass("giveaway_new_action_enter");
	$('#giveaway_new_action').html("Enter Giveaway!");
	showMenuLinks();
	if(payload.hasOwnProperty("optional_arg")) {
		var arg = payload["optional_arg"];
		var val = payload["optional_arg_value"];
		switch(arg) {
			case "won":
				alertSuccess(val + " has won and claimed!");
				break;
			default:
				alertSuccess("Giveaway has ended!");
				break;
		}
	} else {
		alertSuccess("Giveaway has ended!");
	}
	
	$('#soundbytes').fadeIn();
	
}

var cooldownTimer;
var cooldown = 20;
function giveawayNewActionCooldown() {
	if(cooldown == 0) {
		clearInterval(cooldownTimer);
		cooldown = 20;
		if($('#giveaway_new_action').hasClass("giveaway_new_action_enter")) {
			$('#giveaway_new_action').html("Enter Giveaway!");
		} else {
			$('#giveaway_new_action').html("Leave Giveaway!")
		}
		$('#giveaway_new_action').prop("disabled", false);
	} else {
		cooldown -= 1;
		if($('#giveaway_new_action').hasClass("giveaway_new_action_enter")) {
			$('#giveaway_new_action').html("Enter Giveaway! [" + cooldown + "]");
		} else {
			$('#giveaway_new_action').html("Leave Giveaway! [" + cooldown + "]")
		}
	}
}
function handleGiveawayNewAction() {
	if($('#giveaway_new_action').html() == "Enter Giveaway!") {
		giveawayEnter(giveawayId);
		$('#giveaway_new_action').removeClass("giveaway_new_action_enter");
		$('#giveaway_new_action').addClass("giveaway_new_action_leave");
		$('#giveaway_new_action').html("Leave Giveaway!");
		
	} else {
		giveawayLeave(giveawayId);
		$('#giveaway_new_action').removeClass("giveaway_new_action_leave");
		$('#giveaway_new_action').addClass("giveaway_new_action_enter");
		$('#giveaway_new_action').html("Enter Giveaway!");
	}
	$('#giveaway_new_action').prop("disabled", true);
	cooldownTimer = setInterval(function() { giveawayNewActionCooldown(); }, 1000);
}

function handleGiveawayClaimClaim() {
	giveawayClaim(giveawayId);
}

function handleGiveawayClaimPass() {
	giveawayPass(giveawayId);
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
                alertSuccess("Successfully entered giveaway!");
            } else {
				handleErrorCodes(data);
                alertFail(data.message);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			underMaintenance("Request to server failed.", "Unable to contact server. Too busy?")
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
                alertSuccess("Successfully left giveaway!");
            } else {
				handleErrorCodes(data);
                alertFail(data.message);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			underMaintenance("Request to server failed.", "Unable to contact server. Too busy?")
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
                alertSuccess("Successfully passed giveaway!");
            } else {
				handleErrorCodes(data);
                alertFail(data.message);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			underMaintenance("Request to server failed.", "Unable to contact server. Too busy?")
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
                alertSuccess("Successfully claimed giveaway!");
            } else {
				handleErrorCodes(data);
                alertFail(data.message);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			underMaintenance("Request to server failed.", "Unable to contact server. Too busy?")
		}
    });
}

function populateLeaderboardTable(kvps, images = false, dollar = false, useVal = false) {
	$("#leaderboard_table tr").remove();

	$.each(kvps, function(key, value) {
		var row;
		if(images) {
			row = "<tr><td><img class=\"leaderboard_emote_img\" src=\"https://static-cdn.jtvnw.net/emoticons/v1/" + value[0] + "/3.0\"></td><td class=\"leaderboard_value \">" + value[1] + "</td></tr>";
		} else {
			var k = key;
			var v = value;
			if(useVal) {
				k = value[0];
				v = value[1];
			}
			if(dollar) {
				row = "<tr><td>" + k + "</td><td class=\"leaderboard_value\">$" + v + "</td></tr>";
			} else {
				row = "<tr><td>" + k + "</td><td class=\"leaderboard_value\">" + v + "</td></tr>";
			}
		}
		$('#leaderboard_table').append(row);
	});
}

var donations;
var giveawayWins;
var giveawayDonations;
var emoteUsage;
var emoteIds;
var giveawayWinPairs = [];
function getLeaderboards() {
	var url = base_api + '?action=leaderboards';
	
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
                donations = data['leaderboards']['donations'];
				giveawayWins = data['leaderboards']['giveaway_wins'];
				giveawayDonations = data['leaderboards']['giveaway_donations'];
				emoteUsage = data['leaderboards']['emote_usage'];
				
				if(emoteIds == null) {
					getEmoteIds();
				}
				if(giveawayWinPairs.length == 0) {
					var gdIds = [];
					for(var key in giveawayWins) {
						gdIds.push(key);
					}
					getGiveawayWinsNames(gdIds);
				}
				$("#leaderboard_type").val($("#leaderboard_type option:first").val());
				populateLeaderboardTable(donations, false, true);
            } else {
				handleErrorCodes(data);
                alertFail(data.message);
            }
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			underMaintenance("Request to server failed.", "Unable to contact server. Too busy?")
		}
    });
}

function getEmoteIds() {
	var url = 'https://api.twitch.tv/kraken/chat/emoticon_images?emotesets=5628&client_id=b0brhnzpw67833877v3uo8cf0k8o7p';
	
	$.ajax({
        url: url,
        type: 'get',
        headers: {
            accept: "application/json"
        },
        dataType: 'json',
        success: function(data) {
            var emotes = {};
			var p = data['emoticon_sets']['5628'];
			$.each(p, function(id, emote) {
				var code = emote['code'];
				var id = emote['id'];
				emotes[code.toLowerCase()] = id;
			});
			emoteIds = emotes;
        }
    });
}

function prepareEmotes() {
	var emotes = {};
	$.each(emoteUsage, function(ind, emote) {
		Object.keys(emoteIds).forEach(function(emote1,id) {
			if(emote1 == emote['emote']) {
				var tId = emoteIds[emote1];
				emotes[tId] = emote['amount'];
			}
		});
	});
	var sortable = [];
	for(var emote in emotes) {
		sortable.push([emote, emotes[emote]]);
	}
	sortable.sort(function(a, b) {
		return a[1] - b[1];
	});
	return sortable.reverse();
}

function prepareWins() {
	var wins = [];
	for(var key in giveawayWins) {
		for(var pair in giveawayWinPairs) {
			if(key == giveawayWinPairs[pair][0]) {
				wins.push([giveawayWinPairs[pair][1], giveawayWins[key]]);
			}
		}
	}
	
	wins.sort(function(a, b) {
		return a[1] - b[1];
	});
	return wins.reverse();
}

function handleLeaderboardType(id) {
	switch(id) {
		case "money_donations":
			populateLeaderboardTable(donations, false, true);
			break;
		case "giveaway_wins":
			var wins = prepareWins();
			populateLeaderboardTable(wins, false, false, true);
			break;
		case "giveaway_donations":
			populateLeaderboardTable(giveawayDonations, false, false);
			break;
		case "emote_usage":
			var emotes = prepareEmotes();
			populateLeaderboardTable(emotes, true, false);
			break;
		default:
			break;
	}
}

function getGiveawayWinsNames(ids) {
	var url = "https://api.twitch.tv/helix/users";
	var queryString = "";
	$.each(ids, function(ind, id) {
		if(queryString == "") {
			queryString = "?id=" + id;
		} else {
			queryString += "&id=" + id;
		}
	});
	
	$.ajax({
        url: url + queryString,
        type: 'get',
        headers: {
            accept: "application/json",
			'Client-ID': "b0brhnzpw67833877v3uo8cf0k8o7p"
        },
        dataType: 'json',
        success: function(data) {
            var d = data['data'];
			$.each(d, function(ind, obj) {
				giveawayWinPairs.push([obj['id'], obj['login']]);
			});
        }
    });
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