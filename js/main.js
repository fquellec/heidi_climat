document.onkeydown = function (e) {
	var keyCode = e.keyCode;

	if(keyCode == 37) {
		document.getElementById("left").click();
	}
	if(keyCode == 39) {
		document.getElementById("right").click();
	}
};