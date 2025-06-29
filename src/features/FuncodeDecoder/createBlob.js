"use client";

/**
 * From https://gist.github.com/nolanlawson/10340255
 */
module.exports = function createBlob(parts, properties) {
  parts = parts || [];
  properties = properties || {};
  try {
    return new Blob(parts, properties);
  } catch (e) {
    if (e.name !== "TypeError") {
      throw e;
    }
    var BlobBuilder =
      window.BlobBuilder ||
      window.MSBlobBuilder ||
      window.MozBlobBuilder ||
      window.WebKitBlobBuilder;
    var builder = new BlobBuilder();
    for (var i = 0; i < parts.length; i += 1) {
      builder.append(parts[i]);
    }
    return builder.getBlob(properties.type);
  }
};
