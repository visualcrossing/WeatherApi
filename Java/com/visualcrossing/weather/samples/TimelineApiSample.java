/*
 * TimelineApiSample
 * Example to show how to call the Visual Crossing Timeline Weather API using Java.
 * See https://www.visualcrossing.com/resources/documentation/weather-api/how-to-use-timeline-weather-api-to-retrieve-historical-weather-data-and-weather-forecast-data-in-java/
 */


package com.visualcrossing.weather.samples;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

import org.apache.http.HttpEntity;
import org.apache.http.HttpStatus;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.utils.URIBuilder;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.json.JSONArray;
import org.json.JSONObject;


public class TimelineApiSample {
	
	
	/*
	 * timelineRequest - Requests Timeline Weather API data using native classes such as HttpURLConnection
	 *  
	 */
	public static void timelineRequest() throws Exception {
		String apiEndPoint="https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/";
		String location="Washington, DC, United States";
		String startDate="2020-12-01"; //optional
		String endDate="2020-12-31"; //optional (requires a startDate)
		String unitGroup="us"; //us,metric,uk 
		String apiKey="YOUR_API_KEY"; //sign up for a free api key at https://www.visualcrossing.com/weather/weather-data-services
		
		
		String method="GET"; // GET OR POST
		
		
		//Build the URL pieces
		StringBuilder requestBuilder=new StringBuilder(apiEndPoint);
		requestBuilder.append(location);
		
		if (startDate!=null && !startDate.isEmpty()) {
			requestBuilder.append("/").append(startDate);
			if (endDate!=null && !endDate.isEmpty()) {
				requestBuilder.append("/").append(endDate);
			}
		}
		
		//Build the parameters to send via GET or POST
		StringBuilder paramBuilder=new StringBuilder();
		paramBuilder.append("&").append("unitGroup=").append(unitGroup);
		paramBuilder.append("&").append("key=").append(apiKey);
		
		
		//for GET requests, add the parameters to the request
		if ("GET".equals(method)) {
			requestBuilder.append("?").append(paramBuilder);
		}
		
		//set up the connection
		URL url = new URL(requestBuilder.toString());
		HttpURLConnection conn = (HttpURLConnection) url.openConnection();
		conn.setRequestMethod("GET");
		

	    //If post method, send post request
		if ("POST".equals(method)) {
			conn.setDoOutput( true );
			conn.setInstanceFollowRedirects( false );
			conn.setRequestMethod( "POST" );
			conn.setRequestProperty( "Content-Type", "application/x-www-form-urlencoded"); 
			conn.setRequestProperty( "charset", "utf-8");
			conn.setRequestProperty( "Content-Length", Integer.toString( paramBuilder.length() ));
			conn.setUseCaches( false );
		    DataOutputStream wr = new DataOutputStream(conn.getOutputStream());
		    wr.writeBytes(paramBuilder.toString());
		    wr.flush();
		    wr.close();
		}
		
		//check the response code and set up the reader for the appropriate stream
	    int responseCode = conn.getResponseCode();
	    boolean isSuccess=responseCode==200;
	    StringBuffer response = new StringBuffer();
	    try ( 
	    		BufferedReader in = new BufferedReader(new InputStreamReader(isSuccess?conn.getInputStream():conn.getErrorStream()))
	    	) {

		    //read the response
		    String inputLine;
		    while ((inputLine = in.readLine()) != null) {
		        response.append(inputLine);
		    }
		    in.close();
		}  
	    if (!isSuccess) {
	    	System.out.printf("Bad response status code:%d, %s%n", responseCode,response.toString());
			
	    	return;
	    }
	    
	    //pass the string response to be parsed and used
	    parseTimelineJson(response.toString());
	    
		
	}
	public static void timelineRequestHttpClient() throws Exception {
		//set up the end point
		String apiEndPoint="https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/";
		String location="Washington, DC, United States";
		String startDate="2020-12-01";
		String endDate="2020-12-31";
		
		String unitGroup="us";
		String apiKey="YOUR_API_KEY";
	
		StringBuilder requestBuilder=new StringBuilder(apiEndPoint);
		requestBuilder.append(URLEncoder.encode(location, StandardCharsets.UTF_8.toString()));
		
		if (startDate!=null && !startDate.isEmpty()) {
			requestBuilder.append("/").append(startDate);
			if (endDate!=null && !endDate.isEmpty()) {
				requestBuilder.append("/").append(endDate);
			}
		}
		
		URIBuilder builder = new URIBuilder(requestBuilder.toString());
		
		builder.setParameter("unitGroup", unitGroup)
			.setParameter("key", apiKey);

		
		
		HttpGet get = new HttpGet(builder.build());
		
		CloseableHttpClient httpclient = HttpClients.createDefault();
		
		CloseableHttpResponse response = httpclient.execute(get);    
		
		String rawResult=null;
		try {
			if (response.getStatusLine().getStatusCode() != HttpStatus.SC_OK) {
				System.out.printf("Bad response status code:%d%n", response.getStatusLine().getStatusCode());
				return;
			}
			
			HttpEntity entity = response.getEntity();
		    if (entity != null) {
		    	rawResult=EntityUtils.toString(entity, Charset.forName("utf-8"));
		    }
		    
		    
		} finally {
			response.close();
		}
		
		parseTimelineJson(rawResult);
		
	}
	private static void parseTimelineJson(String rawResult) {
		
		if (rawResult==null || rawResult.isEmpty()) {
			System.out.printf("No raw data%n");
			return;
		}
		
		JSONObject timelineResponse = new JSONObject(rawResult);
		
		ZoneId zoneId=ZoneId.of(timelineResponse.getString("timezone"));
		
		System.out.printf("Weather data for: %s%n", timelineResponse.getString("resolvedAddress"));
		
		JSONArray values=timelineResponse.getJSONArray("days");
		
		System.out.printf("Date\tMaxTemp\tMinTemp\tPrecip\tSource%n");
		for (int i = 0; i < values.length(); i++) {
			JSONObject dayValue = values.getJSONObject(i);
            
            ZonedDateTime datetime=ZonedDateTime.ofInstant(Instant.ofEpochSecond(dayValue.getLong("datetimeEpoch")), zoneId);
            
            double maxtemp=dayValue.getDouble("tempmax");
            double mintemp=dayValue.getDouble("tempmin");
            double pop=dayValue.getDouble("precip");
            String source=dayValue.getString("source");
            System.out.printf("%s\t%.1f\t%.1f\t%.1f\t%s%n", datetime.format(DateTimeFormatter.ISO_LOCAL_DATE), maxtemp, mintemp, pop,source );
        }
	}
	
	
	public static void main(String[] args)  throws Exception {
		TimelineApiSample.timelineRequest();
		TimelineApiSample.timelineRequestHttpClient();
	}
}
