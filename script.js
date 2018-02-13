var panel_token;
var announce = true;
var authenticated = false;
var version = 4;
var username;
var base_api = "https://burkeblack.tv/extensions/burkes_booty/api.php";

window.Twitch.ext.onAuthorized(function(auth) {
    panel_token = auth.token;
    var sections = auth.token.split('.');
    var payload = JSON.parse(window.atob(sections[1]));
    if(payload.user_id) {
        $('#auth').hide();
        $('#welcome').html("Logging you in...");
        setTimeout(authing, 2000);
    } else {
        $('#stats').hide();
        $('#welcome').show();
        $('#auth').show();
        $('#auth_welcome').hide();
        $('#soundbytes').hide();
    }
});

window.Twitch.ext.onError(function(error) {
    //console.log("Burke's Booty Error:" + error);
});

$(document).ready(function() {
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
    $('#announce_yes_button').click(function() {
        handleAnnounce(true);
    });
    $('#announce_no_button').click(function() {
        handleAnnounce(false);
    });
});

function registerEvents() {
    $('#soundbyte_search').on('keypress', function (e) {
        if(e.which === 13){
            $('#page').val("1");
            getSoundbytes($('#soundbyte_search').val(), $('#soundbyte_genre').val(), 1);
        }
    });
    $("#soundbyte_genre").change(function () {
        $('#soundbyte_search').val("");
        $('#page').html("1");
        $('#pag_left_button').hide();
        $('#pag_right_button').show();
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
			alertSuccess("Doubloon/soundbyte credits refreshed!");
		} else if($('#wins_info').is(':visible')) {
			getWinnings();
			alertSuccess("Raffle and !Games refreshed!");
		}
    });
}

function authing() {
    getStats(false);
    registerEvents();
}

function authed(username, doubloons, soundbyte_credits, skipMsg) {
    authenticated = true;
    $('#stats').show();
    $('#welcome').hide();
    $('#auth').hide();
    $('#auth_welcome').show();
    $('#auth_welcome_msg').html("Hello " + username + "!");
    $('#doubloon_count').html(doubloons);
    $('#soundbyte_credit_count').html(soundbyte_credits);
    $('#soundbytes').show();
    $('#messages').show();
    $('#giveaway_submission_img').show();
    $('#giveaway_donator').val(username);
	$('#wins_img').show();
	$('#settings_img').show();
    if(!skipMsg)
        alertSuccess("Successfully connected to your account!");
    getGenres();
    getSoundbytes("", "all", 1);
	getWinnings();
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
            version: version
        },
        dataType: 'json',
        success: function(data) {;
            if(data.successful) {
                $('#pagination').show();
                username = data.username;
                authed(data.username, data.doubloons, data.soundbyte_credits, skipMsg);
            } else {
                $('#pagination').hide();
                alertFail(data.message);
            }
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
            version: version
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
                $('#pagination').show();
                var genres = data.genres;
                $('#soundbyte_genre').empty();
                $('#soundbyte_genre').append('<option selected="selected" value="all">All</option>');
                $.each(genres, function(ind, genre) {
                    $('#soundbyte_genre').append('<option value="' + genre.text + '">' + genre.text +'</option>');
                });
            } else {
                $('#pagination').hide();
                alertFail(data.message);
            }
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
            version: version
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
                $('#pagination').show();
                $('#soundbyte_Table_body').empty();
                var soundbytes = data.soundbytes;
                if(data.page_left)
                    $('#pag_left_button').show();
                else
                    $('#pag_left_button').hide();
                if(data.page_right)
                    $('#pag_right_button').show();
                else
                    $('#pag_right_button').hide();
                $.each(soundbytes, function(ind, soundbyte) {
                    var soundbyteData = '<tr>\n' +
                        '                    <td>' + soundbyte.text + '</td>\n' +
                        '                    <td class="send_cell"><button type="button" class="btn_send" id="sb_' + soundbyte.id + '">Send!</button></td>\n' +
                        '                </tr>';
                    $('#soundbyte_Table_body').append(soundbyteData);
                    $('#sb_' + soundbyte.id).on('click', function() {
                        sendSoundbyte(soundbyte.id);
                    });
                });
            } else {
                $('#pagination').hide();
                alertFail(data.message);
            }
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
            version: version
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
                alertSuccess("Soundbyte[" + soundbyteId + "] successfully sent!");
                getStats(true);
            } else {
                alertFail(data.message);
            }
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
            version: version
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
                alertFail(data.message);
            }
        }
    });
}

function insertWinIntoTable(table, game, key, date) {
	var row = "<tr><td><b>Name: </b>" + game + "<br><b>Key: </b>" + key + "<br><b>Date: </b>" + date + "</td></tr>";
	$('#' + table).append(row);
}

function alertSuccess(msg) {
    $('#success_msg').html(msg);
    $('#fail').hide();
    $('#success').show();
}

function alertFail(msg) {
    $('#fail_msg').html(msg);
    $('#success').hide();
    $('#fail').show();
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
            version: version
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
                alertSuccess("Giveaway successfully submitted!");
                clearGiveawaySubmissionInputs();
            } else {
                alertFail(data.message);
            }
        }
    });
}

function handleAnnounce(res) {
	if(res) {
		$('#announce_yes_button').addClass("settings_button_selected");
		$('#announce_no_button').removeClass("settings_button_selected");
		$('#announce_yes_button').prop('disabled', true);
		$('#announce_no_button').prop('disabled', false);
	} else {
		$('#announce_no_button').addClass("settings_button_selected");
        $('#announce_yes_button').removeClass("settings_button_selected");
        $('#announce_yes_button').prop('disabled', false);
        $('#announce_no_button').prop('disabled', true);
	}
	announce = res;
}

function handleMenuLinks(clicked_on) {
	var clicked_data = '#' + clicked_on + '_info';
	if($(clicked_data).is(':visible')) {
		$(clicked_data).hide();
		$('#soundbytes').show();
	} else {
		$('#wins_info').hide();
		$('#credit_info').hide();
		$('#giveaway_submission_info').hide();
		$('#settings_info').hide();
		$('#soundbytes').hide();
		$(clicked_data).show();
	}
}