# SHAC - Spherical Harmonic Audio Codec

## Open Format Specification for Spatial Audio

SHAC is an open format for storing and distributing spatial audio using spherical harmonics. This repository contains the format specification and reference decoder implementation.

## Format Overview

SHAC files contain:
- 3rd order ambisonic audio (16 channels)
- Full spherical sound field information
- Metadata for spatial positioning
- Support for multiple audio layers

## Decoder Implementation

The reference decoder is provided in JavaScript for web-based playback:
- `core/shac/decoder/standard_decoder.js` - Reference decoder implementation

## Format Specification

See `SHAC_CODEC.md` for complete technical specification including:
- File structure
- Channel ordering (ACN)
- Normalization (SN3D)
- Metadata format

## Using SHAC Files

To play SHAC files, use:
- **SHAC Player** - Free desktop player available at https://github.com/clarkezyz/shac_player
- **Web Player** - Online player at https://web-production-8a669.up.railway.app

## Creating SHAC Files

To create spatial audio in SHAC format:
- **SHAC Studio** - Professional desktop application for spatial audio creation
- Visit https://shac.audio for more information

## License

The SHAC format specification is open and free to implement. This ensures your spatial audio files will always be playable.

## Contributing

We welcome contributions to improve the decoder implementation and format documentation. Please submit pull requests with:
- Decoder optimizations
- Documentation improvements
- Bug fixes

## Contact

For questions about the SHAC format, please open an issue in this repository.

---

*SHAC - Making spatial audio accessible to everyone*