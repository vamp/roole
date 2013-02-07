function Toc() {
	var element = document.getElementById('toc')
	var toggerElement = element.previousElementSibling

	this.element = element
	this.toggerElement = toggerElement

	this.clickToToggle()
}

Toc.prototype.clickToToggle = function() {
	this.toggerElement.addEventListener('mousedown', function() {
		if (this.element.classList.contains('hidden')) {
			this.element.classList.remove('hidden')
			// prevent this event to trigger the handler
			setTimeout(this.clickDocumentToHide.bind(this), 0)
		} else {
			this.noClickDocumentToHide()
			this.element.classList.add('hidden')
		}
	}.bind(this), false)
	this.toggerElement.addEventListener('click', function(event) {
		event.preventDefault()
	}, false)
}

Toc.prototype.clickDocumentToHide = function() {
	this.clickDocumentHandler = function() {
		this.element.classList.add('hidden')
		this.noClickDocumentToHide()
	}.bind(this)

	document.addEventListener('mousedown', this.clickDocumentHandler, false)
}

Toc.prototype.noClickDocumentToHide = function() {
	document.removeEventListener('mousedown', this.clickDocumentHandler, false)
}

document.addEventListener('DOMContentLoaded', function() {
	new Toc()
})
