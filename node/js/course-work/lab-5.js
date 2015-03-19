$( "#cityfield" ).keyup(function()
{
	if($( "#cityfield" ).val().length < 1)
	{
		return;
	}
	$("#suggestion").show();
	var url = "http://52.11.86.178/getcity?q="+$( "#cityfield" ).val();
	$.getJSON(url,function(data) 
	{
		var everything;
		everything = "<ul>";
		$.each(data, function() 
		{
			everything += "<li> "+this.city;
		});
		everything += "</ul>";
		$("#txtHint").html(everything);
		$( "div.weatherForm" ).css( "height", "auto");
	});
});
$("#cityfield").click(function(e)
{
	$( "#secondary" ).hide();
	$( "#submitButton" ).fadeIn(1000);
});

$("#cityfield").keyup(function(e){
    if(e.keyCode == 13)
    {
        $("#submitButton").trigger("click");
    }
});

$('form').on('submit', function(event){
    event.preventDefault();
});

$("#submitButton").click(function(e)
{
	$("#suggestion").hide();
	e.preventDefault();
	var url = "http://api.wunderground.com/api/f7ba698456b8a70b/conditions/q/UT/";
	var city = $("#cityfield").val();
	city = city.trim();
	city = city.replace(/ /g,"_");
	// if(zipCode.length != 5)
	// {
	// 	$("#cityfield").val("");
	// 	// $( "#submitButton" ).fadeOut(1000);
	// 	$("#zipInput").fadeIn(25).fadeOut(25).fadeIn(25).fadeOut(25).fadeIn(25).fadeOut(25).fadeIn(25).fadeOut(25).fadeIn(25).fadeOut(25).fadeIn(25);
	// 	alert("You need to enter a 5-digit zip code!");
	// 	return;
	// }
	$( "#submitButton" ).fadeOut(1000);
	// $( "div.mainBody" ).css( "height", "800px");
	url += city;
	url += ".json";

	$( "#WU-logo" ).slideDown(1000, function() {
	    // Animation complete.
	  });
	$.ajax({
		url : url,
		dataType : "jsonp",
		success : function(parsed_json) 
		{
			$( "#secondary" ).slideDown(1000, function() {
			    // Animation complete.
			  });
			var location = parsed_json.current_observation.display_location.full;
			var temp_f = parsed_json.current_observation.temp_f;
			var temp_string = parsed_json.current_observation.temperature_string;
			var latitude = parseFloat(parsed_json.current_observation.display_location.latitude);
			var longitude = parseFloat(parsed_json.current_observation.display_location.longitude);
			var humidity = parsed_json.current_observation.relative_humidity;
			var weather = parsed_json.current_observation.weather;
			var visibility = parsed_json.current_observation.visibility_mi;
			var wind = parsed_json.current_observation.wind_mph;
			var direction = parsed_json.current_observation.wind_dir;

			out = "<div class='location'>"+location+"</div>";
			out += "<div class='temp'><i class='icon ion-thermometer'></i> "+temp_f+"&deg</div>";
			out += "<ul>";
			out += "<li>Weather: "+weather;
			out += "<li>Relative Humidity: "+humidity;
			out += "<li>Visibility: "+visibility + " miles";
			out += "<li>Wind: "+wind + " mph " + direction;

			out += "</ul>";

			$("#weather").html(out);

			changeBackground(weather);
			setMap(latitude,longitude);

			// out = "<div class='location'>"+location+"</div>";
			// out += "<div class='temp'><i class='icon ion-thermometer'></i> "+temp_f+"&deg</div>";
			// out += "<table id='weatherTable'>";
			// out += "<tr>";
			// out += "<td>Weather</td><td>"+weather +"</td>";
			// out += "</tr>";
			// out += "<tr>";
			// out += "<td>Relative Humidity</td><td>"+humidity +"</td>";
			// out += "</tr>";
			// out += "<tr>";
			// out += "<td>Visibility</td><td>"+visibility + " miles</td>";
			// out += "</tr>";
			// out += "<tr>";
			// out += "<td>Wind</td><td>"+wind + " mph " + direction +"</td>";
			// out += "</tr>";
			// out += "</table>";

			// $("#weather").html(out);
			// $("#weather td:nth-child(1)").css("text-align","right");
			// $("#weather td:nth-child(2)").css("text-align","left");
		}
	});
});
function changeBackground(weather)
{
	var array = weather.split(" ");
	weather = array[array.length - 1];
	switch(weather) 
	{
		case "Clear":
			$('#homeBanner').css("background-image", "url(http://www.torange.us/photo/20/13/Clear-sky-1363594685_18.jpg)"); 
			break;
		case "Drizzle":
		case "Rain":
		case "Shower":
		case "Mist":
			$('#homeBanner').css("background-image", "url(http://www.savetherain.org/fp/users/1/pages/1/save-the-rain_bg-001.jpg)");
			break;
		case "Snow":
			$('#homeBanner').css("background-image", "url(http://i.ytimg.com/vi/kJGjueu-s0U/maxresdefault.jpg)");
			break;
		case "Haze":
			$('#homeBanner').css("background-image", "url(http://www.singapolitics.sg/sites/default/files/field/image/28365266%20-%2020_06_2013%20-%20haze21.jpg)");
			break;
		case "Cloudy":
		case "Clouds":
			$('#homeBanner').css("background-image", "url(http://fc03.deviantart.net/fs71/f/2013/105/9/f/cloudy_sky_stock_by_naturalhorses-d61stqm.jpg)");
			break;
		case "Fog":
			$('#homeBanner').css("background-image", "url(http://topwalls.net/wp-content/uploads/2012/04/fog-forest.jpg)");
			break;
		case "Overcast":
			$('#homeBanner').css("background-image", "url(http://www.photos-public-domain.com/wp-content/uploads/2012/04/cloudy-overcast-sky.jpg)");
			break;
		default:
			break;
	}
}
function setMap(latitude,longitude)
{
	var mapOptions = 
	{
		center: { lat: latitude, lng: longitude},
		zoom: 12
	};
	var map = new google.maps.Map(document.getElementById('map'),mapOptions);
}


///////////////////////////////		
// Mobile Detection
///////////////////////////////

function isMobile(){
    return (
        (navigator.userAgent.match(/Android/i)) ||
		(navigator.userAgent.match(/webOS/i)) ||
		(navigator.userAgent.match(/iPhone/i)) ||
		(navigator.userAgent.match(/iPod/i)) ||
		(navigator.userAgent.match(/iPad/i)) ||
		(navigator.userAgent.match(/BlackBerry/))
    );
}

///////////////////////////////
// Project Filtering 
///////////////////////////////

function projectFilterInit() {
	$('#filterNav a').click(function(){
		var selector = $(this).attr('data-filter');	
		$(this).css('outline','none');
		$('ul#filter .current').removeClass('current');
		$(this).parent().addClass('current');
		
		if(selector == 'all') {
			$('#projects .thumbs .project.inactive .inside').fadeIn('slow').removeClass('inactive').addClass('active');
		} else {
			$('#projects .thumbs .project').each(function() {
				if(!$(this).hasClass(selector)) {
					$(this).removeClass('active').addClass('inactive');
					$(this).find('.inside').fadeOut('normal');
				} else {
					$(this).addClass('active').removeClass('inactive');
					$(this).find('.inside').fadeIn('slow');
				}
			});
		}		
	
		if ( !$(this).hasClass('selected') ) {
			$(this).parents('#filterNav').find('.selected').removeClass('selected');
			$(this).addClass('selected');
		}
	
		return false;
	});		
}

///////////////////////////////
// Project thumbs 
///////////////////////////////

function projectThumbInit() {
	
	if(!isMobile()) {		
	
		$(".project.small .inside a").hover(
			function() {
				$(this).find('img:last').stop().fadeTo("fast", .1);
				$(this).find('img:last').attr('title','');	
			},
			function() {
				$(this).find('img:last').stop().fadeTo("fast", 1);	
		});
			
		$(".project.small .inside").hover(	
			function() {				
				$(this).find('.title').stop().fadeTo("fast", 1);
				$(this).find('img:last').attr('title','');				
			},
			function() {				
				$(this).find('.title').stop().fadeTo("fast", 0);							
		});
		
	}
	
	$(".project.small").css("opacity", "1");	
}

///////////////////////////////
// Parallax
///////////////////////////////

// Calcualte the home banner parallax scrolling
  function scrollBanner() {
    //Get the scoll position of the page
    scrollPos = $(this).scrollTop();

    //Scroll and fade out the banner text
    $('#bannerText').css({
      'margin-top' : -(scrollPos/3)+"px",
      'opacity' : 1-(scrollPos/300)
    });
	
    //Scroll the background of the banner
    $('#homeBanner').css({
      'background-position' : 'center ' + (-scrollPos/8)+"px"
    });    
  }


///////////////////////////////
// Initialize
///////////////////////////////	
	
// $.noConflict();
$(document).ready(function(){
	$( "#suggestion" ).hide();
	$( "#secondary" ).hide();
	if(!isMobile()) {
		$(window).scroll(function() {	      
	       scrollBanner();	      
		});
	}
	projectThumbInit();	
	projectFilterInit();	
});