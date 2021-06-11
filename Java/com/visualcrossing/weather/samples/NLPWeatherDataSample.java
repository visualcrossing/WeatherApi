package com.visualcrossing.weather.samples;

import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Calendar;
import java.util.Properties;
import java.util.Scanner;

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

import edu.stanford.nlp.pipeline.CoreDocument;
import edu.stanford.nlp.pipeline.CoreEntityMention;
import edu.stanford.nlp.pipeline.StanfordCoreNLP;
import edu.stanford.nlp.time.TimeAnnotations;
import edu.stanford.nlp.time.Timex;

public class NLPWeatherDataSample {
	private static final String DATE = "DATE";
	private final static String LOCATION_CITY="CITY";
	private final static String LOCATION_COUNTRY="COUNTRY";
	private final static String LOCATION_STATE_OR_PROVINCE="STATE_OR_PROVINCE";
	
	private final static String API_KEY="1PYNQ6AWUDJE9AFERDCHJHSXK";
	
	public static void main(String[] args) {
		// set up pipeline properties
		Properties props = new Properties();
		// set the list of annotators to run
		props.setProperty("annotators","tokenize,ssplit,pos,lemma,ner");
		
		// set a property for an annotator, in this case the coref annotator is being
		// set to use the neural algorithm
		props.setProperty("coref.algorithm", "neural");
        props.setProperty("ner.docdate.usePresent", "true");
        props.setProperty("sutime.includeRange", "true");
        props.setProperty("sutime.markTimeRanges", "true");
        
		// build pipeline
		System.out.printf("Starting pipeline...%n");
		StanfordCoreNLP pipeline = new StanfordCoreNLP(props);
		System.out.printf("Pipeline ready...%n%n");
		
		//loop for ever asking the user for text to process
		try (Scanner in = new Scanner(System.in)) {
			while (true) {
				System.out.printf("Enter text:%n%n");
				
				String text = in.nextLine();
				try {
					processText(pipeline, text);
				} catch (Throwable e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
				
			}
		}
	}
	

	private static void processText(StanfordCoreNLP pipeline, String text) throws Exception {
		CoreDocument document = new CoreDocument(text);
		// annnotate the document
		pipeline.annotate(document);
		
		if (document.entityMentions()==null || document.entityMentions().isEmpty()) {
			System.out.println("no entities found");
			return;
		}
		
		String city=null;
		String state=null;
		String country=null;
		LocalDate startDate=null;
		LocalDate endDate=null;
	    for (CoreEntityMention em : document.entityMentions()) {
	    	
	    	
	    	if (DATE.equals(em.entityType())) {
	    		Timex timex=em.coreMap().get(TimeAnnotations.TimexAnnotation.class);
	    		Calendar t1=timex.getRange().first;
	    		if (t1!=null) {
	    			startDate=LocalDateTime.ofInstant(t1.toInstant(), ZoneId.systemDefault()).toLocalDate();
	    		}
	    		Calendar t2=timex.getRange().second;
	    		if (t2!=null) {
	    			endDate=LocalDateTime.ofInstant(t2.toInstant(), ZoneId.systemDefault()).toLocalDate();
	    		}
	    	} else if (LOCATION_CITY.equals(em.entityType())) {
	    		city=em.text();
	    	} else if (LOCATION_STATE_OR_PROVINCE.equals(em.entityType())) {
	    		state=em.text();
	    	} else if (LOCATION_COUNTRY.equals(em.entityType())) {
	    		country=em.text();
	    	}
	    	
	    	
	    	
	    }
	    String location="";
	    if (city!=null) location+=location.isEmpty()?city:(","+city);
	    if (state!=null) location+=location.isEmpty()?state:(","+state);
	    if (country!=null) location+=location.isEmpty()?country:(","+country);
	    System.out.printf("Location=%s; fromDate=%s, toDate=%s%n", location,
	    		startDate!=null?startDate.format(DateTimeFormatter.ISO_LOCAL_DATE):"[Null]",
	    				endDate!=null?endDate.format(DateTimeFormatter.ISO_LOCAL_DATE):"[Null]"
	    				);
	    
	    if (location==null || location.isEmpty()) {
	    	System.out.println("no location information found");
	    	return;
	    }
	    timelineRequestHttpClient(location, startDate, endDate);
	}
	
	public static void timelineRequestHttpClient(String location, LocalDate startDate, LocalDate endDate ) throws Exception {
		//set up the end point
		String apiEndPoint="https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/";
	
		
		String unitGroup="us";
		
	
		StringBuilder requestBuilder=new StringBuilder(apiEndPoint);
		requestBuilder.append(URLEncoder.encode(location, StandardCharsets.UTF_8.toString()));
		
		if (startDate!=null) {
			requestBuilder.append("/").append(startDate.format(DateTimeFormatter.ISO_DATE));
			if (endDate!=null && !startDate.equals(endDate)) {
				requestBuilder.append("/").append(endDate.format(DateTimeFormatter.ISO_DATE));
			}
		}
		
		URIBuilder builder = new URIBuilder(requestBuilder.toString());
		
		builder.setParameter("unitGroup", unitGroup)
			.setParameter("key", API_KEY)
			.setParameter("include", "days")
			.setParameter("elements", "datetimeEpoch,tempmax,tempmin,precip");

		
		
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
            double precip=dayValue.getDouble("precip");
          
            System.out.printf("%s\t%.1f\t%.1f\t%.1f%n", datetime.format(DateTimeFormatter.ISO_LOCAL_DATE), maxtemp, mintemp, precip );
        }
	}
}