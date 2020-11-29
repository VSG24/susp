var allowedCountryCode;
var siteDomain;
var intervalEnabled = true;

var latestClientCountryCode;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.message === "reloadOptions") {
		loadOptions();
		doTheActualThings();
    }
});

var blockEvent = function() {
	return {cancel: true};
};

function loadOptions() {
	chrome.storage.sync.get({
		allowedCountryCode: '',
		siteDomain: ''
	}, function(items) {
		allowedCountryCode = items.allowedCountryCode;
		siteDomain = items.siteDomain;

		chrome.webRequest.onBeforeRequest.removeListener(
			blockEvent
		);

		if(latestClientCountryCode !== allowedCountryCode) {
			chrome.webRequest.onBeforeRequest.addListener(
				blockEvent,
				{
					urls: [`*://*.${siteDomain}/*`]
				},
				["blocking"]
			);
		}
	});
}

function extractHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("//") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

function extractRootDomain(url) {
    var domain = extractHostname(url),
        splitArr = domain.split('.'),
        arrLen = splitArr.length;

    //extracting the root domain here
    //if there is a subdomain
    if (arrLen > 2) {
        domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
        //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
        if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2) {
            //this is using a ccTLD
            domain = splitArr[arrLen - 3] + '.' + domain;
        }
    }
    return domain;
}

// chrome.runtime.onInstalled.addListener(function() {
//   chrome.storage.sync.set({color: '#3aa757'}, function() {
//     console.log('The color is green.');
//   });
//   chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
//     chrome.declarativeContent.onPageChanged.addRules([{
//       conditions: [new chrome.declarativeContent.PageStateMatcher({
//         pageUrl: {hostEquals: 'developer.chrome.com'},
//       })],
//       actions: [new chrome.declarativeContent.ShowPageAction()]
//     }]);
//   });
// });

chrome.tabs.onCreated.addListener(function(tab) {
	let domain = extractRootDomain(tab.url);
	if(domain.indexOf(`${siteDomain}`) !== -1) {
		chrome.storage.sync.set({
			intervalEnabled: true
		}, function() {
			intervalEnabled = true;
		});
	}
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.getSelected(null, function(tab) {
		checkAndExecuteScriptForTab(tab, true);
	 });
});

function checkAndExecuteScriptForTab(tab, forceIPCheck = false) {
	let domain = extractRootDomain(tab.url);
	if(domain.indexOf(`${siteDomain}`) !== -1) {
		if(forceIPCheck === true) {
			fetch('https://api.myip.com').then(r => r.text()).then(result => {
				let res = JSON.parse(result);
				latestClientCountryCode = res.cc;

				if(latestClientCountryCode !== allowedCountryCode) {
					//chrome.tabs.executeScript(tab.id, {file: "script.js"});
					chrome.tabs.sendMessage(tab.id, { message: 'replacePageContent' });
					chrome.webRequest.onBeforeRequest.addListener(
						blockEvent,
						{
							urls: [`*://*.${siteDomain}/*`]
						},
						["blocking"]
					);
				}
			});
		} else {
			if(latestClientCountryCode !== allowedCountryCode) {
				chrome.tabs.sendMessage(tab.id, { message: 'replacePageContent' });

				chrome.webRequest.onBeforeRequest.addListener(
					blockEvent,
					{
						urls: [`*://*.${siteDomain}/*`]
					},
					["blocking"]
				);
			}
		}
	}
}

function doTheActualThings() {
	fetch('https://api.myip.com').then(r => r.text()).then(result => {
		let res = JSON.parse(result);
		latestClientCountryCode = res.cc;
		if(latestClientCountryCode !== allowedCountryCode) {
			chrome.windows.getAll({ populate: true }, windows => {
				windows.forEach(window => {
				  window.tabs.forEach(tab => {
					  checkAndExecuteScriptForTab(tab);
				  });
				});
			});
		}
	});
}

setInterval(() => {
	loadOptions();
	if(!intervalEnabled) {
		return;
	}
	doTheActualThings();
}, 10000);

setInterval(() => {
	fetch('https://api.myip.com').then(r => r.text()).then(result => {
		let res = JSON.parse(result);
		latestClientCountryCode = res.cc;
	});
}, 30000);

setInterval(() => {
	let foundAtLeastOneWantedTab = false;
	chrome.windows.getAll({ populate: true }, windows => {
		windows.forEach(window => {
		  window.tabs.forEach(tab => {
			let domain = extractRootDomain(tab.url);
			if(domain.indexOf(`${siteDomain}`) !== -1) {
				foundAtLeastOneWantedTab = true;
			}
		  });
		});
	});
	chrome.storage.sync.set({
		intervalEnabled: foundAtLeastOneWantedTab
	}, function() {
		intervalEnabled = foundAtLeastOneWantedTab;
	});
}, 20000);
