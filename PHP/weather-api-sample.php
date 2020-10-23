	<!-- Read information from the path or query string-->
<?php
	function extractParam($pathSegments, $pathIndex, $query_params, $query_param) {
	  if (count($pathSegments)>$pathIndex) return trim(urldecode($pathSegments[$pathIndex]));
	  if ($query_params[$query_param]!=null) return trim(urldecode($query_params[$query_param]));
	  return null;
	}

	$segments = explode('/', trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/'));
	$query_str = parse_url($_SERVER['REQUEST_URI'], PHP_URL_QUERY);
	parse_str($query_str, $query_params);
	$location=extractParam($segments,1, $query_params, "location");
	$unitGroup=extractParam($segments,2, $query_params, "unitGroup");
	$startDateTime=extractParam($segments,3, $query_params, "fromdate");
	
	$endDateTime=extractParam($segments,4, $query_params, "todate");
	$aggregateHours=24;
	$apiKey="YOUR_API_KEY";
?>
	
	
<html>
<head>
<title>Weather API PHP Sample</title>
</head>
<body>
	
	
	<!-- Weather Forecast request construction -->
	<?php	

		$api_url="https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/weatherdata/forecast?unitGroup={$unitGroup}&aggregateHours={$aggregateHours}".
				"&location={$location}&key={$apiKey}&contentType=json&locationMode=single";
				
		$json_data = file_get_contents($api_url);

		$response_data = json_decode($json_data);
		$locationInstance=$response_data->location;
		$values=$locationInstance->values;
		
	?>
	<!-- Create the HTML for the weather forecast data -->
	<h1>Weather Forecast for <?php echo $locationInstance->address; ?></h1>
	<table>
		<tr><th>Date</th><th>Max Temp</th><th>Min Temp</th><th>Precip</th><th>Wspd</th><th>Wgust</th><th>Cloud cover</th></tr>
		<?php 
			   foreach ($values as $value) {
		?>
			<tr>
				<td><?php echo $value->datetimeStr; ?></td>
				<td><?php echo $value->maxt; ?></td>
				<td><?php echo $value->mint; ?></td>
				<td><?php echo $value->precip; ?></td>
				<td><?php echo $value->wspd; ?></td>
				<td><?php echo $value->wgust; ?></td>
				<td><?php echo $value->cloudcover; ?></td>
			</tr>
		<?php
			}
		?>
	</table>
	<h4>API request</h4>
	<p>
		<?php echo $api_url; ?>
	</p>
	
	<!-- Historical weather request construction -->
	<?php	

		$api_url="https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/weatherdata/history?unitGroup={$unitGroup}&aggregateHours={$aggregateHours}".
				"&location={$location}&key={$apiKey}&collectStationContribution=true&shortColumnNames=true&contentType=json&locationMode=single";
		if ($startDateTime!=null ) {
				 $api_url=$api_url."&startDateTime={$startDateTime}&endDateTime={$endDateTime}";
		} else {
				$api_url=$api_url."&period=last7days";
		}
		$json_data = file_get_contents($api_url);

		$response_data = json_decode($json_data);
		$locationInstance=$response_data->location;
		$values=$locationInstance->values;

	?>
	<!-- Create the HTML for the historical weather data -->
	<h1>Weather History for <?php echo $locationInstance->address; ?></h1>
	<p>
	Latitude, longitude: <?php echo $locationInstance->latitude; ?>, <?php echo $locationInstance->longitude; ?>
	</p>
	<table>
		<tr><th>Date</th><th>Max Temp</th><th>Min Temp</th><th>Precip</th><th>Wspd</th><th>Wgust</th><th>Cloud cover</th></tr>
		<?php 
			   foreach ($values as $value) {
		?>
			<tr>
				<td><?php echo $value->datetimeStr; ?></td>
				<td><?php echo $value->maxt; ?></td>
				<td><?php echo $value->mint; ?></td>
				<td><?php echo $value->precip; ?></td>
				<td><?php echo $value->wspd; ?></td>
				<td><?php echo $value->wgust; ?></td>
				<td><?php echo $value->cloudcover; ?></td>
			</tr>
		<?php
			}
		?>
	</table>
	<h4>API request</h4>
	<p>
		<?php echo $api_url; ?>
	</p>
	
	
</body>
</html>

