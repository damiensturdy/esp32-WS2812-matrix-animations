#pragma once

#include <graphics.h>
#include <WiFiClient.h>

namespace Animation
{
    struct AnimHeader
    {
        int frames;
        int width;
        int height;
    };

    // The loaded spritesheet.
    AnimHeader header = {.frames = 8, .width = 128, .height = 128};

    int currentFrame = 0;
    int framebuffer[128 * 128];

    int lastAnimFrame = 0;

    void renderFrame()
    {
        currentFrame = (currentFrame + 1) % header.frames;
        int offsetX = currentFrame % (header.width / SCREEN_WIDTH) * SCREEN_WIDTH;
        int offsetY = (currentFrame / SCREEN_WIDTH) * SCREEN_HEIGHT;
        for (int y = 0; y < SCREEN_WIDTH; y++)
        {
            for (int x = 0; x < SCREEN_HEIGHT; x++)
            {
                Graphics::plot(x, (SCREEN_HEIGHT - y) - 1, CRGB(framebuffer[offsetX + x + ((offsetY + y) * header.width)]));
            }
        }
        Graphics::render();
    }

    void checkAnim()
    {
        if ((millis() - lastAnimFrame) > 100)
        {
            renderFrame();
            lastAnimFrame = millis();
        }
    }

    void loadFromStream(WiFiClient stream)
    {
        AnimHeader newHeader = {.frames = 0, .width = 0, .height = 0};
        stream.readBytes((char *)&newHeader, sizeof(newHeader));
        if (newHeader.frames == 0 || newHeader.width == 0 || newHeader.height == 0)
        {
            return;
        }

        Animation::header = newHeader;
        // Split the read so we can update the animation.
        // Pretty sure chunked encoding is causing the occasional messed up pixel.
        // Need to copy code from HTTPClient.cpp to handle different encoding types or find a way
        // to force identity encoding.
        // ...or simply TODO: get interrupt driven updates working...
        int index = 0;
        int rdms = millis();
        while ((index < (header.width * header.height * 4)) && millis() - rdms < 1000)
        {
            index += stream.readBytes((char *)&framebuffer + index, 16);
            delay(1);
            checkAnim();
        }
    }

    void loop()
    {
        checkAnim();
    }

}