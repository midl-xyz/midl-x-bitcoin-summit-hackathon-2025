// The underlying buffer implementation in runelib is outdated and does not support the latest Buffer methods.
// This code ensures that the Buffer methods are compatible with the latest standards.

if (typeof window !== "undefined" && typeof Buffer !== "undefined") {
	if (!Buffer.prototype.writeUint8) {
		Buffer.prototype.writeUint8 = Buffer.prototype.writeUInt8;
	}
	if (!Buffer.prototype.writeUint16LE) {
		Buffer.prototype.writeUint16LE = Buffer.prototype.writeUInt16LE;
	}
	if (!Buffer.prototype.writeUint32LE) {
		Buffer.prototype.writeUint32LE = Buffer.prototype.writeUInt32LE;
	}
}
