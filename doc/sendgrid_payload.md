# Sendgrid payload

An example of the SendGrid payload sent to `handle` and proxied to `process` functions when `POST the raw, full MIME message` is enabled:

```json
 {
  "from": "Alex BALABANTSEV <alex@loopsoftware.fr>",
  "subject": "test5",
  "dkim": "{@kpmgts.onmicrosoft.com : pass}",
  "sender_ip": "10.51.10.18",
  "charsets": "{\"to\":\"UTF-8\",\"subject\":\"UTF-8\",\"from\":\"UTF-8\"}",
  "SPF": "permerror",
  "to": "\"recipient@our.domain.fr\" <Test Recipient>\r\n",
  "envelope": "{\"to\":[\"recipient@our.domain.fr\"],\"from\":\"alex@loopsoftware.fr\"}",
  "email": "Received: by mx0035p1las1.sendgrid.net with SMTP id 2WJIIp3c2L Thu, 15 Feb 2018 17:30:06 +0000 (UTC) Received: from also-fr.letsignit.com (unknown [10.51.10.18]) by mx0035p1las1.sendgrid.net (Postfix) with ESMTPS id 961EA6E0F4E for <recipient@our.domain.fr>; Thu, 15 Feb 2018 17:30:05 +0000 (UTC) Received: from also-fr.letsignit.com (localhost [127.0..       <skipped raw email>  --_002_13A0F7535DD044BEA0C2DB97A03A82CEloopsoftwarefr_--"
}    
```

See example of content of the `email` field with text attachment in [raw_email.txt](./raw_email.txt) 
