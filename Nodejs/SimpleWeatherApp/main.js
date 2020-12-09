"use strict";

//see our the article at https://www.visualcrossing.com/resources/documentation/weather-api/how-to-add-weather-data-to-a-node-js-app-using-a-weather-api-and-javascript/
const http = require("http");
const url = require("url");
const https = require('https');


const API_KEY = 'YOUR_API_KEY'; 
const UNIT_GROUP="us";

const retrieveWeatherData = function (location, start, end) { 
  
    var requestUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(location)}`;
	if (start) requestUrl+=`/${start}`;
	if (start && end) requestUrl+=`/${end}`;
	
	requestUrl+=`?unitGroup=${UNIT_GROUP}&key=${API_KEY}`; 
	console.log(`Request to ${requestUrl}`); 
	
	return new Promise(function(resolve, reject) {
		https.get(requestUrl, function (res) { 
		  var statusCode= res.statusCode;
		  const contentType = res.headers['content-type'];

		  var error;
		  if (statusCode !== 200) {
			error = `Request Failed. Status Code: ${statusCode}`;
		  } else if (!/^application\/json/.test(contentType)) {
			error = `Invalid content-type. Expected application/json but received ${contentType}`;		  
			statusCode=500;
		  }
		  
		  res.setEncoding('utf8');
		  let rawData = '';
		  res.on('data', (chunk) => { rawData += chunk; });
		  res.on('end', () => {
			try {

				if (error) {
					console.error(`Error: ${error}. Details: ${rawData}`);
					reject(`Error: ${error}. Details: ${rawData}`);
				} else {
					resolve(JSON.parse(rawData));
				}
				
				
			
			} catch (e) {
			  console.error(`Unexpected error ${e.message}`);
			  reject(`Unexpected error ${e.message}`);
			}
		  });
		}).on('error', (e) => {
			console.error(`Error 3 ${e}`);;
			 reject(`Communication error ${e}`);
		});
	
	});
} 
const buildWeatherTable= function (weatherData) { 
	if (!weatherData || !weatherData.days) {
		return "<h3>Unexpected weather data</h1>";
	}

	var html=`<h1>Weather Data for ${weatherData.resolvedAddress}`;
	
	
	html+=`<table>`;
	html+=`<tr><th>Date</th><th>Max temp</th><th>Min temp</th><th>Precip</th><th>Wind</th><th>Wind direction</th></tr>`;
	weatherData.days.forEach(function(day) {
		html+=`<tr><td>${day.datetime}</td><td>${day.tempmax}</td><td>${day.tempmin}</td><td>${day.precip}</td><td>${day.windspeed}</td><td>${day.winddir}</td></tr>`;
		if (day.hours) {
			day.hours.forEach(function(hour) {
				html+=`<tr><td>&nbsp;${hour.datetime}</td><td colspan="2">${hour.temp}</td><td>${hour.precip}</td><td>${hour.windspeed}</td><td>${hour.winddir}</td></tr>`;
			});
		}
	});
	html+=`</table>`;
	return html;
}
http.createServer(function (request, response) {

	
   const queryObject = url.parse(request.url,true).query;
   response.writeHead(200, {'Content-Type': 'text/html'});
   if (!queryObject.location) {
		response.end(`<html><body>Please include a location query parameter</body></html>`);
		return;
   }
   
   retrieveWeatherData(queryObject.location, queryObject.start,queryObject.end).then(function(data) {
		
		response.end(`<html><body>${buildWeatherTable(data)}</body></html>`);
   
   }).catch(function(data) {
		response.end(`<html><body>${data}</body></html>`);
   });

}).listen(8081);

// Console will print the message
console.log('Server running at http://127.0.0.1:8081/');
