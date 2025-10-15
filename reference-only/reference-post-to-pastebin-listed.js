// Storing the omg.lol credentials in Draft's Credential instead of the action code directly
var credential = Credential.create("omg.lol status", "Keep privately your omg.lol API key and your username");
credential.addTextField("omg_username", "Your username");
credential.addPasswordField("omg_api_key", "API Key");
credential.authorize();

// We'll get the values and store them in our own variables
let omg_api_key = credential.getValue("omg_api_key")
let omg_username = credential.getValue("omg_username")

// Get the safe title of the current Draft and replace spaces with -
var slugText = draft.processTemplate("Link content slug");
var slug = slugText.toLowerCase()
  .replace(/["'=:!?@£#$%&\*\(\)\[\]_\+\|;~`<>,\.]+/g, '')
  .replace(/ +/g,'-');
let title = slug

// Get the body of the of the current Draft removing empty line before and after
let content = draft.processTemplate("[[trimmed_body]]")

// Create paste.lol direct link and copy to clipboard
let link = "https://"+omg_username+".paste.lol/"+title
let clipboard = app.setClipboard(link)

// Check if paste exists 
// API - https://api.omg.lol/#noauth-get-pastebin-retrieve-a-specific-paste

//   var http = HTTP.create();
//   var response = http.request({
//     "url": "https://api.omg.lol/address/" + omg_username + "/pastebin",
//     "method": "GET"
//   });

//  If above request.success = true 
//    show title already exists error dialog 
//      Click OK to return to your draft
//  else 
//    continue with script

// use https://api.omg.lol/address/jomalo/pastebin/post-to-pastebin to verify

// Confirming there is more than one line in the current Draft then submit to the omg.lol pastebin :)
// This creates a public paste - remove "listed": 1 for private
// Should be made into a public Yes|No dialog 
if (title !== '' && content!== '') {
  var http = HTTP.create();
  var response = http.request({
    "url": "https://api.omg.lol/address/" + omg_username + "/pastebin",
    "method": "POST",
    "data": {
      "title": title,
      "content": content,
      "listed": 1
    },
    "headers": {
      "Authorization": "Bearer " + omg_api_key
    }
  });
}

