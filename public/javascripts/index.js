$(function () {
    getAllAddress();
    getAllStreams();
    var overlay = $('.overlay');
    var header = $('.overlay-header');
    var content = $('.overlay-content');
    var download = $('#download');
    var addresses = [];
    var streams = [];

    $('#create-stream-form').on('submit', createStream);
    $('#publish-stream-form').on('submit', publishStream);
    $('#view-stream-form').on('submit', viewStream);
    $('#read-form').on('submit', readTransaction);
    $('#read-headers-form').on('submit', readHeaders);
    $('#write-form').on('submit', writeTransaction);
    $('.overlay-btn').on('click', closeOverlay);
    $('#address-refresh').on('click', getAllAddress);
    $('#stream-refresh').on('click', getAllStreams);

    function getAllAddress(){
        $.get('/mc/get-all-addresses')
            .then(function (data) {
                addresses = data;
                $('#address').empty();
                $('#address').append(addresses.map(d => "<option value="+d+">"+d+"</option>").join("\n"));
            })
            .catch(function (err) {
                console.log(err);
            })
    }

    function getAllStreams(){
        $.get('/mc/get-all-streams')
            .then(function (data) {
                streams = data;
                console.log(streams);
                $('#stream-name').empty();
                $('#stream-name').append(streams.map(d => 
                    "<option value="+d['name']+">"+ d['name']+"</option>").join("\n"));
            })
            .catch(function (err) {
                console.log(err);
            })
    }

    function readHeaders(e) {
        e.preventDefault();
        var blockParam = $('#read-headers-input').val();
        if (blockParam) {
            $.get('/mc/read-header/' + blockParam)
                .then(function (data) {
                    displayResponse(data, 'Block ' + blockParam + ' Headers');
                })
                .catch(function (err) {
                    displayResponse(err, 'ERROR!!!', true);
                })
        }
    }

    function readTransaction(e) {
        e.preventDefault();
        var txid = $('#read-input').val();
        if (txid) {
            $.get('/mc/read/' + txid)
                .then(function (data) {
                    displayResponse(data, 'Transaction txid: ' + txid);
                })
                .catch(function (err) {
                    displayResponse(err, 'ERROR!!!', true);
                })
        }

    }

    function writeTransaction(e) {
        e.preventDefault();
        var transaction = $('#write-input').val();
        if (transaction) {
            transaction = transaction.split(';');
            var params = {
                transactionsList: JSON.parse(transaction[0]),
                addresses: transaction[1] ? JSON.parse(transaction[1]) : null
            };
            $.ajax({
                type: 'POST',
                url: '/mc/write',
                data: JSON.stringify(params),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
                .then(function (data) {
                    displayResponse(data, 'Transaction has been written');
                })
                .catch(function (err) {
                    displayResponse(err, 'ERROR!!!', true);
                })
        }
    }

    function createStream(e) {
        e.preventDefault();
        var address = $('#address').val();
        var stream = $('#stream-name').val();
        var params = { address: address, stream: stream };
        $.ajax({
            type: 'POST',
            url: '/mc/create-stream',
            data: JSON.stringify(params),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json'
        })
        .then(function (datao) {
            $.ajax({
                type: 'POST',
                url: '/mc/subscribe',
                data: JSON.stringify(params),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
            .then(function (data) {
                console.log(data);
                displayResponse(datao, 'Stream Created');
            })
            .catch(function (err) {
                console.log(err);
            })
            
        })
        .catch(function (err) {
            displayResponse(err, 'ERROR!!!', true);
        })
    }

    function publishStream(e) {
        e.preventDefault();
        var address = $('#address').val();
        var stream = $('#stream-name').val();
        var key = $('#stream-key').val();
        var data = $('#stream-data-text').val();
        var files = document.getElementById('files').files;
        if (files.length > 0){
            var reader = new FileReader();

            reader.onload = function(e) {
                var text = reader.result;
                var params = { address: address, stream: stream, data: text, key:key };
                $.ajax({
                    type: 'POST',
                    url: '/mc/publish-stream',
                    data: JSON.stringify(params),
                    contentType: 'application/json; charset=utf-8',
                    dataType: 'json'
                })
                .then(function (data) {
                    displayResponse(data, 'Stream Published');
                })
                .catch(function (err) {
                    displayResponse(err, 'ERROR!!!', true);
                })
            }
            reader.readAsDataURL(files[0]);
        } else {
            var params = { address: address, stream: stream, data: data, key:key };
            $.ajax({
                type: 'POST',
                url: '/mc/publish-stream',
                data: JSON.stringify(params),
                contentType: 'application/json; charset=utf-8',
                dataType: 'json'
            })
            .then(function (data) {
                displayResponse(data, 'Stream Published');
            })
            .catch(function (err) {
                displayResponse(err, 'ERROR!!!', true);
            })
        }
    }

    function viewStream(e) {
        e.preventDefault();
        var txid = $('#txid').val();
        var stream = $('#stream-name').val();
        var params = { txid: txid, stream: stream};
        $.ajax({
            type: 'POST',
            url: '/mc/view-stream',
            data: JSON.stringify(params),
            contentType: 'application/json; charset=utf-8',
            dataType: 'json'
        })
        .then(function (data) {
            if (data && typeof data === 'string' ){
                download.attr('href', data);
                download.text("Download");
            } else {
                displayResponse(data, 'View Stream');
            }
        })
        .catch(function (err) {
            displayResponse(err, 'ERROR!!!', true);
        })
    }

    function displayResponse(data, text, error) {
        overlay.show();
        header.text(text);
        content.append(JSON.stringify(data));
        if (error) {
            header.addClass('overlay-header_error');
        }
    }

    function closeOverlay() {
        header.empty().removeClass('overlay-header_error');
        content.empty();
        overlay.hide();
    }
});