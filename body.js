require('./renderer.js');

$('#ok').on('click', function() {
    
    ipcRenderer.send('shortcut', chat_id);
});

$('#edit').on('click', toggleEdit);

function toggleEdit() {

    if ($('#name_edit').css('display') == 'none') {
        $('#name_edit').show();
        $('#name_text').textbox('setText', chatInfo.name);
        window.resizeTo(window.outerWidth, window.outerHeight + 1);
        return;
    }
    else {
        $('#name_edit').hide();
        $('#name_text').textbox('setText', '');
        window.resizeTo(window.outerWidth, window.outerHeight - 1);
    }
}

$('#add').on('click', function() {

    $.mobile.go('#select');

    selectUser();
});
    
$('#man').on('click', function() {

    $.mobile.go('#participant');

    participantList();
});

$('#remove').on('click', function() {

//  if (confirm('대화방에서 나가시면 대화내용이 모두 지워집니다. 계속하시겠습니까?') == false) return;
    if (confirm($.lang[currentLanguage][67]) == false) return;

    exitRequest();
});

$('footer').keydown(function(e) {

    if (e.keyCode == 27) {
        close2();
    }
    else if (e.keyCode == 116) {
        messageRequest();
    }
    else if (e.ctrlKey && e.keyCode == 13) {
        $('#text').textbox('setText', $('#text').textbox('getText') + '\r');
    }
    else if (e.shiftKey && e.keyCode == 13) {
        
    }
    else if (e.keyCode == 13) {
        e.preventDefault();
        sendRequest($('#text').textbox('getText'));
    }
});

$('#text').textbox({
    onClickButton: function() {
        sendRequest($('#text').textbox('getText'));
    }
});

$('#main').on('drop', function(e) {
    e.preventDefault();
    var formData = new FormData();
    var files = e.originalEvent.dataTransfer.files;
    if (files == null || files.length == 0) return;
    if (files.length > 1) {
    //  alert('사진 및 파일은 1개 씩 전송이 가능합니다.');
        alert($.lang[currentLanguage][68]);
        return;
    }
    if (isImageFile(files[0].path))
        sendMedia(files[0].path);
    else
        sendFile(files[0].path);
});

$('#name_edit').keydown(function(e) {

    if (e.keyCode == 27) {
        toggleEdit();
    }
    else if (e.keyCode == 13) {
        e.preventDefault();
        editName() ;
    }
});

$('#name_text').textbox({
    onClickButton: function() {
        editName() ;
    }
});

function editName() {
    var text = $('#name_text').textbox('getText');
    if (chatInfo.name != text) {
        setTitle(text);
        var nameList = readList('nameList');
        var obj = findById(nameList, chatInfo.id)
        if (obj)
            obj.name = text;
        else
            addList(nameList, { id: chatInfo.id, name: text } );
        writeData('nameList', nameList);
    }
    toggleEdit();
}

var selected = 0;
$(document).bind('contextmenu', function(e) {
    if (e.target.className == 'list-time-in' ||
        e.target.className == 'list-time-out') {
        e.preventDefault();
        selected = e.target.offsetParent.id;
        $('#mm2').menu('show', {
            left: e.pageX,
            top: e.pageY
        });
    }
});

$('#delete').on('click', function(e) {
    $('#' + selected).remove();
    removeById(messageList, selected);
    writeData('messageList-' + chatInfo.id, messageList);
});

function setTitle(text) {

    if (text == undefined)
        text = chatInfo.name;
    else
        chatInfo.name = text;
    if (chatInfo.type == 1)
        text += ' (' + chatInfo.list.length + ')';
    $('#title').text(text);
}

function prepare() {
    
    var nameList = readList('nameList');
    var obj = findById(nameList, chatInfo.id);
    if (obj) {
        setTitle(obj.name);
    }
    else {
        var name = '';
        for (i in chatInfo.list) {
            var user = chatInfo.list[i];
            if (user.id == myInfo.id) continue;
            name += (name == '' ? '' : ', ') + user.name;
        }
        name = nameText(name);
        addList(nameList, { id: chatInfo.id, name: name });
        writeData('nameList', nameList);
        setTitle(name);
    }

    if (chatInfo.type == 0) $('#edit').hide();

    for (var i in messageList) {

        var message = messageList[i];
        var pdate = i > 0 ? messageList[i - 1].cdate : '';

        if (message.type == 110)
            messageInvite(message.user_id, message.memo, message.cdate, false, pdate)

        else if (message.type == 120)
            messageExit(message.user_id, message.cdate, false, pdate);

        else if (message.user_id == myInfo.id)
            messageOut(message.type, message.text, message.cdate, message.id, pdate, message.sent - message.repl);

        else
            messageIn(message.user_id, message.type, message.text, message.cdate, message.memo, message.id, pdate);
    }

    scroll();

    messageRequest();
}

function messageIn(user_id, type, text, cdate, memo, id, pdate) {

    var id = getCommand(text, type);
    if (id > 0) {
        if (id == myInfo.id) exitRequest();
        return;
    }

    checkDate(cdate, pdate);

    var user = findById(buddyList, user_id);
    if (user == null) return;

    if (type == 0)
        text = '<div class="list-text-in arrow-in">' + b64DecodeUnicode(text) + '</div>';
    else if (type == 1)
        text = '<img class="list-image-in" src="' + server2 + text + '" onclick="showImage(\'' + server2 + text + '\')"/>';
    else if (type == 2)
        text = '<div class="list-text-in arrow-in"><a href="javascript:downloadFile(\'' + server2 + text + '\')">File : ' + text.split('/')[3] + '</a></div>';

    $('#chat').append(
        '<li id="' + id + '">' +
        '   <img class="list-photo-in" ' + radius + ' src="' + server2 + user.photo + '" onclick="userInfo(' + user.id + ')"/></a>' +
        '   <div class="list-name-in">' + user.name + '</div>' + text +
        '   <span class="list-time-in" style="cursor:pointer">' + localTime(cdate) + '</span>' +
        '</li>'
    );
}

function messageOut(type, text, cdate, id, pdate, unread) {

    checkDate(cdate, pdate);
    
    if (type == 0)
        text = '<div class="list-text-out arrow-out">' + b64DecodeUnicode(text) + '</div>';
    else if (type == 1)
        text = '<img class="list-image-out" src="' + server2 + text + '" onclick="showImage(\'' + server2 + text + '\')"/>';
    else if (type == 2)
        text = '<div class="list-text-out arrow-out"><a href="javascript:downloadFile(\'' + server2 + text + '\')">File : ' + text.split('/')[3] + '</a></div>';

    if (unread == 0) unread = '';
    var element = '<span id = "unread-' + id + '" style="color:black">' + unread + '</span>';

    $('#chat').append(
        '<li id="' + id + '">' + text + '<div class="list-time-out" style="cursor:pointer">' + element + ' ' + localTime(cdate) + '</div></li>'
    );
}

function messageInvite(user_id, memo, cdate, update, pdate) {

    var peer = null;
    try { peer = $.parseJSON(memo); } catch(e) { return; }
    if (peer == null) return;

    checkDate(cdate, pdate);
    
    var user = findById(buddyList, user_id);
//  var text = '님을 초대하셨습니다.';
    var text = $.lang[currentLanguage][69];
    if (user)
        message(user.name + ' : ' + peer.name + text, cdate);
    else
        message(peer.name + text, cdate);

    if (update == false) return;

    addBuddy(peer);
    sortByName(buddyList)
    writeData('buddyList', buddyList);

    addList(chatInfo.list, peer);
    writeData('chatUser-' + chatInfo.id, chatInfo.list);

    setTitle();
}

function messageExit(user_id, cdate, update, pdate) {

    checkDate(cdate, pdate);
    
    var user = findById(buddyList, user_id);
//  var text = '퇴장하셨습니다.';
    var text = $.lang[currentLanguage][70];
    if (user)
        message(user.name + text, cdate);
    else
        message(text, cdate);

    if (update == false) return;

    removeById(chatInfo.list, user.id);
    writeData('chatUser-' + chatInfo.id, chatInfo.list);

    setTitle();
}

function message(text, cdate) {

    if (cdate == undefined)
        text = '<li style="text-align:center"><span class="date">' + text + '</span></li>';
    else
        text = '<li style="color:blue;text-align:center">' + text + ' (' + localTime(cdate) + ')</li>';

    $('#chat').append( text );
}

function checkDate(cdate, pdate) {

    var date = new Date(cdate + ' UTC');
    if (pdate != '') {
        var prev = new Date(pdate + ' UTC');
        if (prev.toDateString() == date.toDateString()) return;
    }
    if (isToday(cdate))
    //  message('오늘');
        message($.lang[currentLanguage][47]);
    else
        message(date.toLocaleDateString());
}

function scroll(stop) {
    var val = $("#main")[0].scrollHeight;
    $("#main").scrollTop(val);
    console.log('scroll : ' + val);
    if (stop) return;
    if (messageList.length == 0) return;
    if (messageList[messageList.length - 1].type == 1) setTimeout(scroll, 3000, true);
}

function showImage(url) {

    shell.openExternal(url);
}

function downloadFile(url) {

    shell.openExternal(url);
}

function close2() {

    ipcRenderer.send('close', chatInfo.id);
}

function participantList() {

    $('#users').children().remove();

    var users = chatInfo.list;
    for (var i in users) {

        if (users[i].id == myInfo.id) continue;

        $('#users').append(
            '<li><a href="javascript:userInfo(' + users[i].id + ')">' +
            '   <img class="member list-image" ' + radius + ' src="' + server2 + users[i].photo + '"/>' +
            '   <div class="member list-name">' + users[i].name + '</div>' +
            '   <div class="member list-email">' + users[i].email + '</div></a>' +
            '</li>'
        );
    }
}

// Message request
ipcRenderer.on('message', function(e) { messageRequest() });

// Message reply
ipcRenderer.on('reply', function(e) { 

    var index = indexOfReply(messageList, messageList.length - 1);
    increaseReply(messageList, index);
    for (var i = index; i < messageList.length; i++) {
        if (checkMessage(messageList[i]) > 0) continue;
        var unread = messageList[i].sent - messageList[i].repl;
        if (unread == 0) unread = '';
        $('#unread-' + messageList[i].id).text(unread);
    }
    writeData('messageList-' + chatInfo.id, messageList);
});
