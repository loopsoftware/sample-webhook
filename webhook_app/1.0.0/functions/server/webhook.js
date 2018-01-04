const crypto = require('crypto');

function isValid(webhook, payload, headers) {
    const signature = headers["intuit-signature"];
    if (!signature) {
        throw new Error("Unsigned request");
    }
    const hash = crypto.createHmac('sha256', webhook.token).update(payload.data).digest('base64');
    return signature === hash;
}

function processRequest(data) {
    const notifications = data.eventNotifications;
    if (!notifications || !Array.isArray(notifications)) {
        throw new Error("Unexpected payload");
    }
    return notifications.map(event => {
        return {
            executionContext: {userData: {realmId: event.realmId}},
            body: event.dataChangeEvent
        };
    });
}

exports.REST = {
    register(_args, _options, _serv, _role, _session) {
        return Promise.resolve({data: {some: "data"}});
    },

    subscribe(_args, _options, _serv, _role, _session) {
        return Promise.resolve({data: {userData: {some: "dataSub", subscribe: "from app"}, response: {ok: true}}});
    },

    handle(_args, _options, _serv, _role, _session) {
        const {webhook, payload, headers} = JSON.parse(_options.data);
        try {
            if (!isValid(webhook, payload, headers)) {
                return Promise.reject(new Error('Invalid signature'));
            }
            const data = processRequest(JSON.parse(payload.data));
            return Promise.resolve({
                data: {
                    response: {statusCode: 201, content: "Accepted!"},
                    data: data
                }
            });
        } catch (e) {
            return Promise.reject(e);
        }
    },

    process(_args, _options, _serv, _role, _session) {
        const {webhook, payload} = JSON.parse(_options.data);
        const email = {
            "message": {
                "subject": "testing qb webhooks",
                "body": {
                    "contentType": "Text",
                    "content": JSON.stringify(payload)
                }
            },
            "saveToSentItems": "false"
        };

        if (webhook.ccTo) {
            email.message.ccRecipients = [
                {
                    "emailAddress": {
                        "address": webhook.ccTo
                    }
                }
            ];
        }

        return _session.getUser()
            .then(_user => {
                email.message.toRecipients = [
                    {
                        "emailAddress": {
                            "address": _user.email
                        }
                    }
                ];
            }).then(() => {
                return fetch(
                    "https://graph.microsoft.com/v1.0/me/sendMail",
                    {
                        serviceProvider: {name: "YPN", domain: "https://graph.microsoft.com"},
                        resource: "https://graph.microsoft.com",
                        method: "POST",
                        body: email
                    },
                    _session,
                    _role,
                    _serv
                );
            });
    }
};
