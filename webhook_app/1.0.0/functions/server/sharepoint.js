const YMSRequest = require('./YMSRequest.js').YMSRequest;
const uuid = require("./uuid.js");

/**
 * basic validation. We do not expect events with non-matching listId, but filter it just in case.
 *
 * @param {Object} webhook userData stored on webhook registration
 * @param {Object} payload incoming requestContent
 * @return {Array} value of payload
 *
 * @example
 *  payload:
 * {
 * "value": [
 *   {
 *     "subscriptionId": "8d355f0d-f102-4bb8-9c42-08677d6b9302",
 *     "clientState": "A0A354EC-97D4-4D83-9DDB-144077ADB449",
 *     "expirationDateTime": "2018-02-02T16:17:57.0000000Z",
 *     "resource": "0aee2504-34aa-4e06-b7fe-ec671fa78a15",
 *     "tenantId": "c90eb054-e079-437d-9976-58f09521fbc9",
 *     "siteUrl": "/",
 *     "webId": "1f33da25-ef6d-49ff-9682-aa555751309a"
 *   }
 * ]
 * }
 *  result:
 * [
 *   {
 *     "subscriptionId": "8d355f0d-f102-4bb8-9c42-08677d6b9302",
 *     "clientState": "A0A354EC-97D4-4D83-9DDB-144077ADB449",
 *     "expirationDateTime": "2018-02-02T16:17:57.0000000Z",
 *     "resource": "0aee2504-34aa-4e06-b7fe-ec671fa78a15",
 *     "tenantId": "c90eb054-e079-437d-9976-58f09521fbc9",
 *     "siteUrl": "/",
 *     "webId": "1f33da25-ef6d-49ff-9682-aa555751309a"
 *   }
 * ]
 */
function getEvents(webhook, payload) {
    if (!payload.value || !Array.isArray(payload.value)) {
        return false;
    }

    return payload.value.filter(change => change.resource === webhook.listId);
}

/**
 * build executionContext identifier for all events
 *
 * @param {Array} data list from getEvents()
 * @return {Array} event-executionContext pairs
 */
function processRequest(data) {
    return data.map(event => ({
        executionContext: {userData: {subscriptionId: event.subscriptionId}},
        body: event
    }));
}

/**
 * echoes validation token
 *
 * @param {string} token the token SP send on webhook registration
 * @return {Promise<{data: {response: {statusCode: number, content: *}}}>} response to build HTTP response to SP
 */
function confirmSubscription(token) {
    return Promise.resolve({
        data: {
            response: {statusCode: 200, content: token}
        }
    });
}

/**
 * get changes since the token. NOT IMPLEMENTED YET!
 *
 * @param {Object} webhook UserData from webhook and subscription
 * @param {Object} payload a single item from getEvents() list
 * @param {Object} session from execution context
 * @param {Object} role from execution context
 * @return {Promise.<Response>} result of fetch
 *
 * @example of webhook
 *  { tenant: 'devloop',
 *    listId: '0aee2504-34aa-4e06-b7fe-ec671fa78a15',
 *    changeQuery: { Add: 'True', Item: 'True' },
 *    changeToken: '1;3;0aee2504-34aa-4e06-b7fe-ec671fa78a15;636528416563470000;160750288',
 *    subscriptionId: 'bf7e7782-371c-4bb0-81d0-fc8e7ce0cb57',
 *  }
 */
function getChanges(webhook, payload, session, role) {
    // dummy response to test changeToken update
    session.userName = "test session update " + Date.now();
    return session.store()
        .then(() => ({
            changeToken: 'new ChangeToken' + Date.now(),
            changes: payload
        })
    );
    // instead we need to get latest changes from SP changelog:
    const request = new YMSRequest({
        protocol: "https",
        host: webhook.tenant + ".sharepoint.com",
        tenant: webhook.tenant
    }, session, role);
    const requestBody = {
        "query": {
            "__metadata": {
                "type": "SP.ChangeLogItemQuery",
                "ChangeToken": webhook.changeToken
            }
        }
    };
    // couldn't find a way to query SP change log. The best of my attempts returns XML which cause exception in YMSRequest response parser:
    return request.POST("/_api/web/lists('" + webhook.listId + "')/GetListItemChangesSinceToken", requestBody, {"Content-Type": "application/json; odata=verbose"})
        .then(result => {
            return result;
        }).catch(e => {
            throw e;
        });
}

exports.REST = {

    /**
     * register webhook on SP API
     *
     * @param {Object} _args command line parameters
     * @param {Object} _options request options and post data
     * @param {YServer} _serv server
     * @param {YRole} _role from front API
     * @param {YSession} _session from front API
     * @return {Promise.<Object>} response and userData to return to the client
     */
    register(_args, _options, _serv, _role, _session) {
        const webhook = JSON.parse(_options.data);
        if (!webhook) {
            return Promise.reject(new Error("Unexpected payload: " + _options.data));
        }
        const expiration = new Date();
        expiration.setMonth(expiration.getMonth() + 6);
        expiration.setDate(expiration.getDate() - 1);
        const state = uuid.v4();
        const request = new YMSRequest({
            protocol: "https",
            host: webhook.userData.tenant + ".sharepoint.com",
            tenant: webhook.userData.tenant
        }, _session, _role);
        const requestBody = {
            resource: "https://" + webhook.userData.tenant + ".sharepoint.com/_api/web/lists('" + webhook.userData.listId + "')",
            // notificationUrl: "https://devloop.loopsoftware.fr/webhook/" + webhook.id,
            notificationUrl: "https://sharepoint.lampdev.co.uk/b.php",
            "expirationDateTime": expiration.toISOString(),
            "clientState": state
        };
        return request.POST("/_api/web/lists('" + webhook.userData.listId + "')/subscriptions", requestBody)
            .then(result => {
                if (!result.id || result.clientState !== state || result.resurce !== webhook.userData.listId) {
                    throw new Error("Unexpected response " + JSON.stringify(result));
                }
                return result;
            }).then(data => {
                if (data.clientState !== state) {
                    throw new Error("Unexpected response: " + JSON.stringify(data));
                }
                return {data: {userData: data, response: {ok: true}}};
            });
    },

    /**
     * Get initial changeToken. Optional, only needed for getChange()
     *
     * @param {Object} _args command line parameters
     * @param {Object} _options request options and post data
     * @param {YServer} _serv server
     * @param {YRole} _role from front API
     * @param {YSession} _session from front API
     * @return {Promise.<Object>} response and userData to return to the client
     */
    subscribe(_args, _options, _serv, _role, _session) {
        const webhook = JSON.parse(_options.data);
        if (!webhook.changeQuery) {
            return Promise.reject(new Error("Undefined changeQuery"));
        }
        const request = new YMSRequest({
            protocol: "https",
            host: webhook.tenant + ".sharepoint.com",
            tenant: webhook.tenant
        }, _session, _role);
        // uses changeQuery from the client, but it can be hardcoded
        return request.POST("/_api/web/lists('" + webhook.listId + "')/getchanges", {"query": webhook.changeQuery})
            .then(result => {
                if (!result.value || !Array.isArray(result.value)) {
                    throw new Error("Unexpected response " + JSON.stringify(result));
                }
                return result.value[0];
            }).then(data => {
                if (!data.ChangeToken) {
                    throw new Error("Unexpected response: " + JSON.stringify(data));
                }
                return {
                    data: {
                        userData: {changeQuery: webhook.changeQuery, changeToken: data.ChangeToken.StringValue},
                        response: {ok: true}
                    }
                };
            });
    },

    /**
     * Echoes ValidationToken on webhook registration request from SP and handle incoming messages
     *
     * @param {Object} _args command line parameters
     * @param {Object} _options request options and post data
     * @return {Promise.<Object>} response to build HTTP response to SP and data array of event-executionContext pairs to process
     */
    handle(_args, _options) {
        const {webhook, payload} = JSON.parse(_options.data);

        if (_args.validationtoken) {
            return confirmSubscription(_args.validationtoken);
        }

        try {
            const events = getEvents(webhook, JSON.parse(payload.data));
            if (!events || events.length < 1) {
                return Promise.reject(new Error('No valid changes'));
            }
            return Promise.resolve({
                data: {
                    response: {statusCode: 200},
                    data: processRequest(events)
                }
            });
        } catch (e) {
            return Promise.reject(e);
        }
    },

    /**
     * react on individual events
     *
     * @param {Object} _args command line parameters
     * @param {Object} _options request options and post data
     * @param {YServer} _serv server
     * @param {YRole} _role from execution context
     * @param {YSession} _session from execution context
     * @return {Promise.<Object>} new changeToken for the subscription
     */
    process(_args, _options, _serv, _role, _session) {
        const {webhook, payload} = JSON.parse(_options.data);
        return getChanges(webhook, payload, _session, _role)
            .then(result => {
                return {
                    data: {
                        result: {ok: true},
                        updateSubscription: {
                            $set: {
                                changeToken: result.changeToken
                            }
                        }
                    }
                };
            });
    }
};
