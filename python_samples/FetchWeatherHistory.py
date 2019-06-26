import csv
import codecs
import urllib.request
import sys

# This is the core of our weather query URL
BaseURL = 'http://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/weatherdata/'

if len(sys.argv) < 4:
    print('')
    print('Usage: FetchWeather Location Date API_KEY')
    print()
    print('  Location: Please provide a location for the weatch search.')
    print('    (Make sure to use quotes if the name contains spaces.)')
    print('  Date: Please specify a date in the format YYYY-MM-DD to look up weather for a specific date.')
    print('    Or use the FORECAST to look up the current weather forcast.')
    print('  API_KEY: Please specify your Visual Crossing Weather API Key')
    print('    If you don\'t already have an API Key, get one at www.visualcrossing.com/weather-api.')
    print()
    print('Example: FetchWeather \"Herndon, VA\" 2006-04-12 KEY_123')
    print('Example: FetchWeather \"Beverly Hills, CA\" FORECAST KEY_123')
    print()
    sys.exit()

print('')
print(' - Requesting weather for: ', sys.argv[1])

DateParam = sys.argv[2].upper()

# Set up the location parameter for our query
QueryLocation = '&location=' + urllib.parse.quote(sys.argv[1])

# Set up the key parameter for our query
QueryKey = '&key=' + sys.argv[3]

# Set up the specific parameters based on the type of query
if DateParam == 'FORECAST':
    print(' - Fetching forecast data')
    QueryTypeParams = 'forecast?&aggregateHours=24&unitGroup=us&shortColumnNames=false'
else:
    print(' - Fetching history for date: ', DateParam)

    # History requests require a date.  We use the same date for start and end since we only want to query a single date in this example
    QueryDate = '&startDateTime=' + DateParam + 'T00:00:00&endDateTime=' + sys.argv[2] + 'T00:00:00'
    QueryTypeParams = 'history?&aggregateHours=24&unitGroup=us&dayStartTime=0:0:00&dayEndTime=0:0:00' + QueryDate


# Build the entire query
URL = BaseURL + QueryTypeParams + QueryLocation + QueryKey

print(' - Running query URL: ', URL)
print()

# Parse the results as CSV
CSVBytes = urllib.request.urlopen(URL)
CSVText = csv.reader(codecs.iterdecode(CSVBytes, 'utf-8'))

RowIndex = 0

# The first row contain the headers and the additional rows each contain the weather metrics for a single day
# To simply our code, we use the knowledge that column 0 contains the location and column 1 contains the date.  The data starts at column 4
for Row in CSVText:
    if RowIndex == 0:
        FirstRow = Row
    else:
        print('Weather in ', Row[0], ' on ', Row[1])

        ColIndex = 0
        for Col in Row:
            if ColIndex >= 4:
                print('   ', FirstRow[ColIndex], ' = ', Row[ColIndex])
            ColIndex += 1
    RowIndex += 1

# If there are no CSV rows then something fundamental went wrong
if RowIndex == 0:
    print('Sorry, but it appears that there was an error connecting to the weather server.')
    print('Please check your network connection and try again..')

# If there is only one CSV  row then we likely got an error from the server
if RowIndex == 1:
    print('Sorry, but it appears that there was an error retrieving the weather data.')
    print('Error: ', FirstRow)

print()

