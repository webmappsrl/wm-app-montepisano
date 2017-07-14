// shim layer with setTimeout fallback
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

// Overwrite encodeUriComponent to avoid search url encoding
var realEncodeURIComponent = window.encodeURIComponent;
window.encodeURIComponent = function(input) {
    if (typeof input === 'string') {
        var isACoordinatesString = true,
            numbers = input.split('/'),
            currentNumber;

        if (numbers.length === 3) {
            for (var i = 0; i < numbers.length; i++) {
                currentNumber = Number(numbers[i]);
                if (typeof currentNumber !== 'number' ||
                    isNaN(currentNumber)) {
                    isACoordinatesString = false;
                }

            }
        } else {
            isACoordinatesString = false;
        }

        if (isACoordinatesString) {
            return realEncodeURIComponent(input)
                .split('%2F').join('/');
        }
    }
    
    return realEncodeURIComponent(input);
};