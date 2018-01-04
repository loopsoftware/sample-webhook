# Example app with quickbooks webhook module

## Requirements

 - framework v2.0.4+
 
## Installation

 - upload the package
 - register a webhook 
   ```
    curl 'https://devloop.loopsoftware.fr/YPND/user/*/webhook/register?id=0' \
    -H 'content-type: application/json' \
    -b 'sessionId=<session id>' \
    --data-binary '
      {
        "role":"user",
        "module":"webhook_app",
        "version":"2.0.4.1.0.0",
        "registration":"webhook/register",
        "subscription":"webhook/subscribe",
        "authentication":"webhook/handle",
        "process":"webhook/process"
      }'
   ```
 - retrieve webhook path e.g. `/webhook/87774952-38de-4530-86f6-79ad0dd01738`
 - go to quickbooks sandbox and create a company, or use an existing one
 - go to quickbooks developer ui https://developer.intuit.com/v2/ui#/app/dashboard and pick or create an app
 - register webhook at https://developer.intuit.com/v2/ui#/app/appdetail/...../...../webhooks with full url:
   e.g. `https://devloop.loopsoftware.fr/webhook/87774952-38de-4530-86f6-79ad0dd01738`   
   **Note: the domain (devloop.loopsoftware.fr in the example) should be publicly available and reachable from quickbooks**  
 - copy provided "Verifier Token"
 - update the webhook
   ```
    curl 'https://devloop.loopsoftware.fr/YPND/user/*/webhook/register?id=87774952-38de-4530-86f6-79ad0dd01738' \
    -H 'content-type: application/json' \
    -b 'sessionId=<session id>' \
    --data-binary '
      {
        "role":"user",
        "module":"webhook_app",
        "version":"2.0.4.1.0.0",
        "registration":"webhook/register",
        "subscription":"webhook/subscribe",
        "authentication":"webhook/handle",
        "process":"webhook/process",
        "userData":"{\"token\": \"<the verifier token>\"}"}
      }'
   ```
 - subscribe to the webhook
   ```
   curl 'https://devloop.loopsoftware.fr/YPND/user/*/webhook/subscribe?id=87774952-38de-4530-86f6-79ad0dd01738' \
      -H 'content-type: application/json' \
      -b 'sessionId=deaad373-b025-41a3-b7e5-b182189fa1ed' \
      --data-binary '{"dbId":"dbId","userData":"{\"realmId\":\"<quickbooks company id>\"}"}'
   ```
 - go to the sandbox company https://sandbox.qbo.intuit.com/login?deeplinkcompanyid=<quickbooks company id>     
 - trigger the webhook events
 
 It may take some time for quickbooks to send data. Eventually the webhook worker should send an email with the payload.  
