#include <Arduino_GFX_Library.h>
#include <PCA95x5.h>
#define GFX_BL DF_GFX_BL // default backlight pin, you may replace DF_GFX_BL to actual backlight pin

//DISPLAY SETTINGS
/* More dev device declaration: https://github.com/moononournation/Arduino_GFX/wiki/Dev-Device-Declaration */
#if defined(DISPLAY_DEV_KIT)
Arduino_GFX *gfx = create_default_Arduino_GFX();
#else /* !defined(DISPLAY_DEV_KIT) */

#define GFX_DEV_DEVICE ESP32_S3_RGB
#define GFX_BL 45
Arduino_DataBus *bus = new Arduino_SWSPI(
    GFX_NOT_DEFINED /* DC */, PCA95x5::Port::P04 /* CS */,
    41 /* SCK */, 48 /* MOSI */, GFX_NOT_DEFINED /* MISO */);

// For 4" rect display
Arduino_ESP32RGBPanel *rgbpanel = new Arduino_ESP32RGBPanel(
    18 /* DE */, 17 /* VSYNC */, 16 /* HSYNC */, 21 /* PCLK */,
    4 /* R0 */, 3 /* R1 */, 2 /* R2 */, 1 /* R3 */, 0 /* R4 */,
    10 /* G0 */, 9 /* G1 */, 8 /* G2 */, 7 /* G3 */, 6 /* G4 */, 5 /* G5 */,
    15 /* B0 */, 14 /* B1 */, 13 /* B2 */, 12 /* B3 */, 11 /* B4 */,
    1 /* hsync_polarity */, 10 /* hsync_front_porch */, 8 /* hsync_pulse_width */, 50 /* hsync_back_porch */,
    1 /* vsync_polarity */, 10 /* vsync_front_porch */, 8 /* vsync_pulse_width */, 20 /* vsync_back_porch */);
Arduino_RGB_Display *gfx = new Arduino_RGB_Display(
    480 /* width */, 480 /* height */, rgbpanel, 2 /* rotation */, true /* auto_flush */,
    bus, GFX_NOT_DEFINED /* RST */, st7701_type1_init_operations, sizeof(st7701_type1_init_operations));

#endif /* !defined(DISPLAY_DEV_KIT) */
/*******************************************************************************
 * End of Arduino_GFX setting
 ******************************************************************************/

#include <ArduinoHttpClient.h>
#include <WiFi.h>

// Replace WIFI_NAME, WIFI_PASSWORD and IP_ADDRESS with actual credentials
const char* ssid = "WIFI_NAME";
const char* pass = "WIFI_PASSWORD";
//IP_ADDRESS should be in IPv4 format, such as 192.168.8.245
const char* serverIP = "IP_ADDRESS";
const int serverPort = 8081;

WiFiClient wifi;
HttpClient client = HttpClient(wifi, serverIP, serverPort);
//client is Arduino device, server is computer

void setup(void)
{
  Serial.begin(115200);
  Serial.println("Arduino x Defang example");

#ifdef GFX_EXTRA_PRE_INIT
  GFX_EXTRA_PRE_INIT();
#endif

  // Init Display
  if (!gfx->begin())
  {
    Serial.println("gfx->begin() failed!");
  }
  gfx->fillScreen(BLACK);

#ifdef GFX_BL
  pinMode(GFX_BL, OUTPUT);
  digitalWrite(GFX_BL, HIGH);
#endif

  gfx->setCursor(25, 200);
  gfx->setTextColor(0x0C37);
  gfx->setTextSize(4,4,1);
  gfx->println("Welcome to Defang!");

// Wifi Code
  Serial.println("Setting up wifi!");
  
  WiFi.begin(ssid, pass);

  while (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wifi retry in 5 seconds...");
    delay(5000);
  }
  Serial.println("Wifi is connected!");


  delay(5000); // 5 seconds
}

void loop()
{

  String msg = "Develop. Deploy. Debug.";

  gfx->setCursor(random(gfx->width()), random(gfx->height()));
  gfx->setTextColor(random(0xFFFF));
  gfx->setTextSize(2/* x scale */, 2/* y scale */, 2 /* pixel_margin */);
  gfx->println(msg);
  
  gfx->setCursor(25, 200);
  gfx->setTextColor(0xFFFF, 0x0000);
  gfx->setTextSize(4,4,1);
  gfx->println("Welcome to Defang!");

  Serial.println("making POST request");
  String contentType = "application/json";
  String postData = "{\"title\":\""+ msg + "\"}";

  client.post("/tasks", contentType, postData);

  // read the status code and body of the response
  int statusCode = client.responseStatusCode();
  String response = client.responseBody();

  Serial.print("Status code: ");
  Serial.println(statusCode);
  Serial.print("Response: ");
  Serial.println(response);
  Serial.println("Wait five seconds");

  delay(5000); // 5 seconds
}