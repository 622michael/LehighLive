git add .
git commit -m "Automated deploy"
git push heroku master
curl -H "Content-Type: application/json; charset=utf-8"  -H "Authorization: Bearer ya29.c.ElqfBbZ2_LFDDy8auT9Lj30IwgE4rAr7-o_n20SkkflUzj197F0jEJzrIcjpZ9ftjS_SNd8ET-ZlHVOr43TnHuIhQ0HXMZwzmQo-YPHOuebMeFdMfLISQzGwyaE"  -d '{"queryInput":{"text":{"text":"What events are going on?","languageCode":"en"}},"queryParams":{"source":"test_console","timeZone":"America/New_York"}}' "https://dialogflow.googleapis.com/v2beta1/projects/lehigh-8bfc4/agent/sessions/345a1765-8192-4529-b800-963ca08730c0:detectIntent"