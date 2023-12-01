<!-- Read information from the path or query string-->
<?php
	
	//helper method to retrieve data from the URL path or query string
	function extractParam($pathSegments, $pathIndex, $query_params, $query_param) {
	   if (count($pathSegments)>$pathIndex) return trim(urldecode($pathSegments[$pathIndex]));
	   if ($query_params[$query_param]!=null) return trim(urldecode($query_params[$query_param]));
	   return null;
	}

	$segments = explode('/', trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/'));
	$query_str = parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY);
	parse_str($query_str, $query_params);
	//the location for the weather data (an address or partial address)
	$location=extractParam($segments,1, $query_params, "location");

	// the unit group - us, metric or uk
	$unitGroup=extractParam($segments,2, $query_params, "unitGroup");

	//we want weather data to aggregated to daily details.
	$aggregateHours=24;
	//your API key
	$apiKey="YOUR_API_KEY";

?>
 <html>
<head>
<title>Timeline Weather API PHP Sample</title>
</head>
<body>
	
	
	<!-- Weather Forecast request construction -->
	<?php	
		$api_url="https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{$location}?unitGroup={$unitGroup}&key={$apiKey}&contentType=json";

		$json_data = file_get_contents($api_url);

		$response_data = json_decode($json_data);

		$resolvedAddress=$response_data->resolvedAddress;
		$days=$locationInstance->days;
	?>
	<!-- Create the HTML for the weather forecast data -->
	<h1>Weather Forecast for <?php echo $resolvedAddress; ?></h1>
	<table>
		<tr><th>Date</th><th>Max Temp</th><th>Min Temp</th><th>Precip</th><th>Wspd</th><th>Wgust</th><th>Cloud cover</th></tr>
		<?php
		foreach ($day as $days) {
		?>
		<tr>
			 <td><?php echo $day->datetime; ?></td>
			 <td><?php echo $day->tempmax; ?></td>
			 <td><?php echo $day->tempmin; ?></td>
			 <td><?php echo $day->precip; ?></td>
			 <td><?php echo $day->windspeed; ?></td>
			 <td><?php echo $day->windgust; ?></td>
			 <td><?php echo $day->cloudcover; ?></td>
		</tr>
		<?php } ?>
	</table>

	<h4>API request</h4>
	<p>
		<?php echo $api_url; ?>
	</p>
	
	
</body>
</html>
