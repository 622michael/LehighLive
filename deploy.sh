git add .
git commit -m "Automated deploy"
git push heroku master 
curl -H "Content-Type: application/json; charset=utf-8"  -H "Authorization: Bearer ya29.c.ElqbBcXU2RNa9oAVGhlWvLWF4b6sED0RkJKXXvPcavuFmRP20VzGCHGFDURx1WV3Exmi5HXWyfbhG2MzDae6-ingZYhHSUigaGoMA7_f_2IgP2f9xq0Ybb3Dwk8"  -d '{"queryInput":{"text":{"text":"What sports games are going on?","languageCode":"en"}},"queryParams":{"timeZone":"America/New_York"}}' "https://dialogflow.googleapis.com/v2beta1/projects/lehigh-8bfc4/agent/sessions/522aaa0e-3470-48e4-a9e8-421e717163d5:detectIntent"
