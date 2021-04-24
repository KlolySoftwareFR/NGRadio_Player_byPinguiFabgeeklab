var NgPlayer = {};
var duration = 0;
var start = 0;
var extended = false;
var inAnimation = false;
var active = true;

var scale = 1;

var artist;
var title;
var cover;

NgPlayer.APIKEY = "5101972e-bb26-4dc9-906c-18e41cbcb8a9";
NgPlayer.RADIOUID = "547de110-b968-4051-81f5-b52bc7aff656";
NgPlayer.p = document.getElementById("ng-radio");
NgPlayer.played = false;
NgPlayer.onVolume = false;
NgPlayer.onLive = false;
NgPlayer.streamer = "";
NgPlayer.getInfos = function(update_title=false) {
    $.getJSON("https://apiv2.nationsglory.fr/radio/api", function(obj) {
        var old = (transformTitle(obj[0].now_playing.song.title) == title) && (transformArtist(obj[0].now_playing.song.artist) == artist)

        console.log("Update");

        if(old) return;

        console.log("Query")

        title = transformTitle(obj[0].now_playing.song.title);
        artist = transformArtist(obj[0].now_playing.song.artist);
        var title_next = transformTitle(obj[0].playing_next.song.title);
        var artist_next = transformArtist(obj[0].playing_next.song.artist);
        var title_previous = transformTitle(obj[0].song_history[0].song.title);
        var artist_previous = transformArtist(obj[0].song_history[0].song.artist);
        var cover = transformCover(artist, obj[0].now_playing.song.art);
        var cover_next = transformCover(artist_next, obj[0].playing_next.song.art);
        var cover_previous = transformCover(artist_previous, obj[0].song_history[0].song.art);
        var listeners = obj[0].listeners.current;
        duration = obj[0].now_playing.duration;
        var elapsed = obj[0].now_playing.elapsed;
        start = Date.now() - (obj[0].now_playing.elapsed)*1000;
        var live = obj[0].live.is_live;
        var streamer = obj[0].live.streamer_name;

        NgPlayer.streamer = streamer;
        NgPlayer.onLive = live;
        
        if (update_title == true) {
            var liveSymb = '🔴';
            liveSymb = "En direct de "

            if (live == true) {
                document.title = liveSymb + " " + streamer + " | NGRadio";
                $('meta[property="og:title"]').attr("content", liveSymb + " " + streamer + " | NGRadio");
            } else {
                document.title = (artist == '' ? "" : artist + " - ") + title + " | NGRadio";
                $('meta[property="og:title"]').attr("content", (artist == '' ? "" : artist + " - ") + title + " | NGRadio");
            }
        }
        $("#artist").html(title == "Publicité" ? "Retour dans quelques instants..." : artist);
        $("#title").html(title);
        $("#left-artist").html(artist_previous);
        $("#left-title").html(title_previous);
        $("#right-artist").html(artist_next);
        $("#right-title").html(title_next);

        $("#listeners").html(listeners + " auditeurs");
        $("#stream").html(NgPlayer.onLive ? "  En direct ● Animé par " + streamer : "");
        $("#stream").css("visibility", NgPlayer.onLive ? "visible" : "hidden");

        if(active) {
            selectedIndex += 1;
            setTimeout(function() {
                rotateCarousel();
            },1000); 
        }

        $("#cover" + selectedIndex%4).css("background-image", "url(" + cover + ")");
        $("#cover" + selectedIndex%4).css("background-image", "url(" + cover.replace("http://", "https://") + ")");
        $("#cover" + selectedIndex%4).attr('title', title + " - " + artist);

        $("#background").css("background-image", "url(" + cover + ")");
        $("#background").css("background-image", "url(" + cover.replace("http://", "https://") + ")");

        $("#left-cover").css("background-image","url(" +  cover_previous + ")");
        $("#left-cover").css("background-image", "url(" + cover_previous.replace("http://", "https://") + ")");
        $("#left-cover").attr('title', title_previous + " - " + artist_previous);

        $("#right-cover").css("background-image", "url(" + cover_next + ")");
        $("#right-cover").css("background-image", "url(" + cover_next.replace("http://", "https://") + ")");
        $("#right-cover").attr('title', title_next + " - " + artist_next);

        if(!old && !NgPlayer.onLive) {
            $("#duration-bar").css("transition", "width 0s");
            $("#duration-bar").css("width", "0%");
            $("#duration-bar").animate({
                width: (Math.min(elapsed / duration, 1)*100) + "%"
            },1000, "swing")
            $("#duration-bar").css("transition", "width 1s");
        }

        if (live == true) {
            $('.topbar--radio-player--current').addClass('is-active');
            $('.player-content').addClass('is-active');
            var message = document.createElement("button");
            message.id = "message";
            message.classList = ["mdi mdi-email"]
            if($("#message").length == 0) $("#buttons").prepend(message);
        } else {
            if($("#message").length != 0) $("#message").remove();
        }

        resize();

        if ('mediaSession'in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: artist,
                album: title,
                artwork: [{
                    src: cover,
                    sizes: '96x96',
                    type: 'image/png'
                }, {
                    src: cover,
                    sizes: '128x128',
                    type: 'image/png'
                }, {
                    src: cover,
                    sizes: '192x192',
                    type: 'image/png'
                }, {
                    src: cover,
                    sizes: '256x256',
                    type: 'image/png'
                }, {
                    src: cover,
                    sizes: '384x384',
                    type: 'image/png'
                }, {
                    src: cover,
                    sizes: '512x512',
                    type: 'image/png'
                }, ]
            });
        }
    });
};

function ng_player_init_mini() {
    NgPlayer.getInfos(true);
    setInterval(function() {
        counterbeforerefresh(true)
    }, 1000);


    var volume = document.cookie.split(";")[0].substring(7);

    setVolume(volume);

    $("#play-pause").click(function() {
        play_pause();
    });
    
    $('#volume-bar-container').mousedown(function(e) {
        e.preventDefault();
        NgPlayer.onVolume = true;
        
        var percent = (e.clientX - $(this).offset().left) / ($(this).width()*scale);

        setVolume(percent);
    });

    document.addEventListener(visibilityChange, handleVisibilityChange, false);

    $(document).mousemove( function(event) {
        event.preventDefault();
        if (NgPlayer.onVolume) {
            mousePosition = {
                x : event.clientX,
                y : event.clientY
            };

            var percent = Math.max(0, Math.min(1, (mousePosition.x - $('#volume-bar').offset().left)/((parseFloat($('#volume-bar-container').css("width")))*scale)));

            $('#volume-bar').css("width", percent*100 + "%");
            applyVolume(percent);
        }
    });


    $(window).mouseup(function() {
        NgPlayer.onVolume = false;
    });

    $(window).resize(function() {
        resize();
    });

    resize();

    $("#message").click(function() {
        alert("WIP");
    });

    $("#youtube").click(function() {
        if(artist == "NGRadio" || artist == "") return;

        var query = (title + "+" + artist).split(" ").join("+").replace(/&/g, "et");
        window.open("https://www.youtube.com/results?search_query=" + query);
    });

    $("#planning").click(function() {
        window.open("https://nationsglory.fr/radio");
    });

    $(".dedi-send").click(function(e) {
        e.preventDefault();
        var message = $('#dedi-content').val();
        $.post('https://nationsglory.fr/player//internal_api?action=postdedi', {
            message: message
        }, function(data) {
            if (data.error === 'posted') {
                $('#dediModal').modal('toggle');
                Swal({
                    position: 'bottom-start',
                    type: 'success',
                    title: 'Dédicace envoyée ! 🎉',
                    toast: true,
                    showConfirmButton: false,
                    timer: 2000
                });
            }
            if (data.error === 'banned') {
                Swal({
                    position: 'bottom-start',
                    type: 'error',
                    title: 'Vous êtes banni !',
                    toast: true,
                    showConfirmButton: false,
                    timer: 2000
                });
            }
            if (data.error === 'dedi.not.open') {
                Swal({
                    position: 'bottom-start',
                    type: 'error',
                    title: 'Les dédicace sont fermées 😥',
                    toast: true,
                    showConfirmButton: false,
                    timer: 2000
                });
            }
        });
    });
}

function play_pause() {
    console.log("Click");

    if(NgPlayer.played) {
        $("#play-pause").removeClass("mdi-pause");
        $("#play-pause").addClass("mdi-play");
        NgPlayer.p.pause();
    } else {
        $("#play-pause").removeClass("mdi-play");
        $("#play-pause").addClass("mdi-pause");
        NgPlayer.p.load();
        NgPlayer.p.play();
        var volume = $("#volume-bar").width() / $("#volume-bar-container").width();
        setVolume(volume);
    }

    NgPlayer.played = !NgPlayer.played;
}

function setVolume(volume) {
    if (volume < 0)
        volume = 0;
    if (volume > 1)
        volume = 1;

    var time = Math.round(Math.abs(volume - ($('#volume-bar').width() / $('#volume-bar-container').width())) * 200);

    $('#volume-bar').animate({
        width: Math.round(volume * 100) + "%"
    }, time, "swing");

    applyVolume(volume);
}

function applyVolume(volume) {
    var finalVolume = Math.log(1+Math.E*volume)/Math.log(Math.E);
    console.log(finalVolume);
    finalVolume = Math.min(1, Math.max(0, finalVolume));
    NgPlayer.p.volume = finalVolume;
    document.cookie = "volume=" + volume;
}

function extend(force) {

    if(!extended && NgPlayer.onLive) return;

    if(inAnimation) return;

    if(extended || force) {
        $("#display").addClass("mdi-arrow-expand-horizontal");
        $("#display").removeClass("mdi-arrow-collapse-horizontal");
        $("#left-panel").css("animation", "right-movement 1s");
        $("#right-panel").css("animation", "left-movement 1s");
        inAnimation = true;
        setTimeout(function() {
            $("#right-panel").addClass("hide");
            $("#left-panel").addClass("hide");
        }, 500);
        setTimeout(function() {
            $("#right-panel").css("animation", "");
            $("#left-panel").css("animation", "");
            inAnimation = false;
        },1000);
    } else {
        $("#display").addClass("mdi-arrow-collapse-horizontal");
        $("#display").removeClass("mdi-arrow-expand-horizontal");
        $("#left-panel").removeClass("hide");
        $("#right-panel").removeClass("hide");
        $("#right-panel").css("animation", "left-movement 1s reverse");
        $("#left-panel").css("animation", "right-movement 1s reverse");
        inAnimation = true;
        setTimeout(function() {
            $("#right-panel").css("animation", "");
            $("#left-panel").css("animation", "");
            inAnimation = false;
        }, 1000);
        
    }

    extended = !extended;
}

var selectedIndex = 0;
var afkIndex = 0;

function rotateCarousel() {
    var angle = selectedIndex / 4 * -360;
    document.getElementById("carousel").style.transform = 'translateZ(-210px) rotateY(' + angle + 'deg)';
  }

function createDisplay() {
    var display = document.createElement("button");
    display.id = "display";
    var icon = extended ? "mdi-arrow-collapse-horizontal" : "mdi-arrow-expand-horizontal"
    display.classList = ["mdi " + icon];
    if($("#display").length == 0) {
        $("#buttons").append(display);
        $("#display").click(function() {
            extend();
        });
    }
}

function resize() {
    if($(window).width() < 1200 || NgPlayer.onLive) {
        if($("#display").length != 0) {
            $("#display").remove();
        }
    } else {
        createDisplay();
    }

    scale = 0.8*Math.min( 
        parseInt($("body").css("width")) / parseInt($(".main-container").css("width")), 
        parseInt($("body").css("height")) / parseInt($(".main-container").css("height")));
    
    console.log(scale + " " + $(".main-container").css("width") + " " + $("body").css("height"));

    $("#center-panel").css("transform", "scale(" + scale + ")");
    $("#left-panel").css("transform", "scale(" + scale + ")");
    $("#right-panel").css("transform", "scale(" + scale + ")");

}

function counterbeforerefresh(update_title=false) {
    var elapsed = (Date.now() - start)/1000;  

    $('#player-content--current-elapsed').val(elapsed);

    if ((elapsed >= duration || Math.floor(elapsed) == Math.floor(duration)-3) && duration != 0 && !NgPlayer.onLive) {
        if (update_title == true) {
            NgPlayer.getInfos(true);
        } else {
            NgPlayer.getInfos(false);
        }

        return;
    }

    if(NgPlayer.onLive && Math.floor(elapsed)%20 == 0) {
        NgPlayer.getInfos(true);
    }

    if(NgPlayer.onLive || duration == 0) {
        $("#duration-bar").css("width", "0%");
    } else {
        var progress = Math.min(elapsed / duration, 1);

        $("#duration-bar").css("width", progress*100 + "%");

        var width = Math.max(parseInt($("#duration-bar").css("width"))-50, 0);

        $("#duration-bar").css("background-image", "linear-gradient(0.25turn, rgba(255,255,255,0.25), #ffffff " + width + "px)");
    }
}

$( document ).ready(function() {
    ng_player_init_mini();
});

function transformTitle(title) {
    if (title == '') {
        var title = 'NGRadio';
    } else if (title == 'Advert:') {
        var title = "Publicité";
    } else if(title.includes("Jingle")) {
        var title = "Jingle";
    }
    return title;
}

function transformArtist(artist) {
    if (artist == '') {
        var artist = 'Chargement...';
    } else if (artist == 'Advert:') {
        var artist = '';
    } else if(artist == "NationsGlory") {
        var artist = 'NGRadio';
    }

    var artist = artist.replace(/;/g, ', ');
    return artist;
}

function transformCover(artist, cover) {
    if (cover == '') {
        var cover = 'static/ngradio.png';
    }

    if(NgPlayer.onLive) {
        if(new Date().getHours() == 10 && NgPlayer.streamer == "xuarig ") {
            var cover = 'static/power.png';
        }
    
        if(new Date().getHours() == 9 && NgPlayer.streamer == "Fabgeeklab ") {
            var cover = "static/MorningGlory.png"
        }
    }

    return cover;
}

var hidden, visibilityChange; 
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

function handleVisibilityChange() {
    if (document[hidden]) {
        active = false;
    } else {
        active = true;
    }
  }

