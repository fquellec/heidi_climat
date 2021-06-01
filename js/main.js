document.onkeydown = function (e) {
	var keyCode = e.keyCode;

	if(keyCode == 37) {
		document.getElementById("left").click();
	}
	if(keyCode == 39) {
		document.getElementById("right").click();
	}
};

function CopyToClipboard(node) {
  var input = document.querySelector(node.getAttribute("data-target"))
  node.addEventListener("click", this.clicked.bind(this))
  this.input = document.createElement("input")
  this.input.type = "text"
  this.input.value = node.getAttribute("data-value")
  this.input.setAttribute("readonly", true)
  this.input.style.position = "absolute"
  this.input.style.left = "-10000px"
  node.appendChild(this.input)
}

CopyToClipboard.prototype.clicked = function() {
  this.input.select()
  document.execCommand("copy")

  FlashMessages.notice("Copié !")
}
