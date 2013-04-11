$(function() {
	var tooltipbase = {
		"placement":	"bottom",
		"trigger": 		"click"
	}

	var tooltipsubmit = $.extend({}, tooltipbase, {
		html:		true,
		title:	function(boom) {
			var $this = $(this)
			return $("#form-template").html().replace(
					"%BENCHNUMBER%", 
					// DEPRECATED [ $this.closest("tr").data("row"), $this.closest("td").data("col") ]
					[ $this.closest("tr").find("th").text(), $this.text() ]
				)
		}
	})

	$(".reserved").tooltip(tooltipbase)
	$(".bench:not(.reserved)").tooltip(tooltipsubmit)

	// $(document).on("click", ":not(#form-template)", function(BOOM) {
	// 	console.log(this)
	// })

	$(document.body).click(function(e) {
		// SKIP OUR BOOM FORM
		if ($(e.target).closest(".tooltip").length > 0) return
		$(".bench:not(.reserved)").not(e.target).tooltip("hide")
	})

	// SUPER IMPORTANT ARNOLD STUFF
	var arnolds = ["boobes.gif", "fistslap.gif", "horse.gif", "junior.gif", "kommando.gif", "shirtboobel.gif"]
	$("#screen").css("background-image", "url(arnold/" + arnolds[Math.floor(arnolds.length * Math.random())] + ")")
})
