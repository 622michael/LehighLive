git add .
git commit -m "Automated deploy"
git push heroku master
curl -H "Content-Type: application/json; charset=utf-8"  -H "Authorization: Bearer ya29.c.ElqbBY5PG4M1p7rTPS0eZbtnsXpQ4xoI06ob46an56t45XJ4W8YZG33zO7k754KrKZ7htOT219kOTvSkpLsTMxhRNkPtZ8CXfazTy648pbKY4BNuIVm9iY1sxAQ"  -d '{"queryInput":{"text":{"text":"When does lower close?","languageCode":"en"}},"queryParams":{"timeZone":"America/New_York"}}' "https://dialogflow.googleapis.com/v2beta1/projects/lehigh-8bfc4/agent/sessions/522aaa0e-3470-48e4-a9e8-421e717163d5:detectIntent"
