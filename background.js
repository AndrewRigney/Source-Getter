function launch() {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			
		//get current tab position so we can open new tab next to it (at index + 1)
		var tabPosition = tabs[0].index;
		var tabID = tabs[0].id;
		
		chrome.tabs.sendMessage(tabs[0].id, {"message": "Gimme the rendered DOM"}, function(response) {

			if(response) {
					var renderedObjURL = response.payload;
					var renderedStorageKey = "VRS|" + tabs[0].id;
					var doctypeKey = "VRSDOCTYPE|" + tabs[0].id;
					var UAKey = "VRSUA|" + tabs[0].id;
					
					//add reference in storage to blobURL of rendered page
					chrome.storage.local.set({ [renderedStorageKey]: renderedObjURL });
					chrome.storage.local.set({ [doctypeKey]: response.doctype });
					chrome.storage.local.set({ [UAKey]: response.userAgent });

					chrome.tabs.create({ url: 'viewrenderedsource.html?tabID=' + tabID, index: tabPosition + 1});
			} else {
				//no response from content.js -- not much we can do...
			}

		});
	});
}


//user clicked Browser Action button or used keyboard shortcut
chrome.browserAction.onClicked.addListener(function (tab) {
	launch();
});

//right click context menu
chrome.contextMenus.create({
	title: "Source Getter (Ctrl+Shift+U)", 
	contexts:["page"], 
	onclick: launch
});


function removeStorage(tabId, changeInfo) {
	var renderedDOMKey = "VRS|" + tabId;
	var doctypeKey = "VRSDOCTYPE|" + tabId;
	var UAKey = "VRSUA|" + tabId;
	
	chrome.storage.local.get(renderedDOMKey, function (result) {
		//remove key referencing rendered blob, and doctype. Blob itself is released automatically when tab updated at all
		chrome.storage.local.remove(renderedDOMKey);
		chrome.storage.local.remove(doctypeKey);
		chrome.storage.local.remove(UAKey);
	});
}

//tab closed
chrome.tabs.onRemoved.addListener(function(tabId, changeInfo, tab) {
	removeStorage(tabId, changeInfo);
});

//tab changed - new URL or refresh
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	//if the change is the tab loading to a new (or the same) URL... (avoids title and favicon changes triggering removeStorage() like on next.thenextweb.com)
	if(changeInfo.status == 'loading') {
		removeStorage(tabId, changeInfo);
	}
});

chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {

	var overrideUA = false;
	
	//spoof a referer - might help one day
	//details.requestHeaders.push({name:'Referer', value:'https://www.example.com/'});
	
	for(var t=0, i = details.requestHeaders.length; t<i; ++t) {

		//looks for custom header to see if HTTP request came from extension, otherwise it will all override all requests made by the browser.
		if (details.requestHeaders[t].name === "X-VRS-Override-UA") {
			overrideUA = true;
			
			switch(details.requestHeaders[t].value) {
				case 'Chrome-Mobile':
					var newUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'; //iPhone X
					break;
				case 'Google-Desktop':
					var newUA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
					break;
				case 'Google-Mobile':
					var newUA = 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
					break;
			}
		}

		//looks for custom header to see if request came from extension
		if (overrideUA && details.requestHeaders[t].name === "User-Agent") {
			details.requestHeaders[t].value = newUA;
		}

	}
	
	return { requestHeaders: details.requestHeaders }
}, {
	urls: ["<all_urls>"]
}, ["blocking", "requestHeaders"]);