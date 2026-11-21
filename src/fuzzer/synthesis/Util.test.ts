import { insertIntoBytes } from "./Util";

describe("src/fuzzer/synthesis/Util", () => {
  describe("insertIntoBytes", () => {
    it("keeps bytes that are not valid UTF-8", () => {
      // In Latin-1, `é` is the byte 0xE9, which is not valid UTF-8. Latin-1
      // also decodes each byte to one character, so comparing the decoded
      // text compares the bytes.
      const bytes = Buffer.from('"""Café."""\ns = "café"\n', "latin1");
      const offset = bytes.toString().indexOf("s = ");
      expect(
        insertIntoBytes(bytes, offset, "import os\n").toString("latin1")
      ).toBe('"""Café."""\nimport os\ns = "café"\n');
    });
  });
});
