console.log("Starting simple test...");

try {
  const { workersQBAdapter } = require("./src/index.ts");
  console.log("Successfully imported workersQBAdapter");
} catch (error) {
  console.error("Error importing:", error);
}

console.log("Test complete.");