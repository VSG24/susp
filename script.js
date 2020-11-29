function replacePageContent() {
	let newHTML = `<html>
	<head>
	  <title>!!! BLOCKED by SUSP !!!</title>
	</head>
	<body align="center">
		<br>
		<p>This domain is blocked by SUSP extension on your browser.</p>
		<strong>In order to access it, your public IP needs to change to one from the whitelisted country in SUSP or changes the settings.</strong>
	</body>
  </html>`

  document.open()
  document.write(newHTML)
  document.close()
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if(request.message == 'replacePageContent') {
		replacePageContent();
		//sendResponse({ message: 'done ' });
	}
});
