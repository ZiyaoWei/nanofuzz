import * as ParserAdapter from "../adapters/ParserAdapter";
import * as ProgramFactory from "./ProgramFactory";
import { ProgramLanguage } from "./Types";

// Each module's source is `leading + rest`: new imports belong in between
const importInsertionCases: Record<
  string,
  { lang: ProgramLanguage; leading: string; rest: string }
> = {
  "after a Python shebang": {
    lang: "python",
    leading: "#!/usr/bin/env python3\n",
    rest: "x = 1\n",
  },
  "after a Python module docstring": {
    lang: "python",
    leading: '"""Utilities."""\n',
    rest: "x = 1\n",
  },
  "after Python `from __future__` imports": {
    lang: "python",
    leading: "from __future__ import annotations\n",
    rest: "x = 1\n",
  },
  "after a TypeScript shebang": {
    lang: "typescript",
    leading: "#!/usr/bin/env node\n",
    rest: "const x = 1;\n",
  },
  "after Rust inner attributes": {
    lang: "rust",
    leading: "#![allow(dead_code)]\n",
    rest: "fn f() {}\n",
  },
  "after Rust inner doc comments": {
    lang: "rust",
    leading: "//! Utilities.\n",
    rest: "fn f() {}\n",
  },
  "after a Java package declaration": {
    lang: "java",
    leading: "package com.example;\n",
    rest: "class A {}\n",
  },
  "after a Go package clause": {
    lang: "go",
    leading: "package main\n",
    rest: "var x = 1\n",
  },
};

describe("src/fuzzer/analysis/AbstractProgram", () => {
  beforeAll(async () => {
    await ParserAdapter.init();
  });

  describe("importInsertionOffset", () => {
    for (const [name, { lang, leading, rest }] of Object.entries(
      importInsertionCases
    )) {
      it(`is ${name}`, () => {
        const program = ProgramFactory.fromSource(() => leading + rest, lang);
        expect(program.importInsertionOffset).toBe(leading.length);
      });
    }
  });
});
