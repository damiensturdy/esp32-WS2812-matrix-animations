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
    AnimHeader header = {.frames = 1, .width = 128, .height = 128};
    int currentFrame = 0;
    int framebuffer[128 * 128] = {};

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

    void loadFromStream(WiFiClient stream) {
       AnimHeader newHeader = {.frames = 0, .width = 0, .height = 0};
        stream.readBytes((char *)&newHeader, sizeof(newHeader));
        if (newHeader.frames == 0 || newHeader.width == 0 || newHeader.height == 0)
        {
          return;
        }

        Animation::header = newHeader;

        // Split the read so we can update the animation.
        for (int y = 0; y < header.height; y++)
        {
          stream.readBytes((char *)&framebuffer[y * header.width], header.height * 4);
          checkAnim();
        }
    }

    void loop() {
        checkAnim();
    }
}