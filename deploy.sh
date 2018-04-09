git add .
git commit -m "Automated deploy"
git push heroku master
curl 'https://api.dialogflow.com/v1/query?v=20170712&query=What%20events%20are%20going%20on%20today%3F&lang=en&sessionId=522aaa0e-3470-48e4-a9e8-421e717163d5&timezone=America/New_York' -H 'Authorization:Bearer d706f23e9add41f29ee093c9637491a8'
