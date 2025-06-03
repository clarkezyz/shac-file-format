# 🎵 SHAC (Spherical Harmonic Audio Codec) - Complete Technical Documentation

## Overview

SHAC (Spherical Harmonic Audio Codec) is a spatial audio file format and codec that preserves full 3D positional information for multiple audio sources. It enables interactive, immersive audio experiences where listeners can explore sound environments in real-time.

## File Format Specification

### File Extension & Identification
- **Extension**: `.shac`
- **MIME Type**: `audio/x-shac` (proposed)
- **Magic Bytes**: `SHAC` (0x53 0x48 0x41 0x43)

### File Structure

```
SHAC File Layout:
┌─────────────────────────┐
│    File Header (26B)    │  ← Note: 26 bytes, not 32
├─────────────────────────┤
│    Layer 1 Header       │
│    Layer 1 Metadata     │
│    Layer 1 Audio Data   │
├─────────────────────────┤
│    Layer 2 Header       │
│    Layer 2 Metadata     │
│    Layer 2 Audio Data   │
├─────────────────────────┤
│         ...             │
└─────────────────────────┘
```

### Header Format (26 bytes total)

```c
struct SHACHeader {
    char magic[4];        // 'SHAC' (4 bytes)
    uint16_t version;     // File format version (2 bytes)
    uint16_t order;       // Ambisonic order (2 bytes)
    uint16_t n_channels;  // Number of ambisonic channels (2 bytes)
    uint32_t sample_rate; // Sample rate in Hz (4 bytes)
    uint32_t bit_depth;   // Bit depth (16 or 32) (4 bytes)
    uint32_t n_samples;   // Number of samples per channel (4 bytes)
    uint16_t n_layers;    // Number of audio layers (2 bytes)
    uint16_t normalization; // Normalization type (2 bytes)
};
```

### Layer Format

Each layer consists of:
1. **Layer Header** (6 bytes):
   - `uint16_t id_length`: Length of layer ID string (2 bytes)
   - `uint32_t metadata_length`: Length of metadata string (4 bytes)

2. **Layer ID**: UTF-8 encoded string (variable length)

3. **Layer Metadata**: UTF-8 encoded JSON-like string containing:
   - `position`: [x, y, z] coordinates in meters
   - `type`: Source type descriptor
   - `duration`: Length in seconds
   - Additional custom metadata

4. **Audio Data**: Ambisonic audio samples
   - 16-bit: Signed integers (int16)
   - 32-bit: Float32 values
   - Channel order: ACN (Ambisonic Channel Numbering)
   - Data layout: Interleaved channels

## Technical Specifications

### Ambisonic Encoding

#### Supported Orders
- **1st order**: 4 channels (basic spatial)
- **3rd order**: 16 channels (recommended for music)
- **5th order**: 36 channels (professional quality)
- **7th order**: 64 channels (maximum resolution)

#### Channel Count Formula
`n_channels = (order + 1)²`

#### Normalization Schemes
- **SN3D** (default): Semi-normalized spherical harmonics
- **N3D**: Fully normalized
- **maxN**: Legacy compatibility

#### Channel Ordering
Uses ACN (Ambisonic Channel Numbering):
- Channel 0: W (omnidirectional)
- Channel 1: Y (front-back)
- Channel 2: Z (up-down)
- Channel 3: X (left-right)
- etc.

### Spherical Coordinate System
- **Azimuth**: 0° = front, 90° = left, 180° = back, 270° = right
- **Elevation**: -90° = below, 0° = horizon, 90° = above
- **Distance**: Meters from origin (listener position)

### Binaural Rendering
SHAC files are rendered to stereo headphones using:
1. **HRTF Processing**: Head-Related Transfer Functions for 3D perception
2. **Distance Attenuation**: 1/r² law with near-field compensation
3. **Room Modeling**: Optional reverb and early reflections
4. **Smooth Interpolation**: Prevents artifacts during movement

## Implementation Details

### Python Implementation

#### Writing SHAC Files
```python
from core.shac.codec import SHACFileWriter
from core.shac.codec.math_utils import AmbisonicNormalization

# Create writer
writer = SHACFileWriter(
    order=3,
    sample_rate=48000,
    normalization=AmbisonicNormalization.SN3D
)

# Add layers with spatial positions
writer.add_layer('drums', drum_audio, {
    'position': [0, 0, 0],      # Center
    'type': 'percussion'
})
writer.add_layer('bass', bass_audio, {
    'position': [-2, -1, 0],    # Left side
    'type': 'bass'
})

# Write file
writer.write_file('output.shac', bit_depth=32)
```

#### Reading SHAC Files
```python
from core.shac.codec import SHACFileReader

# Open file
reader = SHACFileReader('input.shac')

# Get file info
info = reader.get_file_info()
print(f"Order: {info['order']}, Layers: {info['n_layers']}")

# Read specific layer
audio_data = reader.read_layer('drums')
```

### JavaScript Implementation (Web Player)

#### Decoding SHAC Files
```javascript
class PythonSHACDecoder {
    async decode(arrayBuffer) {
        const dataView = new DataView(arrayBuffer);
        
        // Read 26-byte header
        const header = {
            magic: String.fromCharCode(...new Uint8Array(arrayBuffer, 0, 4)),
            version: dataView.getUint16(4, true),
            order: dataView.getUint16(6, true),
            n_channels: dataView.getUint16(8, true),
            sample_rate: dataView.getUint32(10, true),
            bit_depth: dataView.getUint32(14, true),
            n_samples: dataView.getUint32(18, true),
            n_layers: dataView.getUint16(22, true),
            normalization: dataView.getUint16(24, true)
        };
        
        // Read layers sequentially
        let offset = 26;
        const layers = new Map();
        
        for (let i = 0; i < header.n_layers; i++) {
            // Read layer header
            const idLength = dataView.getUint16(offset, true);
            const metadataLength = dataView.getUint32(offset + 2, true);
            offset += 6;
            
            // Read layer data
            const layerId = new TextDecoder().decode(
                new Uint8Array(arrayBuffer, offset, idLength)
            );
            offset += idLength;
            
            // Continue reading metadata and audio...
        }
        
        return { header, layers };
    }
}
```

## Audio Processing Pipeline

### Encoding Pipeline
```
Mono Source → Spherical Positioning → Ambisonic Encoding → SHAC File
```

### Playback Pipeline
```
SHAC File → Ambisonic Decoding → Rotation → Binaural Rendering → Stereo Output
```

### Real-time Processing
1. **Buffer Management**: Efficient pooling prevents allocation
2. **SIMD Optimization**: Vectorized math operations
3. **Streaming Support**: Progressive loading for large files
4. **Adaptive Quality**: Reduces order under high CPU load

## Performance Characteristics

### File Size
- Ambisonic data scales with order:
  - 1st order: ~2x stereo size
  - 3rd order: ~8x stereo size
  - 5th order: ~18x stereo size

### CPU Usage
- **Encoding**: Minimal (one-time spherical harmonic calculation)
- **Rotation**: Low (matrix multiplication)
- **Binaural Rendering**: Moderate (convolution per channel)
- **Total**: ~5-15% on modern CPUs for 3rd order

### Memory Requirements
- **Streaming**: 2-4MB buffer per layer
- **Full Load**: File size + processing buffers
- **Optimization**: Reusable buffer pools

### Latency
- **Target**: <20ms total system latency
- **Processing**: ~5ms for 3rd order
- **Buffering**: Configurable (typically 10-15ms)

## Use Cases & Applications

### Weather-Tune Integration
- Each weather element gets spatial position
- Dynamic movement based on conditions
- Immersive weather environments
- Musical elements respond to weather

### Musical Applications
- **Band Placement**: Each instrument in 3D space
- **Concert Hall**: Natural acoustics preserved
- **Electronic Music**: Sounds orbit and move
- **Mixing**: Post-production spatial control

### Creative Possibilities
- **Sound Sculptures**: Explorable audio art
- **Meditation**: Immersive environments
- **Gaming**: True 3D audio without engines
- **VR/AR**: Ready for spatial computing

## Advantages Over Traditional Formats

| Feature | WAV/MP3 | 5.1 Surround | SHAC |
|---------|---------|--------------|------|
| Channel Count | 2 | 6 | 4-64 |
| Spatial Resolution | None | Fixed | Infinite |
| Head Tracking | No | No | Yes |
| Source Separation | No | Limited | Full |
| Interactive | No | No | Yes |
| File Size | 1x | 3x | 2-18x |
| CPU Usage | Minimal | Low | Moderate |

## Best Practices

### Content Creation
1. **Source Quality**: Use clean, mono sources
2. **Positioning**: Place sources meaningfully in space
3. **Movement**: Smooth transitions prevent artifacts
4. **Distance**: Keep important sounds within 10m
5. **Order Selection**: Match quality needs vs performance

### Technical Implementation
1. **Buffer Sizes**: 512-2048 samples for low latency
2. **Sample Rate**: 48kHz recommended
3. **Bit Depth**: 32-bit float for processing
4. **Normalization**: Use SN3D for compatibility
5. **Metadata**: Include semantic information

## Future Roadmap

### Planned Features
- **Compression**: Lossy codec for smaller files
- **Streaming Protocol**: Live SHAC broadcasting
- **6DOF Support**: Full volumetric audio
- **AI Enhancement**: Automatic spatial mixing
- **Standard Adoption**: Industry standardization

### Research Areas
- **Personalized HRTF**: Individual ear measurements
- **Room Learning**: AI-based acoustics
- **Semantic Audio**: Object-based mixing
- **Haptic Integration**: Feel the bass direction

## Conclusion

SHAC transforms audio from a fixed stereo image into an explorable 3D environment. By preserving spatial relationships and enabling real-time interaction, it opens new possibilities for musical expression, sound design, and immersive experiences. The format is production-ready, with implementations in Python for creation and JavaScript for web playback.

---

*"Not just stereo. Not just surround. Truly spatial."*

## Technical References

- [Ambisonics Theory](https://www.ambisonic.net/)
- [Spherical Harmonics](https://en.wikipedia.org/wiki/Spherical_harmonics)
- [HRTF Databases](https://www.sofaconventions.org/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)