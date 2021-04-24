var radioMode = false;

var h = -1;
var m = -1;
var s = -1;

function startTime() {
    var today = new Date();

    if(h != today.getHours()) {
        checkHour(today.getHours());
    }

    h = today.getHours();
    m = today.getMinutes();
    s = today.getSeconds();
    var info = "";
    m = checkTime(m);
    s = checkTime(s);
    h = checkTime(h);

    //document.getElementById('clock').innerHTML = h + ":" + m + ":" + s + info;
    t = setTimeout(function () {
        startTime()
    }, 500);
}

function checkHour(hour) {
    var color = "black"
    /* if(hour < 6 || hour >= 21) {
        color = "black";
    } else if(hour < 9) {
        color = "#e73c7e";
    } else if(hour < 12) {
        color = "#1ca7ed";
    } else if(hour < 18) {
        color = "#1c96ed";
    } else {
        color = "#e73c7e";
    } */

    $("body").css("background-color", color);
    setTimeout(function() {
        $("body").css("transition", "background-color 180s");
    }, 1000);
    
}

function checkTime(i) {
    if (i<10) {i = "0" + i}; 
    return i;
}
        
startTime();

    
