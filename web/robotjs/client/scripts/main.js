$(function() {

    // CHANGE THIS TO THE APPROPRIATE WS ADDRESS
    var wsUrl = 'ws://'+ window.document.location.hostname +':8084/';

    // Show loading notice
    var canvas = document.getElementById('canvas-video');
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#333';
    ctx.fillText('Loading...', canvas.width / 2 - 30, canvas.height / 3);

    // Start the player
    var client = new WebSocket(wsUrl);
    var player = new jsmpeg(client, { canvas: canvas });


    // var SERVER = window.document.location.hostname + ':8080';

    $('.move').on('click', 'span', function(e) {
        var moveDirection = getMoveDirection($(e.target));
        $.post('/move', getCommand(moveDirection), function success() {

        })
    })

    $('.rotate').on('click', 'span', function(e) {
        var rotateDirection = getRotateDirection($(e.target));
        $.post('/rotate', getCommand(rotateDirection), function success() {

        })
    })

    function getMoveDirection(target) {
        //return degree, 0 is forward, 180 is backward, -1 is stop.

        if(target.hasClass('up')) {
            return 0;
        }
        if (target.hasClass('up-right')) {
            return 45; 
        }
        if (target.hasClass('right')) {
            return 90; 
        }
        if (target.hasClass('reset')) {
            return -1; 
        }
        if (target.hasClass('right-down')) {
            return 135; 
        }
        if (target.hasClass('down')) {
            return 180; 
        }
        if (target.hasClass('left-down')) {
            return 225; 
        }
        if (target.hasClass('left')) {
            return 270; 
        }
        if (target.hasClass('up-left')) {
            return 315; 
        }
    }

    function getRotateDirection(target) {
        //return left or right or reset
        if(target.hasClass('clock-wise')) {
            return 'right';
        }
        if(target.hasClass('unclock-wise')) {
            return 'left';
        }
        if(target.hasClass('reset')) {
            return 'reset';
        }
    }

    function getCommand(direction) {
        console.log(direction);
        var cmd = {};
        if(direction === 'left' || direction === 'right' || direction === 'reset') {
            // rotate
            cmd.act = 'rotate';
            cmd.to = direction;
        }else {
            // move
            cmd.act = 'move';
            cmd.to = direction;
        }
        return cmd;
    }
})
