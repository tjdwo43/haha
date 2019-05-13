
$('#find').textbox({
    onChange: function(value, old) {

        if (value != old) selectUser(value);
    },
    onClickButton: function() {

        selectUser($(this).val());
    }
});

function selectUser(value) {

    if (buddyList == null) return;

    $('#buddies').children().remove();
    
    for (var i in buddyList) {

        console.log(value + ' ' + buddyList[i].name)
        
        if (value != undefined && buddyList[i].name.indexOf(value) < 0) continue;

        $('#buddies').append(
            '<li>' +
            '   <img class="select list-image" ' + radius + ' src="' + server2 + buddyList[i].photo + '"/>' +
            '   <button class="member list-button" onclick="invite(' + buddyList[i].id + ')">' + $.lang[currentLanguage][43] + '</button>' +
            '   <div class="select list-name">' + buddyList[i].name + '</div>' +
            '   <div class="select list-email">' + buddyList[i].email + '</div>' +
            '</li>'
        );
    }
}

function invite(id) {

    if (chatInfo == undefined) { alert('Error : Not in chat.html'); return; }

    var user = findById(chatInfo.list, id);
    if (user) {
    //  alert(user.name + '님은 대화에 참여중입니다.');
        alert(user.name + $.lang[currentLanguage][61]);
        return;
    }

    if (chatInfo.type > 0) {

        $.mobile.back();
        
        inviteRequest(id);
    }
    else {
        var participants = {};
        for (i in chatInfo.list) {
            if (chatInfo.list[i].id != myInfo.id) {
                participants.list = [ chatInfo.list[i].id, id ];
                break;
            }
        }
        groupChatRequest(JSON.stringify(participants));

        window.close();
    }
}

function makeChatRequest(id) {

    ipcRenderer.send('makeChatRequest', id);
}

function groupChatRequest(participants) {

    ipcRenderer.send('groupChatRequest', participants);
}

function startChat(chat_id) {

    ipcRenderer.send('start', chat_id);
}
