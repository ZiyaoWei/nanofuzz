const vscode = acquireVsCodeApi();

// Attach main to the window onLoad() event
window.addEventListener("load", main);

// List of output grids that store fuzzer results
const gridTypes = ["timeout", "exception", "badOutput", "passed"];

/**
 * Sets up the UI when the page is loaded, including setting up
 * event handlers and filling the output grids if data is available.
 */
function main() {
  // Add event listener for the fuzz.start button
  document
    .getElementById("fuzz.start")
    .addEventListener("click", (e) => handleFuzzStart(e));

  // Add event listener for the fuzz.options button
  document
    .getElementById("fuzz.options")
    .addEventListener("click", (e) => toggleFuzzOptions(e));

  // Load the data from the HTML
  const resultsData = JSON.parse(
    htmlEscape(document.getElementById("fuzzResultsData").innerHTML)
  );

  // Load and save the state back to the webview.  There does not seem to be
  // an 'official' way to directly persist state within the extension itself,
  // at least as of vscode 1.69.2.  Hence, the roundtrip.
  vscode.setState(
    JSON.parse(htmlEscape(document.getElementById("fuzzPanelState").innerHTML))
  );

  // Fill the result grids
  if (Object.keys(resultsData).length) {
    const data = {};
    gridTypes.forEach((type) => {
      data[type] = [];
    });

    // Loop over each result
    for (const e of resultsData.results) {
      // Name each input argument and make it clear which inputs were not provided
      // (i.e., the argument was optional).  Otherwise, stringify the value for
      // display.
      const inputs = {};
      e.input.forEach((i) => {
        inputs[`input: ${i.name}`] =
          i.value === undefined ? "(no input)" : JSON.stringify(i.value);
      });

      // There are 0-1 outputs: if an output is present, just name it `output`
      // and make it clear which outputs are undefined.  Otherwise, stringify
      // the value for display.
      const outputs = {};
      e.output.forEach((o) => {
        outputs[`output`] =
          o.value === undefined ? "undefined" : JSON.stringify(o.value);
      });

      // Toss each result into the appropriate grid
      if (e.passed) {
        data["passed"].push({ ...inputs, ...outputs });
      } else {
        if (e.exception) {
          data["exception"].push({ ...inputs, exception: e.exceptionMessage });
        } else if (e.timeout) {
          data["timeout"].push({ ...inputs });
        } else {
          data["badOutput"].push({ ...inputs, ...outputs });
        }
      }
    } // for: each result

    // Fill the grids with data
    gridTypes.forEach((type) => {
      if (data[type].length) {
        document.getElementById(`fuzzResultsGrid-${type}`).rowsData =
          data[type];
      }
    });
  }
} // fn: main

/**
 * Toggles whether more fuzzer options are shown.
 *
 * @param e onClick() event
 */
function toggleFuzzOptions(e) {
  const fuzzOptions = document.getElementById("fuzzOptions");
  if (fuzzOptions.style.display === "none") {
    fuzzOptions.style.display = "block";
    e.currentTarget.innerHTML = "Fewer options";
  } else {
    fuzzOptions.style.display = "none";
    e.currentTarget.innerHTML = "More options";
  }
} // fn: toggleFuzzOptions

/**
 * Handles the fuzz.start button onClick() event: retrieves the fuzzer options
 * from the UI and sends them to the extension to start the fuzzer.
 *
 * @param e onClick() event
 */
function handleFuzzStart(e) {
  const overrides = { fuzzer: {}, args: [] }; // Fuzzer option overrides (from UI)
  const disableArr = [e.currentTarget]; // List of controls to disable while fuzzer is busy
  const fuzzBase = "fuzz"; // Base html id name

  // Process fuzzer options
  ["suiteTimeout", "maxTests", "fnTimeout"].forEach((e) => {
    const item = document.getElementById(fuzzBase + "-" + e);
    if (item !== null) {
      disableArr.push(item);
      overrides.fuzzer[e] = parseInt(item.getAttribute("current-value"));
    }
  });

  // Process all the argument overrides
  for (let i = 0; document.getElementById(getIdBase(i)) !== null; i++) {
    const idBase = getIdBase(i);
    const thisOverride = {};
    overrides.args.push(thisOverride);

    // Get the min and max values
    const min = document.getElementById(idBase + "-min");
    const max = document.getElementById(idBase + "-max");
    if (min !== null && max !== null) {
      disableArr.push(min, max);
      const minVal = min.getAttribute("current-value");
      const maxVal = max.getAttribute("current-value");
      if (minVal !== undefined && maxVal !== undefined) {
        thisOverride["min"] = Number(minVal);
        thisOverride["max"] = Number(maxVal);
      }
    } // TODO: Validation !!!

    // Get the number type
    const numInteger = document.getElementById(idBase + "-numInteger");
    if (numInteger !== null) {
      disableArr.push(numInteger);
      thisOverride["numInteger"] =
        numInteger.getAttribute("current-checked") === "true" ? true : false;
    }

    // Get boolean values
    const trueFalse = document.getElementById(idBase + "-trueFalse");
    const trueOnly = document.getElementById(idBase + "-trueOnly");
    const falseOnly = document.getElementById(idBase + "-falseOnly");
    if (trueFalse !== null && trueOnly !== null && falseOnly !== null) {
      disableArr.push(trueFalse, trueOnly, falseOnly);
      thisOverride["min"] =
        trueOnly.getAttribute("current-checked") === "true" ? true : false;
      thisOverride["max"] =
        falseOnly.getAttribute("current-checked") === "true" ? false : true;
    }

    // Get the string length min and max
    const minStrLen = document.getElementById(idBase + "-minStrLen");
    const maxStrLen = document.getElementById(idBase + "-maxStrLen");
    if (minStrLen !== null && maxStrLen !== null) {
      disableArr.push(minStrLen, maxStrLen);
      const minStrLenVal = minStrLen.getAttribute("current-value");
      const maxStrLenVal = maxStrLen.getAttribute("current-value");
      if (minStrLenVal !== undefined && maxStrLenVal !== undefined) {
        thisOverride["minStrLen"] = Number(minStrLenVal);
        thisOverride["maxStrLen"] = Number(maxStrLenVal);
      }
    } // TODO: Validation !!!

    // Get the min and max for each array dimension
    const dimLength = [];
    let dim = 0;
    let arrayBase = `${idBase}-array-${dim}`;
    while (document.getElementById(`${arrayBase}-min`) !== null) {
      const min = document.getElementById(`${arrayBase}-min`);
      const max = document.getElementById(`${arrayBase}-max`);
      if (min !== null && max !== null) {
        disableArr.push(min, max);
        const minVal = min.getAttribute("current-value");
        const maxVal = max.getAttribute("current-value");
        if (minVal !== undefined && maxVal !== undefined) {
          dimLength.push({ min: Number(minVal), max: Number(maxVal) });
        }
      }
      arrayBase = `${idBase}-array-${++dim}`;
    }
    if (dimLength.length > 0) {
      thisOverride["dimLength"] = dimLength;
    }
  }

  // Disable input elements while the Fuzzer runs.
  disableArr.forEach((e) => {
    e.style.disabled = true;
  });

  // Send the fuzzer start command to the extension
  vscode.postMessage({
    command: "fuzz.start", // !!!
    json: JSON.stringify(overrides),
  });
} // fn: handleFuzzStart

/**
 * Returns a base id name for a particular argument input.
 *
 * @param i unique argument id
 * @returns HTML id for the argument
 */
function getIdBase(i) {
  return "argDef-" + i;
}

/**
 * Adapted from: escape-goat/index.js
 *
 * Unescapes an HTML string.
 *
 * @param html HTML to unescape
 * @returns unescaped string
 */
function htmlEscape(html) {
  return html
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&#0?39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");
}
