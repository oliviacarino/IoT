#include <ESP8266WiFi.h>
#include <WiFiClient.h>

const char* ssid = "yourWifi";
const char* password = "yourWifiPwd";

WiFiServer server(80);  // Create a server on port 80

void setup() {
    Serial.begin(115200);  // Initialize UART
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Connecting to WiFi...");
    }

    Serial.println("Connected to WiFi");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    server.begin();  // Start the server
}

void loop() {
    WiFiClient client = server.available();  // Listen for incoming clients

    if (client) {
        Serial.println("New Client.");
        Serial.print("Client IP: ");
        Serial.println(client.remoteIP());  // Print the client's IP address
        
        while (client.connected()) {
            if (Serial.available()) {
                char data = Serial.read();
                client.print(data);  // Send data to client
            }

            if (client.available()) {
                char data = client.read();
                Serial.print(data);  // Read data from client
            }
        }
        client.stop();
        Serial.println("Client Disconnected.");
    }
}
