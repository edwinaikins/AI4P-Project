export function parseJSONFromText(fullText) {
  try {
    const arrayStart = fullText.indexOf("[");
    const arrayEnd = fullText.lastIndexOf("]");
    if (arrayStart !== -1 && arrayEnd !== -1) {
      return JSON.parse(fullText.slice(arrayStart, arrayEnd + 1));
    }

    const objectStart = fullText.indexOf("{");
    const objectEnd = fullText.lastIndexOf("}");
    if (objectStart !== -1 && objectEnd !== -1) {
      return JSON.parse(fullText.slice(objectStart, objectEnd + 1));
    }

    const objectMatches = fullText.match(/{[^}]+}/g);
    if (objectMatches && objectMatches.length > 0) {
      return JSON.parse(`[${objectMatches.join(",")}]`);
    }

    throw new Error("No valid JSON found in output.");
  } catch (err) {
    console.error("❌ JSON parsing failed:", err.message);
    throw err;
  }
}
