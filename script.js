var panel_token;
var announce = true;
var authenticated = false;

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
    console.log("Burke's Booty Error:" + error);
});

$(document).ready(function() {
    $('#credit_link').click(function() {
        console.log("fired");
        if($('#credit_info').is(":visible")) {
            if(!($('#soundbytes').is(":visible")) && authed) {
                $('#soundbytes').show();
            }
            $('#credit_info').hide();
        } else {
            $('#soundbytes').hide();
            $('#credit_info').show();
        }
    });
    $('#settings_link').click(function() {
        if($('#settings_info').is(":visible")) {
            $('#settings_info').hide();
            if(!($('#soundbytes').is(":visible")) && authed) {
                $('#soundbytes').show();
            }
        } else {
            $('#settings_info').show();
            $('#soundbytes').hide();
        }
    });
    $('#announce_yes_button').click(function() {
        $('#announce_yes_button').addClass("settings_button_selected");
        $('#announce_no_button').removeClass("settings_button_selected");
        $('#announce_yes_button').prop('disabled', true);
        $('#announce_no_button').prop('disabled', false);
        announce = true;
    });
    $('#announce_no_button').click(function() {
        $('#announce_no_button').addClass("settings_button_selected");
        $('#announce_yes_button').removeClass("settings_button_selected");
        $('#announce_yes_button').prop('disabled', false);
        $('#announce_no_button').prop('disabled', true);
        announce = false;
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
       getStats();
    });
}

function authing() {
    getStats();
    registerEvents();
}

function authed(username, doubloons, soundbyte_credits) {
    authenticated = true;
    $('#stats').show();
    $('#welcome').hide();
    $('#auth').hide();
    $('#auth_welcome').show();
    $('#auth_welcome_msg').html("Hello " + username + "!");
    $('#doubloon_count').html(doubloons);
    $('#soundbyte_credit_count').html(soundbyte_credits);
    $('#soundbytes').show();
    alertSuccess("Successfully connected to your account!");
    getGenres();
    getSoundbytes("", "all", 1);
}

function getStats() {
    if(panel_token == null)
        return;
    $.ajax({
        url: 'https://burkeblack.tv/extensions/burkes_booty/api.php?action=stats',
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json"
        },
        dataType: 'json',
        success: function(data) {;
            if(data.successful) {
                $('#pagination').show();
                authed(data.username, data.doubloons, data.soundbyte_credits);
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
        url: 'https://burkeblack.tv/extensions/burkes_booty/api.php?action=genres',
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json"
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
        url: 'https://burkeblack.tv/extensions/burkes_booty/api.php?action=soundbytes&search_text=' + searchText + '&search_genre=' + searchGenre + '&page=' + page,
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json"
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
    var url;
    if(announce)
        url = 'https://burkeblack.tv/extensions/burkes_booty/api.php?action=sendSoundbyte&soundbyteId=' + soundbyteId + '&announce=1';
    else
        url = 'https://burkeblack.tv/extensions/burkes_booty/api.php?action=sendSoundbyte&soundbyteId=' + soundbyteId + '&announce=0';

    $.ajax({
        url: url,
        type: 'get',
        headers: {
            "x-extension-jwt": panel_token,
            accept: "application/json"
        },
        dataType: 'json',
        success: function(data) {
            if(data.successful) {
                alertSuccess("Soundbyte[" + soundbyteId + "] successfully sent!");
                getStats();
            } else {
                alertFail(data.message);
            }
        }
    });
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