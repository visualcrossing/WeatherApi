import RPi.GPIO as GPIO
import urllib.parse
import urllib.request
import json
import time

UPDATEINTERVAL=5
API_KEY="YOUR_API_KEY"
LOCATION="New York City,NY"
FREEZING_TEMP=32
COLD_TEMP=40
UNIT_GROUP="us"

GPIO.setmode(GPIO.BCM)
GPIO.setup(23,GPIO.OUT)
GPIO.setup(24,GPIO.OUT)
GPIO.setup(25,GPIO.OUT)


def getWeatherForecast():
	requestUrl = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/" + urllib.parse.quote_plus(LOCATION) + "?key="+API_KEY+"&unitGroup="+UNIT_GROUP;
	try:
		req = urllib.request.urlopen(requestUrl)
	except:
		print("Could not read from:"+requestUrl);
		return []
	rawForecastData = req.read()
	req.close()
	return json.loads(rawForecastData)


def main():
	while True:
		print("Fetching forecast...")
		GPIO.output(23,GPIO.HIGH)
		GPIO.output(24,GPIO.HIGH)
		GPIO.output(25,GPIO.HIGH)
		
		weatherForecast = getWeatherForecast()
		if ('days' not in weatherForecast):
			print("Problem retrieving forecast")
		else:
			days=weatherForecast['days'];
			nextColdDayIndex=-1;
			nextFreezingDayIndex=-1;
			totalFreezingDays=0;
			for dayIndex in range(len(days)):
				tempmin=days[dayIndex]['tempmin'];
				if tempmin<FREEZING_TEMP:
					totalFreezingDays=totalFreezingDays+1;
					if nextFreezingDayIndex==-1:
						nextFreezingDayIndex=dayIndex;
				if tempmin<COLD_TEMP and nextColdDayIndex==-1:
					nextColdDayIndex=dayIndex;


			if nextFreezingDayIndex!=-1:
				print("Freezing day:"+str(nextFreezingDayIndex)+", temp="+str(days[nextFreezingDayIndex]['tempmin']))
				GPIO.output(23,GPIO.HIGH)
			else:
				GPIO.output(23,GPIO.LOW)

			if nextColdDayIndex!=-1:
				print("Cold day:"+str(nextColdDayIndex)+", temp="+str(days[nextColdDayIndex]['tempmin']))
				GPIO.output(24,GPIO.HIGH)
			else:
				GPIO.output(24,GPIO.LOW)

			if nextColdDayIndex==-1 and nextFreezingDayIndex==-1:
				GPIO.output(25,GPIO.HIGH)
			else:
				GPIO.output(25,GPIO.LOW)
			print("Total freezing days:{0}".format(totalFreezingDays));
		try:
			time.sleep(UPDATEINTERVAL)
		except KeyboardInterrupt:
			break

	GPIO.output(23,GPIO.LOW)
	GPIO.output(24,GPIO.LOW)
	GPIO.output(25,GPIO.LOW)

main();
