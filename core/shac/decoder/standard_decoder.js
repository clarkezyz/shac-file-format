/**
 * Standard SHAC File Decoder
 * 
 * This is the ONLY decoder for SHAC files. There is only ONE SHAC format.
 * Previous naming as "PythonSHACDecoder" was misleading - all SHAC files
 * use this same format regardless of how they were created.
 * 
 * SHAC Header: 26 bytes (NOT 32)
 * - Magic: 4 bytes ('SHAC')
 * - Version: 2 bytes
 * - Flags: 2 bytes
 * - Number of layers: 2 bytes
 * - Sample rate: 4 bytes
 * - Total samples: 8 bytes
 * - Reserved: 4 bytes
 */

class SHACDecoder {
    constructor() {
        this.MAGIC = new Uint8Array([0x53, 0x48, 0x41, 0x43]); // 'SHAC'
        this.reset();
    }

    reset() {
        this.header = null;
        this.layers = new Map();
        this.fileData = null;
    }

    /**
     * Decode a SHAC file from ArrayBuffer
     * @param {ArrayBuffer} arrayBuffer - The SHAC file data
     * @returns {Promise<Object>} Decoded SHAC data
     */
    async decode(arrayBuffer) {
        this.reset();
        this.fileData = new DataView(arrayBuffer);
        
        try {
            // Read and validate header
            this.readHeader();
            
            // Read layers sequentially (standard SHAC format)
            await this.readLayersSequential();
            
            return {
                header: this.header,
                layers: this.layers,
                layerNames: Array.from(this.layers.keys())
            };
        } catch (error) {
            throw new Error(`SHAC decode error: ${error.message}`);
        }
    }

    /**
     * Read and validate file header
     */
    readHeader() {
        // Check magic bytes
        const magic = new Uint8Array(this.fileData.buffer, 0, 4);
        if (!this.arrayEquals(magic, this.MAGIC)) {
            throw new Error('Invalid SHAC file: incorrect magic bytes');
        }

        // Read header fields (26 bytes total)
        this.header = {
            magic: 'SHAC',
            version: this.fileData.getUint16(4, true),
            flags: this.fileData.getUint16(6, true),
            numLayers: this.fileData.getUint16(8, true),
            sampleRate: this.fileData.getUint32(10, true),
            totalSamples: Number(this.fileData.getBigUint64(14, true)),
            reserved: this.fileData.getUint32(22, true)
        };

        // Validate version
        if (this.header.version !== 1) {
            throw new Error(`Unsupported SHAC version: ${this.header.version}`);
        }
    }

    /**
     * Read layers sequentially (standard SHAC format stores layers inline)
     */
    async readLayersSequential() {
        let offset = 26; // Start after header (26 bytes, not 32)
        
        for (let i = 0; i < this.header.numLayers; i++) {
            if (offset >= this.fileData.byteLength) {
                throw new Error(`Unexpected end of file while reading layer ${i}`);
            }

            try {
                const layer = await this.readLayer(offset);
                this.layers.set(layer.name, layer.data);
                offset = layer.nextOffset;
            } catch (error) {
                throw new Error(`Error reading layer ${i}: ${error.message}`);
            }
        }
    }

    /**
     * Read a single layer
     */
    async readLayer(offset) {
        // Read layer name length
        const nameLength = this.fileData.getUint8(offset);
        offset += 1;

        if (nameLength === 0 || nameLength > 255) {
            throw new Error(`Invalid layer name length: ${nameLength}`);
        }

        // Read layer name
        const nameBytes = new Uint8Array(this.fileData.buffer, offset, nameLength);
        const name = new TextDecoder().decode(nameBytes);
        offset += nameLength;

        // Read flags and metadata
        const flags = this.fileData.getUint16(offset, true);
        const numChannels = this.fileData.getUint16(offset + 2, true);
        const numSamples = Number(this.fileData.getBigUint64(offset + 4, true));
        offset += 12;

        // Calculate data size and read audio data
        const dataSize = numChannels * numSamples * 4; // 32-bit float samples
        if (offset + dataSize > this.fileData.byteLength) {
            throw new Error(`Layer data extends beyond file boundary`);
        }

        // Create Float32Array for each channel
        const audioData = [];
        for (let ch = 0; ch < numChannels; ch++) {
            audioData.push(new Float32Array(numSamples));
        }

        // Read interleaved samples
        for (let i = 0; i < numSamples; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                audioData[ch][i] = this.fileData.getFloat32(offset, true);
                offset += 4;
            }
        }

        return {
            name,
            data: {
                flags,
                numChannels,
                numSamples,
                audioData
            },
            nextOffset: offset
        };
    }

    /**
     * Helper to compare arrays
     */
    arrayEquals(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    /**
     * Static method to load SHAC file from URL
     */
    static async loadFromURL(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const decoder = new SHACDecoder();
            return await decoder.decode(arrayBuffer);
        } catch (error) {
            console.error('Error loading SHAC file:', error);
            throw new Error(`Failed to load SHAC file: ${error.message}`);
        }
    }

    /**
     * Load SHAC file from File object
     */
    static async loadFromFile(file) {
        const arrayBuffer = await file.arrayBuffer();
        const decoder = new SHACDecoder();
        return await decoder.decode(arrayBuffer);
    }
}

// Export as the standard decoder
window.SHACDecoder = SHACDecoder;

// For backwards compatibility, also export as PythonSHACDecoder
// This can be removed once all references are updated
window.PythonSHACDecoder = SHACDecoder;