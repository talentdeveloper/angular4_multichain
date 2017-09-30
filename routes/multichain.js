var express = require('express');
var router = express.Router();
var bitcoinClient = require('bitcoin-promise');
var baseConvert = require('baseconvert');

var client = new bitcoinClient.Client({
    host: 'localhost',
    port: '9732',
    user: 'multichainrpc',
    pass: '6vHT3PZfQVagtt9dv1kATGA5WRayA2M6w1zzVzy9GqXK',
    timeout: 10000
});

/**
 * Getting transaction information by its txid
 * @param {string} txid Hash representing current transaction.
 * @returns {object} Decoded object representing transaction with current txid.
 */
router.get('/read/:txid', function (req, res) {
    return client.getRawTransaction(req.params.txid)
        .then(function (result) {
            return client.decodeRawTransaction(result);
        })
        .then(function (decoded) {
            res.json(decoded);
        })
        .catch(function (err) {
            res.status(500).send(err)
        })
});

/**
 * Getting current chain block data by its hash or height
 * @param {string / number} block Hash or height representing current block.
 * @returns {object} Object representing block of current chain.
 */
router.get('/read-header/:block', function (req, res) {
    return client.getBlock(req.params.block)
        .then(function (result) {
            res.json(result);
        })
        .catch(function (err) {
            res.status(500).send(err)
        })
});


router.get('/get-all-addresses', function (req, res) {
    return client.cmd('listpermissions', 'create', function (err, data, resHeaders) {
        if (err) {
            console.log(err);
        };
        res.json(data.map(d => d['address']));
    })
});

router.get('/get-all-streams', function (req, res) {
    return client.cmd('liststreams', function (err, data, resHeaders) {
        if (err) {
            console.log(err);
        };
        res.json(data);
    })
});

router.post('/subscribe', function (req, res) {
    return client.cmd('subscribe', req.body.stream, function (err, data, resHeaders) {
        if (err) {
            console.log(err);
        };
        res.json(data);
    })
});

    router.post('/write', function (req, res) {
        return client.createRawTransaction(req.body.transactionsList, req.body.addresses)
            .then(function (result) {
                return client.decodeRawTransaction(result);
            })
            .then(function (decoded) {
                res.json(decoded);
            })
            .catch(function (err) {
                res.status(500).send(err)
            })
    });

    router.post('/create-stream', function (req, res) {
        client.cmd('createfrom', req.body.address, 'stream', req.body.stream, true, function (err, data, resHeaders) {
            if (err) {
                console.log(err);
                res.status(500).send(err)
            };
            res.json({ 'createtxid': data });
        })
    });

    function bin2hex(bin) {
        var i = 0, l = bin.length, chr, hex = ''
        for (i; i < l; ++i) {
            chr = bin.charCodeAt(i).toString(16)
            hex += chr.length < 2 ? '0' + chr : chr
        }
        return hex;
    }

    function hex2bin(hex) {
        var bin = '';
        var i = 0, l = hex.length - 1, bytes = []
        for (i; i < l; i += 2) {
            bin += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
        }
        return bin;
    }

    router.post('/publish-stream', function (req, res) {
        var hex = bin2hex(req.body.data);
        client.cmd('publishfrom', req.body.address, req.body.stream, req.body.key, hex,
            function (err, data, resHeaders) {
                if (err) {
                    console.log(err);
                    res.status(500).send(err)
                };
                res.json(data);
            })

    });

    router.post('/view-stream', function (req, res) {
        try{
            client.cmd('getstreamitem', req.body.stream, req.body.txid,
                function (err, data, resHeaders) {
                    if (err) {
                        console.log(err);
                        res.status(500).send(err)
                    };
                    console.log(data);
                    if (data && typeof data['data'] === 'string') {
                        data['data'] = hex2bin(data['data']);
                        res.json(data);
                    } else {
                        client.cmd('gettxoutdata', data['data']['txid'], data['data']['vout'],
                            function (err, blob, resHeaders) {
                                if (err) {
                                    console.log(err);
                                    res.status(500).send(err);
                                };
                                res.json(hex2bin(blob));
                            })
                    }
                })

        } catch (err){
            console.log(err);
            res.status(500).send(err);
        }
    });

    module.exports = router;
