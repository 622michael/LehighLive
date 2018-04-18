git add .
git commit -m "Automated deploy"
git push origin master && git push heroku master
curl -H "Content-Type: application/json; charset=utf-8"  -H "Authorization: Bearer ya29.c.ElqfBdxRjdm43ldzPZVHKlX1YGzFSMpAyX9HVg25iRGdoKgYRISYBdG5vsem3zShHKpQXdcGMQYzUOM31AuYNqZavis79A5FlGlU-1yfmeivhMfUwzdozmYsY9o"  -d '{"queryInput":{"text":{"text":"What sports games are going on?","languageCode":"en"}},"queryParams":{"source":"test_console","timeZone":"America/New_York"}}' "https://dialogflow.googleapis.com/v2beta1/projects/lehigh-8bfc4/agent/sessions/f1e257d9-e8dd-452a-bef2-aec98c902dc3:detectIntent"