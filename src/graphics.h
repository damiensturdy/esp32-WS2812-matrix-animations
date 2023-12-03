#pragma once

#include "FastLED.h"
#include <stdlib.h>

#define DATA_PIN 13
// #define CLK_PIN   4
#define LED_TYPE WS2811
#define COLOR_ORDER GRB
// Standard brightness limit for fastLED. Good for preventing fires or burning retinas
#define BRIGHTNESS 11
#define SCREEN_WIDTH 16
#define SCREEN_HEIGHT 16
// number of LEDs to skip at the end of each line
// Normally 0 if you've cut and soldered your strip.
#define PORCH 2
#define INVERTED // if every second row is inverted, uuncomment this line, otherwise, comment it out
#define LEDS_PER_LINE (SCREEN_WIDTH + PORCH)
#define NUM_LEDS LEDS_PER_LINE *SCREEN_HEIGHT

namespace Graphics
{
    CRGB buffer[NUM_LEDS];

    // Dirty x,y->index algorythm.
    int LED(int x, int y)
    {
        if (x >= 0 & x < SCREEN_WIDTH || y >= 0 || y < SCREEN_HEIGHT)
        {
#ifdef INVERTED
            if (y % 2 == 1)
            {
                x = (SCREEN_WIDTH - 1) - x;
            }
#endif
            return (y * LEDS_PER_LINE) + x;
        }
        return 0;
    }

    void cls()
    {
        std::fill((char *)&buffer, (char *)&buffer + NUM_LEDS * 4, 0);
    }

    void plot(int x, int y, CRGB colour)
    {
        if (x >= 0 && x < SCREEN_WIDTH && y >= 0 && y < SCREEN_HEIGHT)
        {
            buffer[LED(x, y)] = colour;
        }
    }

    void render()
    {
        FastLED.show();
    }

    void setup()
    {
        // tell FastLED about the LED strip configuration
        FastLED.setDither(BINARY_DITHER);
        FastLED.addLeds<LED_TYPE, DATA_PIN, COLOR_ORDER>(buffer, NUM_LEDS)
            .setCorrection(CRGB(64, 255, 128))
            .setDither(BRIGHTNESS < 255);

        // set master brightness control
        FastLED.setBrightness(BRIGHTNESS);
    }
}