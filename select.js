
var selects = null;

function selectList() {

    selects = [];

    if (buddyList == null) return;

    $('#buddies').children().remove();
    
    for (var i in buddyList) {

        $('#buddies').append(
            '<li>' +
            '   <img class="select list-image" ' + radius + ' src="' + server2 + buddyList[i].photo + '"/>' +
            '   <input type="checkbox" class="select list-button" onclick="onSelect(this, ' + i + ')">' +
            '   <div class="select list-name">' + buddyList[i].name + '</div>' +
            '   <div class="select list-email">' + buddyList[i].email + '</div>' +
            '</li>'
        );
    }
}

function onSelect(obj, index) {

    var i = selects.indexOf(buddyList[index].id);
    if (i >= 0) selects.splice(i, 1);

    if ($(obj).prop('checked')) {

        selects.push(buddyList[index].id);
    }
}

function create() {

    $.mobile.back();

    if (selects.length == 0) return;

    if (selects.length == 1)
        makeChatRequest(selects[0]);
    else {
        var participants = new Object;
        participants.list = selects;
        groupChatRequest(JSON.stringify(participants));
    }
}

function makeChatRequest(id) {

    ipcRenderer.send('makeChatRequest', id);
}

function groupChatRequest(participants) {

    ipcRenderer.send('groupChatRequest', participants);
}
