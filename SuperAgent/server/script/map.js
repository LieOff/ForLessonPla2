function open() {
	var script = ""
			+ "function initialize() {													"
			+ "	  var mapOptions = {													"
			+ "	    zoom: 12,															"
			+ "	    center: new google.maps.LatLng(59.88005, 30.43805),					"
			+ "	    mapTypeId: google.maps.MapTypeId.ROADMAP							"
			+ "	  };																	"
			+ "	  var map = new google.maps.Map(document.getElementById('map-canvas'),	"
			+ "	      mapOptions);														"
			+ "	  var coordinates = [													"
	var isfirst = true;
	var coords = get_coordinates();
	for ( var c in coords) {
		if (!isfirst)
			script += ",";
		script += "new google.maps.LatLng(" + parseFloat(c.Latitude) + ", "
				+ parseFloat(c.Longitude) + ")";

		isfirst = false;
	}

	script += "	  ];														"
			+ "	  var track = new google.maps.Polyline({					"
			+ "	    path: coordinates," + "	    geodesic: true,				"
			+ "	    strokeColor: '#0000FF'," + "	    strokeOpacity: 1.0, "
			+ "	    strokeWeight: 2" + "	  });							" 
			+ "	  track.setMap(map);										"
			+ "	  var bounds = new google.maps.LatLngBounds();				"
			+ "   var i = 0;												"
			+ "   while(i != coordinates.length){							"
			+ "       bounds.extend(coordinates[i]);						"
			+ "		  i++;													"
			+ "	  }															"
			+ "	if (i != 0)													"
			+ "   map.fitBounds(bounds);									"	
			+ "	}"
			+ "	google.maps.event.addDomListener(window, 'load', initialize);";

	$.Push("map_script", script);
	return View.TemplateView("map.xml");
}

function get_coordinates() {
	var userId = get_user_id();
	var q = DB.CreateCommand();
	q.Text = "SELECT [Latitude], [Longitude] FROM [admin].[GPS] WHERE [UserId] = @userId ORDER BY [EndTime]";
	 q.AddParameter("userId", userId);
	return q.Select();
}

function get_user_id() {
	var q = DB.CreateCommand();
	q.Text = "SELECT [Id] FROM [Catalog].[User] WHERE [UserName] = @userName";
	q.AddParameter("userName", $.username);
	return q.ExecuteScalar();	 
}