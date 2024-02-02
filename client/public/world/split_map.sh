#!/bin/bash

# Default values
input_image="colors.png"
segment_width=256
segment_height=256
top_left_x=-1
top_left_y=-1

# Check and assign command-line parameters if provided
if [ "$#" -ge 1 ]; then input_image="$1"; fi
if [ "$#" -ge 2 ]; then segment_width="$2"; fi
if [ "$#" -ge 3 ]; then segment_height="$3"; fi
if [ "$#" -ge 4 ]; then top_left_x="$4"; fi
if [ "$#" -ge 5 ]; then top_left_y="$5"; fi

# Get dimensions of the input image
image_width=$(identify -format "%w" "$input_image")
image_height=$(identify -format "%h" "$input_image")

# Calculate the number of segments in both directions
num_segments_x=$((image_width / segment_width))
num_segments_y=$((image_height / segment_height))

# Get the base name of the input file without extension
base_name=$(basename "$input_image" | cut -f 1 -d '.')

# Loop over each segment and extract it
for (( x=0; x<num_segments_x; x++ )); do
    for (( y=0; y<num_segments_y; y++ )); do
        # Calculate the top-left pixel coordinate for the current segment
        offset_x=$((x * segment_width))
        offset_y=$((y * segment_height))

        # Calculate the naming coordinate
        name_x=$((top_left_x + x))
        name_y=$((top_left_y + y))

        # File name for the segment
        output_file=":${name_y}:${name_x}/${base_name}.png"

        # Create directory if it doesn't exist
        mkdir -p "$(dirname "$output_file")"

        # Extract the segment
        convert "$input_image" -crop "${segment_width}x${segment_height}+${offset_x}+${offset_y}" +repage "$output_file"
    done
done

echo "Segmentation completed."
