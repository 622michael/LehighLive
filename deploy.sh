git add .
git commit -m "Automated deploy"
git push heroku master
curl -H "Content-Type: application/json; charset=utf-8"  -H "Authorization: Bearer ya29.c.ElqbBYFVKxQB8OtLD0rmMgZsmpPZaPa2-BQmabIc-7Vz7Hf_DXgTE6zMJ4_IR4R68sJOFTlImy5d90FIVnoom1rsm7F6WUW9Kkx_VP9mxVap7qHIKS7C0SnMjtE"  -d '{"queryInput":{"text":{"text":"When does lower close?","languageCode":"en"}},"queryParams":{"timeZone":"America/New_York"}}' "https://dialogflow.googleapis.com/v2beta1/projects/lehigh-8bfc4/agent/sessions/522aaa0e-3470-48e4-a9e8-421e717163d5:detectIntent"
