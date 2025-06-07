# SHAC Format Specification

**Spherical Harmonic Audio Codec (.shac)**

The foundational format for interactive spatial audio experiences.

## Overview

SHAC files store multiple audio sources with their 3D spatial positions encoded as spherical harmonic coefficients. This enables real-time navigation through the spatial audio scene using standard game controllers.

## File Structure

### Header (26 bytes fixed)

| Offset | Size | Type | Description |
|--------|------|------|-------------|
| 0 | 4 | char[4] | Magic bytes: 'SHAC' |
| 4 | 2 | uint16 | Version (currently 1) |
| 6 | 2 | uint16 | Ambisonic order (1-7) |
| 8 | 2 | uint16 | Number of channels |
| 10 | 4 | uint32 | Sample rate (Hz) |
| 14 | 4 | uint32 | Bit depth (16, 24, or 32) |
| 18 | 4 | uint32 | Total samples per channel |
| 22 | 2 | uint16 | Number of layers |
| 24 | 2 | uint16 | Normalization (1=SN3D, 2=N3D) |

### Layer Structure (variable length)

Each layer represents one audio source positioned in 3D space:

```
Layer Header:
- ID Length (2 bytes): Length of layer identifier
- Metadata Length (4 bytes): Length of metadata section
- Layer ID (variable): String identifier for this layer
- Metadata (variable): JSON-formatted positioning and properties

Audio Data:
- Interleaved ambisonic channels
- Sample format determined by header bit depth
- Channel count = (order + 1)²
```

### Channel Ordering

Channels follow ACN (Ambisonic Channel Number) ordering:

**1st Order (4 channels):**
- W (omnidirectional)
- Y (front-back)  
- Z (up-down)
- X (left-right)

**Higher Orders:**
- Additional harmonics for increased spatial resolution
- Up to 7th order (64 channels) supported

## Metadata Format

Layer metadata is stored as JSON with these standard fields:

```json
{
  "position": [x, y, z],
  "gain": 1.0,
  "source_type": "mono",
  "room_model": {
    "reflection_coefficient": 0.7,
    "room_size": [10, 8, 3]
  }
}
```

### Position Coordinate System
- **X**: Left (-) to Right (+)
- **Y**: Down (-) to Up (+)  
- **Z**: Back (-) to Front (+)
- Units: Meters from listener origin

## Mathematical Foundation

### Spherical Harmonics
SHAC uses real-valued spherical harmonics to encode 3D spatial information:

```
Y_l^m(θ, φ) = N_l^m × P_l^|m|(cos θ) × f_m(φ)
```

Where:
- `l` = harmonic order (0 to max_order)
- `m` = harmonic degree (-l to +l)
- `θ` = elevation angle
- `φ` = azimuth angle
- `N_l^m` = normalization factor
- `P_l^|m|` = associated Legendre polynomial

### Normalization
SN3D (Schmidt Semi-Normalized) is the default:
```
N_l^m = √[(2l+1) × (l-|m|)! / (4π × (l+|m|)!)]
```

## Real-Time Processing

### Navigation
Listener movement is implemented through ambisonic rotation:
1. Calculate rotation matrices for yaw, pitch, roll
2. Apply rotation to all ambisonic channels
3. Render to binaural output for headphones

### Decoding
For speaker playback:
1. Extract ambisonic channels
2. Apply decoding matrix for speaker configuration
3. Output to appropriate speaker feeds

## Implementation Guidelines

### Reading Files
1. Verify magic bytes and version
2. Parse header for format parameters
3. Read each layer sequentially
4. Validate metadata JSON
5. Load audio data with proper channel mapping

### Performance Optimization
- Use rotation matrix caching for real-time playback
- Implement vectorized spherical harmonic calculations
- Pre-allocate audio buffers based on header information

### Error Handling
- Validate all file structure boundaries
- Check for consistent sample counts across layers
- Verify channel count matches ambisonic order
- Handle corrupted metadata gracefully

## Quality Considerations

### Ambisonic Order Selection
- **1st Order**: Basic spatial positioning (4 channels)
- **2nd Order**: Good spatial definition (9 channels)
- **3rd Order**: Recommended for music (16 channels)
- **Higher Orders**: Increased spatial resolution at cost of file size

### Sample Rate Recommendations
- **44.1 kHz**: Standard music quality
- **48 kHz**: Professional audio production
- **96 kHz**: High-resolution spatial audio

## Compatibility

### Platform Support
- Web browsers via Web Audio API
- Desktop applications with audio library integration
- Mobile devices with sufficient processing power
- Hardware decoders with ambisonic support

### Interoperability
- Standard ambisonic channel ordering (ACN)
- Common normalization schemes (SN3D/N3D)
- JSON metadata for cross-platform parsing
- Little-endian byte ordering

---

*This specification enables developers to create compatible SHAC readers and players while maintaining the spatial audio revolution's accessibility and quality.*