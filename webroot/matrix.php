<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/octet-stream");

// TODO: More inteligent handling of animation headers and buffers.

$configFile = 'config.txt';
$configLines = file($configFile, FILE_IGNORE_NEW_LINES);

// foreground animation is the first line in config.txt.
// Animations are built back to front before being sent back to the client

$dataFile = $configLines[0];

// if "anim" exists, we're processing requests from the JS editor.
// Currently this is stored in plaintext.

if ($_POST['anim'] != null) {
    $dataFile = $_POST['anim'] . ".bin";
    $configLines[0] = $dataFile;
    $f = fopen($configFile, "w");
    for ($i = 0; $i < count($configLines); $i++) {
        fwrite($f, $configLines[$i]);
        fwrite($f, "\n");
    }
    fclose($f);

    // If "data" exists, we are to store the data.
    if ($_POST['data'] != null) {
        $data = $_POST['data'];
        $lines = explode(',', $data);

        $f = fopen("anims/" . $dataFile, "w");
        for ($i = 0; $i < count($lines); $i++) {
            fwrite($f, $lines[$i]);
            fwrite($f, "\n");
        }
        fclose($f);
    }

    // Echo out the contents of the foreground animation in plaintext.
    echo file_get_contents("anims/" . $dataFile);
    echo "\n";
    exit(0);
}

// This is the request handled by the ESP32.
// We read all files in config.txt back to front
// to compose the final animation
// then pack() this into little-endian 32-bit integers
// to minimise resource usage on the ESP32.
// Nothing clever happens here- it even compares the header.
$files = [];
for ($i = 0; $i < count($configLines); $i++) {
    try {
        $file = file("anims/" . $configLines[$i], FILE_IGNORE_NEW_LINES);
        array_unshift($files, $file);
    } catch (Exception $e) {
    }
}

for ($i = 0; $i < count($files[0]); $i++) {
    $o = 0;
    for ($j = 0; $j < count($files); $j++) {
        if ($files[$j][$i] != "0") {
            $o = $files[$j][$i];
        }
    }
    echo pack("V", $o);
}

exit(0);
