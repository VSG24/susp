// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let saveButton = document.getElementById('save');

window.onload = function() {
	chrome.storage.sync.get({
		allowedCountryCode: '',
		siteDomain: '',
		active: ''
	}, function(items) {
		document.getElementById('allowed_country_code').value = items.allowedCountryCode;

		var siteDomain = document.getElementById('site_domain');
		siteDomain.value = items.siteDomain;

		document.getElementById('active').checked = items.active;

		siteDomain.addEventListener("keyup", function(event) {
			if (event.key === "Enter") {
				event.preventDefault();
				saveButton.click();
			}
		});
	});
}

saveButton.onclick = function(element) {
	var allowedCountryCode = document.getElementById('allowed_country_code').value;
	var siteDomain = document.getElementById('site_domain').value;
	let activeCheckbox = document.getElementById('active').checked;
	console.log(activeCheckbox)
	chrome.storage.sync.set({
		allowedCountryCode: allowedCountryCode,
		siteDomain: siteDomain,
		active: activeCheckbox
	}, function() {
		chrome.runtime.sendMessage({message: "reloadOptions"});
		document.querySelector('.save-msg').style.display = 'block';
		setTimeout(() => {
			document.querySelector('.save-msg').style.display = 'none';
		}, 1200);
	});
};
