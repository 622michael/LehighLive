git add .
git commit -m "Automated deploy"
git push heroku master
curl -H "Content-Type: application/json; charset=utf-8"  -H "Authorization: Bearer ya29.c.ElqfBXVAZLk5PUs-GqvwJ2K7W7wQvg01K8ru0rnkqrcCMtYGIt7UCr-wLZV9YPn5FaeWvNkvtx82aJd42N5KguGMqaX1N2zHX8D4x6YyZY6BLF5ufeCDN-9AUWo"  -d '{"queryInput":{"text":{"text":"What events are going on?","languageCode":"en"}},"queryParams":{"source":"test_console","timeZone":"America/New_York"}}' "https://dialogflow.googleapis.com/v2beta1/projects/lehigh-8bfc4/agent/sessions/345a1765-8192-4529-b800-963ca08730c0:detectIntent"
