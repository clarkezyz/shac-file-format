# Technical Overview: SHAC & ZYZ

Quick technical reference for developers implementing spatial audio support.

## Core Concepts

### Spherical Harmonics
SHAC/ZYZ use spherical harmonics to encode 3D spatial audio:
- Mathematical functions that describe directional information
- Enable rotation and positioning in 3D space
- Channel count = (order + 1)² 
- Higher orders = better spatial resolution

### Ambisonic Encoding
```
Order 1 (4 channels): W, Y, Z, X
Order 2 (9 channels): W, Y, Z, X, V, T, R, S, U  
Order 3 (16 channels): W, Y, Z, X, V, T, R, S, U, Q, O, M, K, L, N, P
```

Channel roles:
- **W**: Omnidirectional (most important)
- **XYZ**: First-order directionality
- **Higher**: Increased spatial detail

## Format Quick Reference

### SHAC Header (26 bytes)
```c
struct SHACHeader {
    char magic[4];        // 'SHAC'
    uint16_t version;     // 1
    uint16_t order;       // 1-7
    uint16_t channels;    // (order+1)²
    uint32_t sample_rate; // Hz
    uint32_t bit_depth;   // 16/24/32
    uint32_t samples;     // per channel
    uint16_t layers;      // number of sources
    uint16_t norm;        // 1=SN3D, 2=N3D
};
```

### ZYZ Header (Variable)
```c
struct ZYZHeader {
    char magic[4];        // 'ZYZ1'
    uint16_t layers;      // number of sources
    uint32_t sample_rate; // Hz
    uint16_t order;       // 1-7
    uint16_t channels;    // (order+1)²
    uint16_t quality_len; // length of quality string
    // variable: quality settings string
};
```

## Implementation Essentials

### File Reading Pattern
```javascript
// 1. Read magic bytes, determine format
// 2. Parse header structure
// 3. Read each layer:
//    - Layer name
//    - Metadata (JSON)
//    - Audio data
// 4. Validate consistency
```

### Memory Layout
```
SHAC: [Header][Layer1][Layer2]...[LayerN]
ZYZ:  [Header][Quality][Layer1][Layer2]...[LayerN]

Layer: [Name][Metadata][AudioData]
```

### Audio Data Structure
- **Interleaved**: All channels for sample 1, then sample 2, etc.
- **Channel Order**: ACN (Ambisonic Channel Number)
- **Normalization**: SN3D (default) or N3D
- **Byte Order**: Little-endian

## Spatial Processing

### Position Coordinates
```
X: Left(-) to Right(+)
Y: Down(-) to Up(+)  
Z: Back(-) to Front(+)
Units: Meters
```

### Real-Time Rotation
```javascript
// Rotation matrices for listener movement
function rotateAmbisonics(audioChannels, yaw, pitch, roll) {
    // Apply rotation matrix to all ambisonic channels
    // Preserve channel relationships
    // Update in real-time for navigation
}
```

### Binaural Rendering
```javascript
// Convert ambisonics to stereo headphone output
function binauralRender(ambisonicChannels, hrtfData) {
    // Apply Head-Related Transfer Functions
    // Render to left/right channels
    // Maintain spatial positioning
}
```

## Compression (ZYZ Only)

### Key Principles
1. **Preserve channel relationships** for spatial coherence
2. **Respect ambisonic hierarchy** (W most important)
3. **Maintain mathematical precision** where critical
4. **Optimize for 16-bit representation**

### Decompression Flow
```javascript
async function decompressZYZ(compressedData) {
    // 1. Read compression settings
    // 2. Apply appropriate decompression algorithm
    // 3. Reconstruct ambisonic channels
    // 4. Validate spatial relationships
    // 5. Return SHAC-compatible format
}
```

## Performance Optimization

### Critical Paths
- **File I/O**: Use async loading for large files
- **Memory**: Pre-allocate buffers based on header
- **Processing**: Cache rotation matrices for real-time use
- **Rendering**: Optimize binaural convolution

### Recommended Architecture
```
Parser → Validator → Spatial Processor → Audio Renderer
    ↓        ↓           ↓               ↓
 Format   Integrity   Navigation     Headphones
 Support  Checking    Controls       /Speakers
```

## Error Handling

### Common Issues
- **Alignment errors**: Use proper typed array offsets
- **Buffer overruns**: Always validate read boundaries  
- **Format corruption**: Graceful degradation
- **Unsupported orders**: Fallback to lower orders

### Validation Checklist
```javascript
function validateSpatialFile(data) {
    // ✓ Magic bytes correct
    // ✓ Version supported  
    // ✓ Channel count matches order
    // ✓ Sample count consistent
    // ✓ Layer boundaries valid
    // ✓ Metadata parseable
    // ✓ Audio data complete
}
```

## Web Integration

### Loading Files
```javascript
// File input handling
input.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file.name.endsWith('.shac') || file.name.endsWith('.zyz')) {
        const spatialAudio = await loadSpatialAudio(file);
        setupSpatialPlayer(spatialAudio);
    }
});
```

### Web Audio API Integration
```javascript
// Connect to Web Audio API
const audioContext = new AudioContext();
const spatialProcessor = audioContext.createScriptProcessor(4096, inputChannels, 2);

spatialProcessor.onaudioprocess = (event) => {
    // Process ambisonic input
    // Apply spatial transformations
    // Output binaural stereo
};
```

## Quality Guidelines

### SHAC (Uncompressed)
- **Sample Rate**: 44.1kHz minimum, 48kHz+ preferred
- **Bit Depth**: 24-bit for production, 16-bit acceptable
- **Order**: 3rd order recommended for music
- **Layers**: No practical limit

### ZYZ (Compressed)  
- **Target Compression**: 2-4x for music content
- **Quality**: Spatial positioning preserved >95%
- **Compatibility**: Fully compatible with SHAC workflows
- **Use Cases**: Distribution, streaming, mobile

## Platform Considerations

### Desktop Applications
- Full format support
- Real-time processing capability
- Hardware acceleration available
- Large file handling

### Web Browsers
- WebAssembly for performance-critical code
- Web Audio API for spatial processing
- File size considerations for loading
- Cross-browser compatibility

### Mobile Devices
- ZYZ format preferred for storage efficiency
- Reduced processing complexity for battery life
- Touch/gyroscope navigation interfaces
- Adaptive quality based on device capabilities

## Development Tools

### Format Validation
```bash
# Pseudo-commands for format checking
shac-validate file.shac
zyz-validate file.zyz
spatial-info file.{shac,zyz}
```

### Testing Approaches
- **Spatial accuracy**: Position verification tests
- **Audio quality**: A/B comparison with reference
- **Performance**: Real-time processing benchmarks
- **Compatibility**: Cross-platform validation

## Standards Compliance

### Ambisonic Standards
- **ACN**: Ambisonic Channel Number ordering
- **SN3D**: Schmidt Semi-Normalized (default)
- **N3D**: Fully Normalized (alternative)

### Audio Standards
- **IEEE 754**: Floating-point representation
- **PCM**: Pulse Code Modulation for audio data
- **JSON**: Metadata formatting
- **UTF-8**: Text encoding

---

*This technical overview provides the essential information needed to implement SHAC/ZYZ support. For complete specifications, see the detailed format documents.*

**Ready to join the spatial audio revolution?**