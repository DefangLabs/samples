(function () {
    function E(id) { return document.getElementById(id); }
    function parse(val) {
        if (/^ *[a-zA-Z]+([- ][a-zA-Z]+)* *$/.test(val))
            return 1;
        if (/^https?:\/\/.+$/.test(val))
            return 2;
        if (/^.+\.[a-z]{2,10}(\/.*)?$/.test(val))
            return 2;
        return 0;
    }
    function showMessage(msg) {
        E("subscript").innerText = msg;
    }
    function updateIcon(element) {
        var valid = parse(element.value);
        element.className = valid > 0 ? 'fx-validation-valid' : 'fx-validation-invalid';
        return valid;
    }
    function validate() {
        var elem = E('e0634313e85b5af90e2e7650ea8fefff');
        var t = updateIcon(elem);
        if (t != 0)
            submitting();
        if (t == 1) {
            window.location.href = encodeURIComponent(elem.value);
            var item = {code: elem.value, url: window.location.protocol + "//" + window.location.host + "/" + encodeURIComponent(elem.value)};
            addHistory(history.find(function(e){return e.code === item.code}) || item, true);
        }
        return t == 2;
    }
    function submitting() {
        var button = E('ce2be5e38cec02742dcb8a3d3306323c');
        button.disabled = true;
        button.value = 'wait...';
    }
    function addToFavorites(url, name) {
        if (window.sidebar) { // Mozilla Firefox
            window.sidebar.addPanel(name, url, "");
        } else if (window.external) { // IE
            window.external.AddFavorite(url, name);
        } else if (window.opera && window.print) {
            window.external.AddFavorite(url, name);
        } else {
            throw "Not supported";
        }
    }
    function reset() {
        var button = E('ce2be5e38cec02742dcb8a3d3306323c');
        button.disabled = false;
        button.value = 'noun it!';
        var elem = E('e0634313e85b5af90e2e7650ea8fefff');
        elem.setSelectionRange(0, elem.value.length);
        elem.focus();
        E("history").innerHTML = "";
        for (var r in history) {
            addHistoryNode(history[r]);
        }
    }
    function newUUID() {
        if (window.crypto && window.crypto.randomUUID) {
            return window.crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
    function deleteWord(r) {
        addHistory({code: r.code});
        if (r.etag) {
            var xhr = new XMLHttpRequest();
            xhr.open("DELETE", "/", true);
            xhr.setRequestHeader("x-client-trace-id", newUUID());
            xhr.setRequestHeader("Content-Type", "application/json;charset=utf-8");
            xhr.send(JSON.stringify(r));
        }
    }
    function addHistoryNode(r) {
        var d = document.createElement("div");
        var a = document.createElement("a");
        var date = new Date(r.date);
        if (!(new Date() - date < 1000*60*60*24)) a.className = "expired";
        a.setAttribute("data-etag", r.etag);
        a.setAttribute("data-date", r.date);
        a.title = r.origUrl || r.url;
        a.href = r.url;
        a.appendChild(document.createTextNode(r.code));
        d.appendChild(a);
        a = document.createElement("a");
        a.className = "delete";
        a.title = "Delete";
        a.addEventListener("click", function(e) { deleteWord(r); });
        d.appendChild(a);
        E("history").insertBefore(d, E("history").firstChild);
    }
    var history = [];
    function addHistory(response, quiet) {
        history = history.filter(function(e){return e.code !== response.code;});
        response.date = new Date();
        if (response.url) history.push(response);
        if (!quiet) reset();
        window.localStorage.setItem("history", JSON.stringify(history));
    }
    function speak(word) {
        var msg = new SpeechSynthesisUtterance('Nounly ' + word);
        window.speechSynthesis.speak(msg);
    }
    function onResponse(response, elem, etag) {
        response.origUrl = elem.value;
        document.title = "nounly " + response.code;
        E('logo').innerHTML = '';
        E('qrcode').innerHTML = '';
        if (response.error) {
            reset();
            return showMessage(response.error);
        }
        etag.value = response.etag;
        elem.value = response.url;
        showMessage('Just tell your friends \"nounly '+response.code+'\". Note: nouns are reserved for 24 hours.');
        if (window.speechSynthesis) {
            var a = document.createElement('a');
            a.setAttribute('href', '#');
            a.innerHTML = '&#x25b6;&#xfe0f;';
            a.addEventListener('click', e => speak(response.code));
            E('subscript').appendChild(a);
        }
        E('logo').innerText = response.url.replace(/^https?:\/\//,'');
        new QRCode(E("qrcode"), {
            text: response.url,
            width : 150,
            height : 150
        });
        addHistory(response);
    }
    function post(retry) {
        var elem = E('e0634313e85b5af90e2e7650ea8fefff');
        var etag = E('fce144c50113a926032de2b895a0cb07');
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/", true);
        xhr.setRequestHeader("x-client-trace-id", newUUID());
        xhr.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        xhr.setRequestHeader("Accept", "application/json");
        xhr.onreadystatechange = function(x) {
            if (xhr.readyState !== 4) return;
            if (xhr.status === 0 && !retry) return post(true);
            var response = JSON.parse(xhr.responseText);
            onResponse(response, elem, etag);
        };
        function proofOfWork(nonce) {
            var json = JSON.stringify({url:elem.value,etag:etag.value||'',nonce:nonce,date:new Date});
            if (!window.crypto || !window.crypto.subtle || !window.crypto.subtle.digest) {
                return xhr.send(json);
            }
            var buffer = new TextEncoder("utf-8").encode(json);
            return window.crypto.subtle.digest("SHA-256", buffer)
                .then(function(ab) {
                    if (Math.clz32(new DataView(ab).getUint32(0)) >= 13) // this should match the server
                        return xhr.send(json);
                    else
                        return proofOfWork(1 + nonce);
                });
        }
        return proofOfWork(0);
    }
    function init() {
        var query = decodeURIComponent(location.search.substr(1) + location.hash);
        var elem = E('e0634313e85b5af90e2e7650ea8fefff');
        elem.value = decodeURIComponent(query);
        elem.onchange = elem.oninput = function (e) { updateIcon(e.target); };
        E('form1').onsubmit = function (e) { e.preventDefault(); if (validate()) post(); return false; };
        window.addEventListener('pageshow', reset);
        history = JSON.parse(window.localStorage.getItem("history")) || [];
        if (parse(query) == 1) {
            elem.className = 'fx-validation-invalid';
            showMessage("Unknown nounly. Perhaps a typo or the noun has expired.");
            addHistory({code: query});
        }
        reset();
    }
    var wantUrl = window.location.href.replace("http://noun", "https://noun");
    if (window.location.href !== wantUrl) {
        return window.location.replace(wantUrl);
    }
    setTimeout(init, 0);
})();
