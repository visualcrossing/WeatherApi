
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;


// https://github.com/visualcrossing/WeatherApi/blob/master/Java/com/visualcrossing/weather/samples/TimelineApiSample.java

public class WeatherForecastRetrieval {

    /*
     * timelineRequest - Requests Timeline Weather API data using native classes such as HttpURLConnection
     *
     */
    public static void timelineRequest(Double latitude, Double longitude) throws Exception {
        String apiEndPoint="https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/";

        String unitGroup="metric"; //us,metric,uk
        String apiKey="YOUR_API_KEY"; //sign up for a free api key at https://www.visualcrossing.com/weather/weather-data-services


        String method="GET"; // GET OR POST


        //Build the URL pieces
        StringBuilder requestBuilder=new StringBuilder(apiEndPoint);
          requestBuilder.append(String.format("%f,%f",longitude, latitude));


        //Build the parameters to send via GET or POST
        StringBuilder paramBuilder=new StringBuilder();
        paramBuilder.append("unitGroup=").append(unitGroup);
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


    private static void parseTimelineJson(String rawResult) {

        if (rawResult==null || rawResult.isEmpty()) {
            System.out.printf("No raw data%n");
            return;
        }

        try {
            JSONObject timelineResponse = new JSONObject(rawResult);

            ZoneId zoneId = ZoneId.of(timelineResponse.getString("timezone"));

            System.out.printf("Weather data for: %s%n", timelineResponse.getString("resolvedAddress"));

            JSONArray values = timelineResponse.getJSONArray("days");

            System.out.printf("Date\tMaxTemp\tMinTemp\tPrecip\tSource%n");
            for (int i = 0; i < values.length(); i++) {
                JSONObject dayValue = values.getJSONObject(i);

                ZonedDateTime datetime = ZonedDateTime.ofInstant(Instant.ofEpochSecond(dayValue.getLong("datetimeEpoch")), zoneId);

                double maxtemp = dayValue.getDouble("tempmax");
                double mintemp = dayValue.getDouble("tempmin");
                double pop = dayValue.getDouble("precip");
                String source = dayValue.getString("source");
                System.out.printf("%s\t%.1f\t%.1f\t%.1f\t%s%n", datetime.format(DateTimeFormatter.ISO_LOCAL_DATE), maxtemp, mintemp, pop, source);
            }
		}
        catch (JSONException e) {
            e.printStackTrace();
        }
    }
}

//	Main is only for demonstration. 
//	In an android project you don't have main
	public static void main(String[] args)  throws Exception {
		double latitude = 53.92;
		double longitude = -0.36
		WeatherForecastRetrieval forecastRetrieval = new WeatherForecastRetrieval();
		forecastRetrieval.retrieveWeatherForecastAsJson(latitude, longitude);
	}

