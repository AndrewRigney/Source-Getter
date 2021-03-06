(function () {
  "use strict";

  var d = document;

  var tableWrappers = d.querySelectorAll(".table-wrapper");

  var tablesVisibleCheckbox = d.querySelectorAll(".table-visible-checkbox");

  tablesVisibleCheckbox[0].addEventListener("change", showHideTables);
  tablesVisibleCheckbox[1].addEventListener("change", showHideTables);
  tablesVisibleCheckbox[2].addEventListener("change", showHideTables);

  var copyButtons = d.querySelectorAll(".copy-btn");

  copyButtons[0].addEventListener("click", function () {
    copyText(rawDisplay, this);
  });
  copyButtons[1].addEventListener("click", function () {
    copyText(renderedDisplay, this);
  });
  copyButtons[2].addEventListener("click", function () {
    copyText(diffDisplay, this);
  });

  var fetchAsMobile = d.getElementById("as-mobile-checkbox");
  var fetchAsGoogle = d.getElementById("as-google-checkbox");
  var fetchAsBtn = d.getElementById("fetch-as-btn");

  //all 3 tables
  var tables = d.querySelectorAll("table");

  //individual
  var rawDisplay = d.getElementById("raw-display");
  var renderedDisplay = d.getElementById("rendered-display");
  var diffDisplay = d.getElementById("diff-display");

  //all table headings
  var tableHeadElAll = d.querySelectorAll(".table-head");
  var tableTop = tableHeadElAll[0].getBoundingClientRect().top;

  var currentURL = d.getElementById("current-url");
  var currentURLHref = d.getElementById("current-url-href");
  var currentURLShow = false;

  var rawStatus = d.getElementById("raw-status");
  var renderedStatus = d.getElementById("rendered-status");
  var diffStatus = d.getElementById("diff-status");

  var fetchTypeRaw = d.getElementById("fetch-type-raw");
  var fetchTypeRendered = d.getElementById("fetch-type-rendered");

  //get tabID from URL parameter
  var thisURL = new URL(window.location.href);
  var tabID = thisURL.searchParams.get("tabID");

  var doctype, userAgent, responseRaw, responseRendered, rawURL;
  var allDiffItems,
    allDiffItemsPos = [];

  var diffWorker = new Worker("scripts/diffWorker.js");

  //var highlightStyle = d.getElementById('highlight-style')
  //var theme = d.getElementById('theme');

  var backToTop = d.getElementById("back-to-top");
  backToTop.addEventListener("click", function () {
    window.scrollTo(0, 0);
  });

  //restore settings from storage
  chrome.storage.sync.get(
    {
      //defaults
      tableActiveRaw: true,
      tableActiveRendered: true,
      tableActiveDiff: true,
    },
    function (items) {
      tablesVisibleCheckbox[0].checked = items.tableActiveRaw;
      tablesVisibleCheckbox[1].checked = items.tableActiveRendered;
      tablesVisibleCheckbox[2].checked = items.tableActiveDiff;
      showHideTables();
    }
  );

  chrome.tabs.get(parseInt(tabID), function (tab) {
    //for some reason there's no way to query if a tab still exists so have to look for error
    if (chrome.runtime.lastError) {
      alert(
        "Error: Original tab has been closed. Reload original tab and launch extension again."
      );
      return;
    }

    //get URL of tab that opened us so we can fetch raw source
    rawURL = tab.url;
    d.title = "Source Getter : " + rawURL.substring(0, 150);
    currentURL.innerHTML = "URL: " + rawURL;
    currentURLHref.href = rawURL;

    var doctypeKey = "VRSDOCTYPE|" + tabID;
    var userAgentKey = "VRSUA|" + tabID;
    var renderedDOMKey = "VRS|" + tabID;

    chrome.storage.local.get(doctypeKey, function (result) {
      doctype = result[doctypeKey];
    });

    chrome.storage.local.get(userAgentKey, function (result) {
      userAgent = result[userAgentKey];

      //Detect if mobile
      if (
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
          userAgent
        ) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
          userAgent.substr(0, 4)
        )
      ) {
        fetchTypeRendered.innerHTML =
          'Chrome, Mobile <div class="tooltip" style="width:15px; height:15px; font-size:14px; font-weight:800">i <span class="tooltiptext">To render as a mobile device, <a href="https://developers.google.com/web/tools/chrome-devtools/device-mode/emulate-mobile-viewports" target="_blank">change the device in Chrome DevTools</a> and re-launch extension</span></div>';
        fetchAsMobile.checked = true;
      } else {
        fetchTypeRendered.innerHTML =
          'Chrome, Desktop <div class="tooltip" style="width:15px; height:15px; font-size:14px; font-weight:800">i <span class="tooltiptext">To render as a mobile device, <a href="https://developers.google.com/web/tools/chrome-devtools/device-mode/emulate-mobile-viewports" target="_blank">change the device in Chrome DevTools</a> and re-launch extension</span></div>';
      }
    });

    //now get Blob URL of rendered source
    chrome.storage.local.get(renderedDOMKey, function (result) {
      var renderedBlobURL = result[renderedDOMKey];
      fetchSource(renderedBlobURL, "rendered");
      fetchSource(rawURL, "raw");
    });
  });

  function saveSettings() {
    chrome.storage.sync.set({
      tableActiveRaw: tablesVisibleCheckbox[0].checked,
      tableActiveRendered: tablesVisibleCheckbox[1].checked,
      tableActiveDiff: tablesVisibleCheckbox[2].checked,
    });
  }

  function createXHRRetry() {
    var xhrRetry = d.getElementById("xhr-retry");
    xhrRetry.addEventListener("click", function (e) {
      e.preventDefault();
      fetchSource(rawURL, "raw");
    });
  }

  function calcDiffItemsPos() {
    //there may be no diff items yet, so don't try and grab their positions until that array exists (in doDiff())
    if (typeof allDiffItems == "undefined") {
      return;
    }

    //an empty array
    allDiffItemsPos = [];

    //loop and grab vertical position of all differences so we can know know when we scroll past them
    for (var i = 0; i < allDiffItems.length; i++) {
      allDiffItemsPos.push(allDiffItems[i].getBoundingClientRect().top);
    }
  }

  //show/hide tables based on checkboxes preference
  function showHideTables() {
    saveSettings();

    var n = 0;

    tablesVisibleCheckbox.forEach(function (c) {
      if (c.checked) {
        n++;
      }
    });

    if (n == 0) {
      d.getElementById("no-panels-selected").innerHTML = "No panels selected";
    } else {
      d.getElementById("no-panels-selected").innerHTML = "";
    }

    //total width available is 97.8, unless there's only one panel in which case there's less margin to worry about
    if (n == 1) {
      var width = 99.2;
    } else {
      var width = 97.5 / n;
    }

    tablesVisibleCheckbox.forEach(function (c, i) {
      if (c.checked) {
        tableWrappers[i].style.width = width + "%";
        tableHeadElAll[i].style.width = width + "%";
        tableWrappers[i].style.display = "";
      } else {
        tableWrappers[i].style.display = "none";
      }
    });

    //recalculate new vertical positions of <ins>/<del> as they will have shifted
    calcDiffItemsPos();
  }

  //expand current URL container onclick so long URLs can be seen in full
  currentURL.addEventListener("click", function () {
    if (currentURLShow == false) {
      currentURL.classList.add("current-url-show");
      currentURLShow = true;
    } else {
      currentURL.classList.remove("current-url-show");
      currentURLShow = false;
    }
  });

  /*
  theme.addEventListener('change', function() {
    if(this.checked) {
      highlightStyle.setAttribute('href', 'dark.css');
    } else {
      highlightStyle.setAttribute('href', 'light.css');
    }
  });
  */

  function copyText(el, buttonClicked) {
    var range = d.createRange();
    var sel = window.getSelection();
    sel.removeAllRanges();
    range.selectNodeContents(el);
    sel.addRange(range);
    d.execCommand("copy");
    sel.removeAllRanges();
    buttonClicked.innerHTML = "Copied";
    setTimeout(function () {
      buttonClicked.innerHTML = "Copy";
    }, 1300);
  }

  fetchAsBtn.addEventListener("click", function (e) {
    fetchSource(rawURL, "raw");
  });

  function changeClassAll(elArr, type, classname) {
    for (var i = 0; i < elArr.length; i++) {
      if (type == "add") {
        elArr[i].classList.add(classname);
      } else {
        elArr[i].classList.remove(classname);
      }
    }
  }

  function nowScrolling() {
    //if(allDiffItemsPos.length === 0) {
    //	return;
    //}

    var count = 0;

    //stick/remove headings on scroll
    if (window.pageYOffset >= tableTop - 26) {
      //stick headings
      changeClassAll(tableHeadElAll, "add", "sticky");

      //sticky headings (position:fixed) leave page flow so add fake margin to top of table to prevent weird jump
      changeClassAll(tables, "add", "table-prevent-jump");
    } else {
      changeClassAll(tableHeadElAll, "remove", "sticky");
      changeClassAll(tables, "remove", "table-prevent-jump");
    }

    //check current scroll pos againt position of each diff to update count
    for (var i = 0; i < allDiffItemsPos.length; i++) {
      if (window.pageYOffset + 43 >= allDiffItemsPos[i]) {
        count++;
        d.getElementById("diff-count-current").innerHTML = count;
      } else {
        d.getElementById("diff-count-current").innerHTML = count;
        count = 0;

        //stop looking ahead as there can't be any more til next scroll
        break;
      }
    }

    //back to top
    if (window.pageYOffset >= 800) {
      backToTop.style.display = "block";
    } else {
      backToTop.style.display = "none";
    }
  }

  //execute when window is scrolled
  window.onscroll = nowScrolling;

  function decodeHtml(html) {
    var htmlEl = d.createElement("html");
    htmlEl.innerHTML = html;
    return doctype + "\n" + htmlEl.outerHTML;
  }

  function strContains(haystack, needle) {
    if (haystack.indexOf(needle) == -1) {
      return false;
    } else {
      return true;
    }
  }

  //raw and rendered could be ready in any order. This is called after each one loaded to check if both are ready. Bit of a hack but hey.
  function checkIfBothVersions() {
    if (responseRaw && responseRendered) {
      doDiff(responseRaw, responseRendered);
    }
  }

  function intoTableRows(str, type) {
    //two blank rows - a crude spacing hack for aesthetics
    var lineNumber = 1;
    var rows =
      '<tr><td class="line-html"></td></tr><tr><td class="line-html"></td></tr>';
    var openInsTag = false;
    var openDelTag = false;

    var diffLines = "";

    //split by new line into array
    str = str.split("\n");

    //loop lines and concatenate table rows string
    str.forEach(function (line) {
      //diff string has <ins> / <del> we want to preserve, so simply wrap line in table rows without escaping
      if (type == "diff") {
        if (openInsTag) {
          if (!strContains(line, "</ins>")) {
            line = "<ins>" + line + "</ins>";
          } else {
            //prevent lines with empty <ins></ins> which mess up the difference count
            if (line.trim().indexOf("</ins>") > 0) {
              line = "<ins>" + line;
            }
            openInsTag = false;
          }
        }

        if (openDelTag) {
          if (!strContains(line, "</del>")) {
            line = "<del>" + line + "</del>";
          } else {
            if (line.trim().indexOf("</del>") > 0) {
              line = "<del>" + line;
            }
            openDelTag = false;
          }
        }

        //if we have an open <ins>, but no closing </ins> on this line then it must be closed on later lines
        //Set flag that <ins> is open so we know to wrap later lines in <ins> too
        if (strContains(line, "<ins>") && !strContains(line, "</ins>")) {
          openInsTag = true;
        }

        if (strContains(line, "<del>") && !strContains(line, "</del>")) {
          openDelTag = true;
        }

        rows += '<tr><td class="line-html-diff">' + line + "\n</td></tr>";
        diffLines += line + "\n";

        //else it's raw or rendered table
      } else {
        //raw and rendered need html entities added. Not confident line below covers all cases
        rows +=
          '<tr><td class="line-html"><span style="color:rgba(255, 255, 255, 0.25); padding-left: 0.25em;">' + lineNumber + '</span> ' +
          line
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;") +
          "\n</td></tr>";
      }
      lineNumber++;
    });

    return rows;
  }

  function fetchSource(url, type) {
    var loadingMessage = '<img src="artwork/loading.gif" />';

    //cache buster
    if (type === "raw") {
      if (url.indexOf("?") == -1) {
        var separator = "?";
      } else {
        var separator = "&";
      }
      //url = url + separator + Math.round(new Date().getTime() / 1000);

      //emulate HTTP status codes
      //url = 'https://httpstat.us/200?sleep=5000';
    }

    //ajax request
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.timeout = 10000;
    xhr.responseType = "text";

    //set headfer flag for background page to pick up to know what UA to set.
    //Can't just set UA here due to browser restriction. Have to modify existing headers just before sent.
    if (fetchAsMobile.checked && fetchAsGoogle.checked) {
      xhr.setRequestHeader("X-VRS-Override-UA", "Google-Mobile");
      fetchTypeRaw.innerHTML = "Googlebot Mobile";
    } else if (fetchAsMobile.checked) {
      xhr.setRequestHeader("X-VRS-Override-UA", "Chrome-Mobile");
      fetchTypeRaw.innerHTML = "Chrome, Mobile";
    } else if (fetchAsGoogle.checked) {
      xhr.setRequestHeader("X-VRS-Override-UA", "Google-Desktop");
      fetchTypeRaw.innerHTML = "Googlebot Desktop";
    } else {
      fetchTypeRaw.innerHTML = "Chrome, Desktop";
    }

    if (type === "raw") {
      rawDisplay.innerHTML = "";
      diffDisplay.innerHTML = "";
      rawStatus.innerHTML = loadingMessage;
      diffStatus.innerHTML = loadingMessage;
    } else if (type === "rendered") {
      renderedStatus.innerHTML = loadingMessage;
    }

    xhr.onload = function (e) {
      if (type === "raw") {
        rawStatus.innerHTML = "&nbsp;";
      } else if (type === "rendered") {
        renderedStatus.innerHTML = "&nbsp;";
      }

      if (this.readyState === 4 && this.status === 200) {
        var response = decodeHtml(this.response);

        var response = html_beautify(response, {
          indent_size: "1",
          indent_char: "\t",
          max_preserve_newlines: "-1",
          preserve_newlines: false,
          keep_array_indentation: false,
          break_chained_methods: false,
          indent_scripts: "normal",
          brace_style: "collapse",
          space_before_conditional: true,
          unescape_strings: false,
          jslint_happy: false,
          end_with_newline: false,
          wrap_line_length: "0",
          indent_inner_html: true,
          comma_first: false,
          e4x: false,
        });

        if (type === "raw") {
          responseRaw = response;
          rawDisplay.innerHTML = intoTableRows(response, "raw");
        } else if (type === "rendered") {
          responseRendered = response;
          renderedDisplay.innerHTML = intoTableRows(response, "rendered");

          /* document.querySelectorAll('td.language-html').forEach(block => {
            hljs.highlightBlock(block);
          }); */
        }

        checkIfBothVersions();

        //there was a response but not a 200 OK, must be an error
      } else {
        if (type === "raw") {
          //Cloudflare block user-agent spoofing as Google.
          if (this.getResponseHeader("server").toLowerCase() === "cloudflare") {
            rawStatus.innerHTML =
              '<span class="error">Error fetching raw source. "HTTP ' +
              this.status +
              '". Blocked by Cloudflare. <a href="https://support.cloudflare.com/hc/en-us/articles/217074967-How-do-I-control-IP-access-to-my-site-" target="_blank">Whitelist IP here</a>.</span>';
          } else {
            rawStatus.innerHTML =
              '<span class="error">Error fetching raw source. "HTTP ' +
              this.status +
              '": ' +
              this.statusText +
              '". <a id="xhr-retry" href="#">Retry?</a></span>';
            //bind Retry event to new Retry link
            createXHRRetry();
          }

          //clear loading message
          diffStatus.innerHTML = "";
        }
      }
    };

    xhr.ontimeout = function (e) {
      if (type === "raw") {
        rawStatus.innerHTML =
          '<span class="error">Timeout. No response fetching raw source after 10 seconds. <a id="xhr-retry" href="#">Retry?</a></span>';
        diffStatus.innerHTML = "";
        createXHRRetry();
      }
    };

    xhr.onerror = function (e) {
      if (type === "raw") {
        rawStatus.innerHTML =
          '<span class="error">Network error fetching raw source. Make sure you\'re online. <a id="xhr-retry" href="#">Retry?</a></span>';
        diffStatus.innerHTML = "";
        createXHRRetry();
      } else if (type === "rendered") {
        renderedStatus.innerHTML =
          '<span class="error">Error getting rendered source. Return to site and re-launch Source Getter again</span>';
        diffStatus.innerHTML = "";
      }
    };

    xhr.send();
  }

  function doDiff(str1, str2) {
    diffWorker.postMessage([str1, str2]);

    diffWorker.onmessage = function (e) {
      var diffs = e.data;

      var fragment = d.createDocumentFragment();

      for (var i = 0; i < diffs.length; i++) {
        if (diffs[i].added && diffs[i + 1] && diffs[i + 1].removed) {
          var swap = diffs[i];
          diffs[i] = diffs[i + 1];
          diffs[i + 1] = swap;
        }

        var node;
        if (diffs[i].removed) {
          node = d.createElement("del");
          node.appendChild(d.createTextNode(diffs[i].value));
        } else if (diffs[i].added) {
          node = d.createElement("ins");
          node.appendChild(d.createTextNode(diffs[i].value));
        } else {
          node = d.createTextNode(diffs[i].value);
        }
        fragment.appendChild(node);
      }

      //create temporary <div> and append the fragment, then grab the innerHTML
      var tempDiv = d.createElement("div");
      tempDiv.appendChild(fragment);
      var diffHTML = tempDiv.innerHTML;
      diffStatus.innerHTML = "";

      diffDisplay.innerHTML = intoTableRows(diffHTML, "diff");

      /*
      //raw and rendered now ready for syntax highlighting
      var highlight = d.querySelectorAll('.line-html'); //only highlight raw and rendered, not diff due to performance issues when scrolling
      highlight.forEach(function(line) {
        hljs.highlightBlock(line);
      });
    */

      //count and differences, display count, and get their position from top
      allDiffItems = d.querySelectorAll("ins, del");
      d.getElementById("diff-count-total").innerHTML = allDiffItems.length;

      //calculate vertical positions of <ins>/<del>
      calcDiffItemsPos();
    };
  }
})();
