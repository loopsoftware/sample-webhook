
function isValid(payload) {
    for(const key of ["from", "subject", "dkim", "charsets", "to", "envelope", "email"]) {
        if (!payload.hasOwnProperty(key)) {
            return false;
        }
    }
    // todo: check values of the fields, e.g.
    // return payload.to.indexOf('expected@our.domain.fr') >= 0
    // DO NOT PARSE payload.email at this point. It is an expensive operation that should be done asynchronously in `process` function
    return true;
}


exports.REST = {
    subscribe() {
        return Promise.resolve({
            data: {
                userData: {one: 1},
                response: {ok: true},
                // allow no more than 1 subscription per webhook.
                constraint: {userData: {one: 1}}
            }
        });
    },

    /**
     * synchronously handle incoming messages
     *
     * @param {Object} _args an empty object
     * @param {Object} _options data from the request
     * @param {Object} _options.data.webhook userData of the triggered webhook
     * @param {Object} _options.data.payload SendGrid request, see /doc/sendgrid_payload.md
     * @param {Object} _options.data.headers SendGrid request headers
     *
     * @return {Promise.<Object>} response to build HTTP response to SendGrid and data array of a single element with payload to process
     */
    handle(_args, _options) {
        const {webhook, payload, headers} = JSON.parse(_options.data);

        if (!isValid(payload)) {
            return Promise.reject(new Error('Invalid payload'));
        }

        return Promise.resolve({
            data: {
                response: {statusCode: 200, content: ""},
                data: [{
                    // matches subscription constraint
                    executionContext: {userData: {one: 1}},
                    body: payload
                }]
            }
        });
    },

    /**
     * asynchronously process incoming messages
     *
     * @param {Object} _args an empty object
     * @param {Object} _options data from the handler
     * @param {Object} _options.data.webhook userData of the triggered webhook and subscription
     * @param {Object} _options.data.payload SendGrid request, see /doc/sendgrid_payload.md
     * @param {YServer} _serv server
     * @param {YRole} _role from execution context
     * @param {YSession} _session from execution context
     *
     * @return {Promise.<Object>} response to build HTTP response to SendGrid and data array of a single element with payload to process
     */
    process(_args, _options, _serv, _role, _session) {
        const {webhook, payload} = JSON.parse(_options.data);

        // do something useful with payload.email here.
        // e.g. mailparser.simpleParser(payload.email)
        //          .then(email => {
        //              if (email.to.text !== payload.to) {throw new Error('Unexpected recipient')};
        //              console.log({files: email.attachments})});
        //          });

        return Promise.resolve();
    }
};
