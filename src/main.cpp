#include "WiFi.h"

#include "FastLED.h"
#include <HTTPClient.h>
#include <WiFiClient.h>
#include <graphics.h>
#include <animation.h>

#define WIFI_SSID "kiwi"
#define WIFI_PWD "bop"
#define REQUEST_ENDPOINT "http:/url-to-matrix.php"

void setup()
{
  delay(500);
  Serial.begin(115200);
  Graphics::setup();
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PWD);
}

unsigned long lastTime = 0;
unsigned long timerDelay = 1010;

void loop()
{
  // Attempting to do this via interrupts triggers watchdog- too slow!
  Animation::loop();
  // Send an HTTP POST request frequently
  if ((millis() - lastTime) > timerDelay)
  {
    lastTime = millis();
    // Check WiFi connection status
    if (WiFi.status() == WL_CONNECTED)
    {
      HTTPClient http;
      // Use http1.0 to prevent chunked encoding.
      http.useHTTP10(true);

      // Your Domain name with URL path or IP address with path
      http.begin(REQUEST_ENDPOINT);
      ;
      // Send HTTP GET request
      int httpResponseCode = http.GET();
      if (httpResponseCode > 0)
      {
        WiFiClient stream = http.getStream();
        Animation::loadFromStream(stream);
      }
      else
      {
        Serial.print("Error code: ");
        Serial.println(httpResponseCode);
      }
      // Free resources
      http.end();
    }
    else
    {
      Serial.println("WiFi Disconnected");
    }
    lastTime = millis();
  }
}
