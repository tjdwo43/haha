
function buddyRequest() {
    request(
        {
            url: server + '/buddy/read/' + myInfo.id,
        },
        function (error, response, body) {
        
            if (response.statusCode == 200) {
                buddyList = $.parseJSON(body);
                if (buddyList == null) buddyList = [];
                writeData('buddyList', buddyList);
            }
        }
    );
}

function chatRequest() {

    request(
        {
            url: server + '/chat/read/' + myInfo.id,
        },
        function (error, response, body) {

            if (response.statusCode == 200) {

                chatList = $.parseJSON(body);
                if (chatList == null) chatList = [];

                updateChatList();
            }
        }
    );
}

function noticeRequest() {

    var offset = noticeList.length > 0 ? noticeList[0].id : 0;

    request.post(
        {
            url: server + '/notice/list/' + offset,
            form: {
                id: myInfo.id, code: myInfo.code
            }
        },
        function (error, response, body) {

            if (response.statusCode == 200) {
                
                var notices = $.parseJSON(body);
                if (notices == null) notices = [];
                
                for (i in notices) addList(noticeList, notices[i]);

                updateNoticeList();
            }
        }
    );
}

function updateBuddyList() {

    if (buddyList == null) return;
 
    sortByName(buddyList);
    writeData('buddyList', buddyList);

    setBuddyCount(buddyList.length);

    $('#buddyList').children().remove();
    
    for (var i in buddyList) {

        if (buddyList[i].message == null)
            buddyList[i].message = '';
        var status = statusText(buddyList[i].message.replace(/(<([^>]+)>)/ig,""));
        if (status)
            status = '<div class="list-status status-arrow">' + status + '</div>';

        $('#buddyList').append(
            '<li><a href="javascript:userInfo(' + buddyList[i].id + ');">' +
            '   <img class="list-image" ' + radius + ' src="' + server2 + buddyList[i].photo + '"/>' + status +
            '   <div class="list-name">' + buddyList[i].name + '</div>' +
            '   <div class="list-email">' + buddyList[i].email + '</div></a>' +
            '</li>'
        );
    }
}

var userUnknown = [];

function updateChatList() {

    buddyList = readList('buddyList');

    if (!buddyList) return false;
    if (!chatList) return false;

    sortByDateDesc2(chatList);
    writeData('chatList', chatList);

    var count = chatList.length;

    $('#chatList').children().remove();

    var nameList = readList('nameList');

    for (var i in chatList) {

        var chat = chatList[i];

        var photo = 'images/group.png';
        var info = findById(nameList, chat.id);
        var name = info ? info.name : '';
        if (name == '') name = '?';

        var text = getMessage(chat.message.text, chat.message.type);
        if (text == '') { count--; continue; }
        
        chat.list = readList('chatUser-' + chat.id);
        if (chat.list.length == 0) { userUnknown.push(chat.id); continue; }

        if (chat.type == 0) {
            photo = chat.list[0].id == myInfo.id ? chat.list[1].photo : chat.list[0].photo;
        }

        var badge = "";
        var unread = countUnread(chat.id);
        if (unread > 0) {
            badge = '<div class=list-date" style="text-align:right;margin-right:10px"><span class="m-badge">' + unread + '</span></div>';
        }

        $('#chatList').append(
            '<li><a href="javascript:startChat(' + chat.id + ')">' +
            '   <img class="list-image" ' + radius + ' src="' + server2 + photo + '" />' +
            '   <div class="list-date">' + localDateTime(chat.message.cdate) + badge + '</div>' +
            '   <div class="list-name">' + name + '</div>' +
            '   <div class="list-text">' + text + '</div></a>' +
            '</li>'
        );
    }
    
    setChatCount(count);

    if (userUnknown.length == 0)
        updateBuddyList();
    else
        chatUserRequest();
}

function chatUserRequest() {

    if (userUnknown.length == 0) {
        updateChatList();
        updateBuddyList();
        return;
    }

    var chat_id = userUnknown[0];
    userUnknown.splice(0, 1);

    console.log('chatUserRequest, ' + chat_id);

    request(
        {
            url: server + '/chat/user/' + chat_id
        },
        function (error, response, body) {

            if (response.statusCode == 200) {
                
                var chatUser = $.parseJSON(body);
                if (chatUser == null) return;

                writeData('chatUser-' + chat_id, chatUser);

                var chat = findById(chatList, chat_id);
                var nameList = readList('nameList');
                var name = '';

                for (var i in chatUser) {
                    var user = chatUser[i];
                    if (user.id == myInfo.id) continue;
                    addList(buddyList, user);
 
                    if (chat.type == 0) {
                        name = user.name;
                    }
                    else {
                        name += (name == '' ? '' : ', ') + user.name;
                    }
                }
                name = nameText(name);
                addList(nameList, { id: chat.id, name: name });
                writeData('nameList', nameList);
        
                chatUserRequest();
            }
        }
    );
}

function updateNoticeList() {

    if (!noticeList) return;

    sortByDateDesc(noticeList);
    writeData('noticeList', noticeList);

    setNoticeCount(noticeList.length);
    
    $('#noticeList').children().remove();
    
    var unread = 0;
    
    for (var i in noticeList) {

        var badge = "";
        if (noticeList[i].mdate == 'null') {
            badge = ' <span class="m-badge">new</span>';
            unread++;
        }

        var btn = '<span class="m-badge" style="background-color:lightgray;cursor:pointer" onclick="deleteNoticeRequest(' + i + ')"> X </span>&nbsp;&nbsp;&nbsp;';

        $('#noticeList').append(
            '<li>' +
            '   <div class="list-date">' + btn + localDateTime(noticeList[i].cdate) + '</div>' +
            '   <div class="list-type">' + noticeList[i].name + badge + '</div>' +
            '   <div class="list-text" style="cursor:pointer" onclick="readNoticeRequest(' + i + ')">' + noticeList[i].text + '</div>' +
            '</li>'
        );
    }

    setUnreadNotice(unread);
}

function readNoticeRequest(index) {
    
    shell.openExternal(noticeList[index].link + '&token=' + myInfo.password);

    if (noticeList[index].mdate != 'null') return;

    console.log('readNoticeRequest, ' + noticeList[index].id);

    request.post(
        {
            url: server + '/notice/read/' + noticeList[index].id,
            form: {
                id: myInfo.id,
                code: myInfo.code
            }
        },
        function (error, response, body) {

            if (response.statusCode == 200) {
                
                var notice = $.parseJSON(body);
                if (notice == null) return;

                noticeList[index].mdate = notice.mdate;

                updateNoticeList();
            }
        }
    );
}

function deleteNoticeRequest(index) {

    console.log('deleteNoticeRequest, ' + noticeList[index].id);

    request.post(
        {
            url: server + '/notice/delete/' + noticeList[index].id,
            form: {
                id: myInfo.id,
                code: myInfo.code
            }
        },
        function (error, response, body) {

            if (response.statusCode == 200) {
                
                removeById(noticeList, noticeList[index].id);

                updateNoticeList();
            }
        }
    );
}

function deleteNotice() {

    if (confirm('전체 알림 목록을 삭제하시겠습니까?') == false) return;

    request.post(
        {
            url: server + '/notice/delete/0',
            form: {
                id: myInfo.id,
                code: myInfo.code
            }
        },
        function (error, response, body) {

            if (response.statusCode == 200) {
                
                noticeList = null;
                noticeList = [];
                writeData('noticeList', noticeList);
                updateNoticeList();
            }
        }
    );
}

function addMemberRequest(host, id) {

    $.mobile.back();

    request.post(
        {
            url: server + '/buddy/member/' + myInfo.id + '/' + id,
            form: {
                code: myInfo.code,
                host: host
            }
        },
        function (error, response, body) {

            if (error) {
                console.log(error);
            }
            else if (response.statusCode == 200) {
                
                var buddy = $.parseJSON(body);
                if (buddy == null) return;

                addBuddy(buddy);
                updateBuddyList();
            }
        }
    );
}

function getMessage(text, type) {

    if (type == 0) return messageText(b64DecodeUnicode(text));
    if (type == 1) return $.lang[currentLanguage][71]; // '사진전송';
    if (type == 2) return $.lang[currentLanguage][72]; // '파일전송';
    if (type == 110) return $.lang[currentLanguage][73]; // '초대알림';
    if (type == 120) return $.lang[currentLanguage][74]; // '퇴장알림';
    return '';
}